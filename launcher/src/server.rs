use std::process::{Command, Stdio};
use std::thread;
use std::io::{BufRead, BufReader};
use std::net::{TcpStream, TcpListener};
use std::sync::OnceLock;
use std::sync::{Arc, Mutex};
use std::sync::atomic::Ordering;
use std::collections::VecDeque;
use std::io::Write;
use chrono::Local;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use crate::app::ScuttleGUI;

/// singleton for rust gui tcp port
static CONTROL_LISTENER: OnceLock<TcpListener> = OnceLock::new();

/// how many logs to allow
const MAX_LOG_LINES: usize = 100;

/// Flag for 'No Window' in Windows API
const CREATE_NO_WINDOW: u32 = 0x08000000;


/// Binds a TCP listener to a free port on localhost (127.0.0.1)
/// and stores it in the `CONTROL_LISTENER` singleton.
///
/// # Returns
/// - `Ok(port)` with the allocated port number if binding succeeds.
/// - `Err` if binding fails or the listener is already bound.
pub fn bind_control_port() -> std::io::Result<u16> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let port = listener.local_addr()?.port();

    CONTROL_LISTENER.set(listener).map_err(|_| std::io::Error::new(
        std::io::ErrorKind::AlreadyExists,
        "CONTROL_LISTENER already bound",
    ))?;

    Ok(port)
}

/// Accepts an incoming TCP connection on the `CONTROL_LISTENER`.
/// This is a blocking call until a client connects.
///
/// # Returns
/// - `Ok(TcpStream)` representing the connected client.
/// - `Err` if accepting the connection fails.
fn accept_control_connection() -> std::io::Result<TcpStream> {
    let listener = CONTROL_LISTENER.get().unwrap();
    let (stream, _) = listener.accept()?; //blocking accept
    
    Ok(stream)
}

/// Appends a log message to a thread-safe queue, ensuring
/// the number of stored logs does not exceed `MAX_LOG_LINES`.
///
/// # Parameters
/// - `logs`: Arc<Mutex<VecDeque<String>>> - shared thread-safe log storage
/// - `msg`: Message string to append
pub fn append_log_threadsafe(logs: &Arc<Mutex<VecDeque<String>>>, msg: impl Into<String>) {
    let now = Local::now();
    let timestamped_msg = format!("[{}] {}", now.format("%Y-%m-%d %H:%M:%S"), msg.into());

    let mut logs = logs.lock().unwrap();
    logs.push_back(timestamped_msg);

    if logs.len() > MAX_LOG_LINES {
        logs.pop_front();
    }
}


/// Spawns a background thread to monitor a process output stream (stdout or stderr).
///
/// This function reads from the provided `reader` line-by-line, formats the output 
/// with a prefix, and performs the following actions:
/// 1. Appends the formatted line to the shared `VecDeque` logs.
/// 2. If a `file_path` is provided, appends the line to that file.
/// 3. Triggers a UI repaint via the `egui::Context`.
///
/// # Arguments
/// * `reader` - The input stream to monitor (e.g., `ChildStdout` or `ChildStderr`).
/// * `prefix` - A label to prepend to each log line (e.g., "OUT" or "ERR").
/// * `logs` - An `Arc<Mutex>` wrapping a `VecDeque` for thread-safe UI logging.
/// * `ctx` - The egui context used to request a repaint after new data arrives.
/// * `file_path` - An optional path to a file where logs should be persisted.
///
/// # Returns
/// A `JoinHandle<()>` for the spawned monitoring thread.
pub fn monitor_pipe<R: std::io::Read + Send + 'static>(
    reader: R,
    prefix: &'static str,
    logs: Arc<Mutex<VecDeque<String>>>,
    ctx: eframe::egui::Context,
    file_path: Option<String>,
    show_prefix: bool,
) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        let reader = BufReader::new(reader);
        //use split(b'\n') to manually handle potential non-UTF8 characters like emojis
        for line_result in reader.split(b'\n') {
            if let Ok(line_bytes) = line_result {
                let line = String::from_utf8_lossy(&line_bytes);
                let formatted = if show_prefix {
                    format!("[{}] {}", prefix, line)
                } else {
                    line.to_string()
                };

                //update ui logs
                append_log_threadsafe(&logs, formatted.clone());

                //optionally log to file
                if let Some(ref path) = file_path {
                    if let Ok(mut file) = std::fs::OpenOptions::new()
                        .create(true)
                        .append(true)
                        .open(path) 
                    {
                            let _ = writeln!(file, "{}", formatted);
                    }
                }

                //tell egui to refresh
                ctx.request_repaint();
            }
        }
    })
}


/// Attempts to locate a valid Python executable on the system and stores it in the app state.
///
/// This function performs the following steps:
/// 1. Executes the Windows `where python` command to find all absolute paths.
/// 2. Filters out the Microsoft Store "shim" (which often triggers prompts or failures 
///    when called programmatically) by excluding paths containing "WindowsApps".
/// 3. Falls back to the `py` launcher if `where` fails.
/// 4. Defaults to "python" as a final attempt if no specific path is verified.
///
/// # Arguments
/// * `app` - A mutable reference to the `ScuttleGUI` state to update the `python_cmd`.
pub fn detect_and_set_python(app: &mut ScuttleGUI) {
    //python-launcher crate has some kind of deprecated dependency on termcolor(?) so try the which crate
    let logs = app.logs.clone();
    
    let candidates = if cfg!(windows) {
        vec!["python.exe", "python", "py"]
    } else {
        vec!["python3", "python"]
    };

    for cmd in candidates {
        if let Ok(path) = which::which(cmd) {
            let path_str = path.to_string_lossy().to_string();

            //windows shim filter
            if cfg!(windows) && path_str.contains("WindowsApps") {
                continue;
            }

            app.python_cmd = path_str;
            if app.verbose {
                append_log_threadsafe(&logs, format!("✅ Found Python: {}", app.python_cmd));
            }
            return;
        }
    }

    //hail mary
    app.python_cmd = "python".to_string();
    append_log_threadsafe(&logs, "⚠️ No verified Python path found. Trying default 'python'.".to_string());
}

/// Checks for the existence of a virtual environment to determine if the backend is "installed".
///
/// This is a lightweight check that looks for a `venv` directory within the application's 
/// root directory. It updates the `is_installed` atomic boolean accordingly.
///
/// # Arguments
/// * `app` - A mutable reference to the `ScuttleGUI` state.
pub fn setup_exists(app: &mut ScuttleGUI) {
    let venv_dir = app.root_dir.join("venv");
    app.is_installed.store(venv_dir.exists(), Ordering::SeqCst); //this is a very simple implementation of checking setup
}

/// Executes the backend setup process as a child process.
///
/// This function spawns the Python backend with the `--setup` flag and manages the lifecycle 
/// of the installation. It performs the following:
/// 1. Sets the `is_installing` atomic flag to `true` to notify the UI.
/// 2. Pipes `stdout` and `stderr` to `monitor_pipe` for real-time logging and (optional) 
///    file persistence.
/// 3. Spawns a watcher thread to wait for the process to exit, which then updates 
///    the `is_installed` and `is_installing` flags based on the exit status.
///
/// # Arguments
/// * `app` - A mutable reference to the `ScuttleGUI` state.
pub fn run_setup(app: &mut ScuttleGUI) {
    let logs = app.logs.clone();
    let ctx = app.egui_ctx.as_ref().unwrap().clone();

    //atomic bools to edit across threads
    let is_installed = app.is_installed.clone();
    let is_installing = app.is_installing.clone();

    is_installing.store(true, Ordering::SeqCst);
    ctx.request_repaint();

    let mut cmd = Command::new(&app.python_cmd);
    cmd.current_dir(&app.root_dir)
        .arg("main.py")
        .arg("--setup");

    //debug mode
    let mut debug_file = None;
    if app.verbose {
        cmd.arg("-v");
        
        debug_file = Some("setup_debug.txt".to_string());
        append_log_threadsafe(&logs, format!("Executing: {} main.py --setup -v", app.python_cmd));    
    }

    #[cfg(windows)]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.env("PYTHONIOENCODING", "utf-8"); //forces python stdout/stderr to be UTF-8
    }

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = match cmd.spawn() {
        Ok(child) => {
            append_log_threadsafe(&logs, "Starting setup...");
            append_log_threadsafe(&logs, "Please don't close this window.");
            child
        }
        Err(e) => {
            append_log_threadsafe(&logs, format!("⚠️ Failed to launch Python: {}", e));
            is_installing.store(false, Ordering::SeqCst);
            ctx.request_repaint();
            return;
        }
    };

    //take the pipes
    let stdout = child.stdout.take().expect("Failed to capture stdout");
    let stderr = child.stderr.take().expect("Failed to capture stderr");
        
    //start monitoring both streams independently
    monitor_pipe(stdout, "OUT", logs.clone(), ctx.clone(), debug_file.clone(), app.verbose);
    monitor_pipe(stderr, "ERR", logs.clone(), ctx.clone(), debug_file, true);

    //watcher thread to clean up status flags
    thread::spawn(move || {
        let status = child.wait();
        let success = status.map(|s| s.success()).unwrap_or(false);

        if success {
            append_log_threadsafe(&logs, "✅ Setup complete!");
            is_installed.store(true, Ordering::SeqCst);
        } else {
            append_log_threadsafe(&logs, "⚠️ Setup failed.");
        }

        is_installing.store(false, Ordering::SeqCst);
        ctx.request_repaint();
    });
}

/// Starts the Python backend script as a child process and sets up
/// the control communication channel and stdout logging.
///
/// # Parameters
/// - `app`: mutable reference to `ScuttleGUI`, used to store
///          the child process handle and TCP stream.
pub fn start(app: &mut ScuttleGUI) {
    let logs = app.logs.clone(); //have to clone the <Arc<Mutex>> because &app is not threadsafe
    let ctx = app.egui_ctx.as_ref().unwrap().clone();
    
    //determine venv/ python
    let python = if cfg!(windows) {
        app.root_dir.join("venv").join("Scripts").join("python.exe")
    } else {
        app.root_dir.join("venv").join("bin").join("python")
    };

    let mut cmd = Command::new(python);
    cmd.current_dir(&app.root_dir)
        .arg("-u") //unbuffered for real time logging
        .arg("main.py");

    //debug mode
    let mut debug_file = None;
    if app.verbose {
        cmd.arg("-v");

        debug_file = Some("server_log.txt".to_string());
        append_log_threadsafe(&logs, format!("Executing: {} main.py -v", app.python_cmd));    
    }

    #[cfg(windows)]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.env("PYTHONIOENCODING", "utf-8"); //forces python stdout/stderr to be UTF-8
    }

    //gui communication channel
    let port = app.control_port;
    cmd.arg("--control-port")
        .arg(port.to_string());

    //new webhook settings
    let save_url = app.webhook_url.clone();
    if app.webhook_dirty {
        app.webhook_dirty = false;
        cmd.arg("--set-webhook")
            .arg(&app.webhook_url);        
    }

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = match cmd.spawn() {
        Ok(child) => child,
        Err(e) => {
            append_log_threadsafe(&logs, format!("⚠️ Failed to spawn Python: {}", e));
            ctx.request_repaint();
            return; //exit function early
        }
    };

    //take the pipes
    let stdout = child.stdout.take().expect("Failed to capture stdout");
    let stderr = child.stderr.take().expect("Failed to capture stderr");
        
    //start monitoring both streams independently
    monitor_pipe(stdout, "OUT", logs.clone(), ctx.clone(), debug_file.clone(), app.verbose);
    monitor_pipe(stderr, "ERR", logs.clone(), ctx.clone(), debug_file, true);
    
    //blocking accept
    let control_stream = accept_control_connection()
        .expect("Failed to accept control connection");

    app.mark_server_started(child, control_stream, save_url);
}

/// Stops the Python backend by sending a STOP command over the
/// control TCP stream and updates GUI state.
///
/// # Parameters
/// - `app`: mutable reference to `ScuttleGUI`
pub fn stop(app: &mut ScuttleGUI) {
    if let Some(stream) = &mut app.control_stream {
        let _ = stream.write_all(b"STOP\n");
    }

    app.mark_server_stopped();
}

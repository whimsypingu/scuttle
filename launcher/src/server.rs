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

pub fn detect_and_set_python(app: &mut ScuttleGUI) {
    //python-launcher crate has some kind of deprecated dependency on termcolor.?
    let logs = app.logs.clone();
    
    // 1. Check for 'where python', which lists all absolute paths
    let output = std::process::Command::new("where")
        .arg("python")
        .output();

    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        
        for path in stdout.lines() {
            let trimmed = path.trim();
            // 2. Filter out the Microsoft Store "fake" python shim
            if !trimmed.contains("WindowsApps") && trimmed.ends_with("python.exe") {
                app.python_cmd = trimmed.to_string();
                if app.verbose {
                    append_log_threadsafe(&logs, format!("✅ Python found: {}", app.python_cmd));
                }
                return; 
            }
        }
    }

    // 3. Fallback: If 'where' fails, try the 'py' launcher which is usually safe
    if std::process::Command::new("py").arg("--version").spawn().is_ok() {
        app.python_cmd = "py".to_string();
    } else {
        app.python_cmd = "python".to_string(); // Final hail mary
        append_log_threadsafe(&logs, "No verified Python path found. Using default.");
    }
}
pub fn setup_exists(app: &mut ScuttleGUI) {
    let venv_dir = app.root_dir.join("venv");
    app.is_installed.store(venv_dir.exists(), Ordering::SeqCst); //this is a very simple implementation of checking setup
}

pub fn run_setup(app: &mut ScuttleGUI) {
    let logs = app.logs.clone();
    let ctx = app.egui_ctx.as_ref().unwrap().clone();

    //atomic bools to edit across threads
    let is_installed_flag = app.is_installed.clone();
    let is_installing_flag = app.is_installing.clone();
    is_installing_flag.store(true, Ordering::SeqCst);

    ctx.request_repaint();

    let mut cmd = Command::new(&app.python_cmd);
    cmd.current_dir(&app.root_dir)
        .arg("main.py")
        .arg("--setup");

    //debug mode
    if app.verbose {
        cmd.arg("-v");
        append_log_threadsafe(&logs, format!("Executing: {} main.py --setup", app.python_cmd));    
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
            append_log_threadsafe(&logs, format!("Failed to launch Python: {}", e));
            app.is_installing.store(false, Ordering::SeqCst);
            ctx.request_repaint();
            return;
        }
    };

    //capture stdout
    let stdout = match child.stdout.take() {
        Some(s) => s,
        None => {
            append_log_threadsafe(&logs, "Failed to capture stdout".to_string());
            ctx.request_repaint();
            let _ = child.kill();
            return;
        }
    };
    let stderr = child.stderr.take().expect("Failed to capture stderr");
        

    // --- WATCHER THREAD ---
    // inside run_setup...
    let log_file_name = "setup_debug.txt".to_string(); // Owned string

    thread::spawn(move || {
        let logs_err = logs.clone();
        let ctx_err = ctx.clone();
        let log_name_for_err = log_file_name.clone(); // Clone for the sub-thread
        let log_name_for_out = log_file_name.clone(); // Clone for the main loop

        // --- Stderr Thread ---
        let stderr_handle = thread::spawn(move || {
            let reader = BufReader::new(stderr);
            //manual loop over the bytes to avoid errors with emojis from the python stdout
            for line_result in reader.split(b'\n') {
                match line_result {
                    Ok(line_bytes) => {
                        let line = String::from_utf8_lossy(&line_bytes).to_string();

                        let formatted = format!("[ERR] {}", line);
                        append_log_threadsafe(&logs_err, formatted.clone());

                        //log to file
                        if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(&log_name_for_err) {
                            let _ = writeln!(file, "{}", formatted);
                        }
                        ctx_err.request_repaint();
                    }
                    Err(e) => {
                        append_log_threadsafe(&logs_err, format!("[IO ERROR]: {}", e));
                    }
                }
            }
        });

        // --- Stdout Loop ---
        let reader = BufReader::new(stdout);
        for line_result in reader.split(b'\n') {
            match line_result {
                Ok(line_bytes) => {
                    let line = String::from_utf8_lossy(&line_bytes).to_string();

                    let formatted = format!("[OUT] {}", line);
                    append_log_threadsafe(&logs, formatted.clone());

                    //log to file
                    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(&log_name_for_out) {
                        let _ = writeln!(file, "{}", formatted);
                    }
                    ctx.request_repaint();
                }
                Err(e) => {
                    append_log_threadsafe(&logs, format!("[IO ERROR]: {}", e));
                }
            }
        }

        let _ = stderr_handle.join();

        // --- Status Check ---
        // Use your is_installed_flag here to fix the "unused variable" warning!
        match child.wait() {
            Ok(status) if status.success() => {
                append_log_threadsafe(&logs, "✅ Setup success!");
                is_installed_flag.store(true, Ordering::SeqCst);
            }
            _ => {
                append_log_threadsafe(&logs, "❌ Setup failed.");
                is_installed_flag.store(false, Ordering::SeqCst);
            }
        }
        
        is_installing_flag.store(false, Ordering::SeqCst);
        ctx.request_repaint();
    });

    //watcher
    // thread::spawn(move || {
    //     //handle Stdout
    //     let reader = BufReader::new(stdout);
    //     for line in reader.lines().flatten() {
    //         append_log_threadsafe(&logs, line);
    //         ctx.request_repaint(); //trigger ui redraw
    //     }

    //     //wait for exit
    //     match child.wait() {
    //         Ok(status) if status.success() => {
    //             append_log_threadsafe(&logs, format!("Successfully installed dependencies. [{}]", status));
    //             is_installed_flag.store(true, Ordering::SeqCst);
    //         }
    //         Ok(status) => {
    //             append_log_threadsafe(&logs, format!("Failed to setup. [{}]", status));
    //             is_installed_flag.store(false, Ordering::SeqCst);
    //         }
    //         Err(e) => {
    //             append_log_threadsafe(&logs, format!("Failed to setup: {}", e));
    //             is_installed_flag.store(false, Ordering::SeqCst);
    //         }
    //     }

    //     is_installing_flag.store(false, Ordering::SeqCst);
    //     ctx.request_repaint();
    // });
}

/// Starts the Python backend script as a child process and sets up
/// the control communication channel and stdout logging.
///
/// # Parameters
/// - `app`: mutable reference to `ScuttleGUI`, used to store
///          the child process handle and TCP stream.
pub fn start(app: &mut ScuttleGUI) {
    //append_log_threadsafe(&app.logs.clone(), format!("root_dir: {:?}", &app.root_dir)); //debugging
    //append_log_threadsafe(&app.logs.clone(), format!("webhook_url: {:?}", app.webhook_url)); //debugging
    //append_log_threadsafe(&app.logs.clone(), format!("webhook_dirty: {:?}", app.webhook_dirty)); //debugging

    //determine venv/ python
    let python = if cfg!(windows) {
        app.root_dir.join("venv").join("Scripts").join("python.exe")
    } else {
        app.root_dir.join("venv").join("bin").join("python")
    };

    let mut cmd = Command::new(python);
    cmd.current_dir(&app.root_dir)
        .arg("-u")
        .arg("main.py");

    //debug mode
    if app.verbose {
        cmd.arg("-v");
    }

    #[cfg(windows)]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
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

    //pipe output
    let logs = app.logs.clone(); //have to clone the <Arc<Mutex>> because &app is not threadsafe
    let ctx = app.egui_ctx.as_ref().unwrap().clone();

    cmd.stdout(Stdio::piped());
    let mut child = match cmd.spawn() {
        Ok(child) => child,
        Err(e) => {
            append_log_threadsafe(&logs, format!("Failed to spawn Python: {}", e));
            ctx.request_repaint();
            return; //exit function early
        }
    };

    //blocking accept
    let control_stream = accept_control_connection()
        .expect("Failed to accept control connection");

    let stdout = match child.stdout.take() {
        Some(s) => s,
        None => {
            append_log_threadsafe(&logs, "Failed to capture stdout".to_string());
            ctx.request_repaint();
            let _ = child.kill();
            return;
        }
    };

    // Read stdout
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            append_log_threadsafe(&logs, line);
            ctx.request_repaint(); //trigger ui redraw
        }
    });

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

use std::process::{Command, Stdio};
use std::thread;
use std::io::{BufRead, BufReader};
use std::net::{TcpStream, TcpListener};
use std::sync::OnceLock;
use std::sync::{Arc, Mutex};
use std::collections::VecDeque;
use std::io::Write;
use chrono::Local;

use crate::app::ScuttleGUI;

/// singleton for rust gui tcp port
static CONTROL_LISTENER: OnceLock<TcpListener> = OnceLock::new();

/// how many logs to allow
const MAX_LOG_LINES: usize = 100;

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

fn run_setup(app: &mut ScuttleGUI) -> std::io::Result<()> {
    let status = Command::new("python") //system python
        .current_dir(&app.root_dir)
        .arg("main.py")
        .arg("--setup")
        .status()?;

    if status.success() {
        Ok(())
    } else {
        Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            "Setup failed",
        ))
    }
}

/// Starts the Python backend script as a child process and sets up
/// the control communication channel and stdout logging.
///
/// # Parameters
/// - `app`: mutable reference to `ScuttleGUI`, used to store
///          the child process handle and TCP stream.
pub fn start(app: &mut ScuttleGUI) {
    //append_log_threadsafe(&app.logs.clone(), format!("root_dir: {:?}", &app.root_dir)); //debugging
    append_log_threadsafe(&app.logs.clone(), format!("webhook_url: {:?}", app.webhook_url)); //debugging
    append_log_threadsafe(&app.logs.clone(), format!("webhook_dirty: {:?}", app.webhook_dirty)); //debugging

    let venv_dir = app.root_dir.join("venv");

    if !venv_dir.exists() {
        if let Err(_) = run_setup(app) {
            return; //abort startup if setup fails
        }
    }

    //determine venv/ python
    let python = app
        .root_dir
        .join("venv")
        .join("Scripts")
        .join("python.exe");

    let mut cmd = Command::new(python);
    cmd.current_dir(&app.root_dir)
        .arg("-u")
        .arg("main.py");

    //gui communication channel
    let port = app.control_port;
    cmd.arg("--control-port")
        .arg(port.to_string());

    //new webhook settings
    if app.webhook_dirty {
        app.webhook_dirty = false;
        cmd.arg("--set-webhook")
            .arg(&app.webhook_url);        
    }

    //pipe output
    cmd.stdout(Stdio::piped());
    let mut child = cmd.spawn().expect("Failed to start main script");

    //blocking accept
    let control_stream = accept_control_connection()
        .expect("Failed to accept control connection");

    let stdout = child.stdout.take().unwrap();

    // Read stdout
    let logs = app.logs.clone(); //have to clone the <Arc<Mutex>> because &app is not threadsafe
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            append_log_threadsafe(&logs, line)
        }
    });

    app.mark_server_started(child, control_stream);
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

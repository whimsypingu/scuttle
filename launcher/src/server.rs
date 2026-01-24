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

/// Starts the Python backend script as a child process and sets up
/// the control communication channel and stdout logging.
///
/// # Parameters
/// - `app`: mutable reference to `ScuttleGUI`, used to store
///          the child process handle and TCP stream.
pub fn start(app: &mut ScuttleGUI) {
    let project_root = std::env::current_dir()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf(); //points to scuttle/ root directory

    let port = app.control_port;

    let mut child = Command::new("python")
        .arg("-u")
        .arg("main.py")
        .arg("--control-port")
        .arg(port.to_string())
        .current_dir(&project_root)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start main script");

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

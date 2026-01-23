use std::process::{Command, Stdio};
use std::thread;
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpStream, TcpListener};
use std::sync::OnceLock;

use crate::app::ScuttleGUI;

//singleton for rust gui tcp port
static CONTROL_LISTENER: OnceLock<TcpListener> = OnceLock::new();

pub fn bind_control_port() -> std::io::Result<u16> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let port = listener.local_addr()?.port();

    CONTROL_LISTENER.set(listener).map_err(|_| std::io::Error::new(
        std::io::ErrorKind::AlreadyExists,
        "CONTROL_LISTENER already bound",
    ))?;

    Ok(port)
}

fn accept_control_connection() -> std::io::Result<TcpStream> {
    let listener = CONTROL_LISTENER.get().unwrap();
    let (stream, _) = listener.accept()?; //blocking accept
    
    Ok(stream)
}

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
    let stderr = child.stderr.take().unwrap();

    // Read stdout
    let logs = app.logs.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            logs.lock().unwrap().push(line);
        }
    });

    // Read stderr
    let logs_err = app.logs.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().flatten() {
            logs_err.lock().unwrap().push(format!("ERR: {}", line));
        }
    });

    app.child = Some(child);
    app.control_stream = Some(control_stream);
    app.server_running = true;

    app.logs.lock().unwrap().push("-- Server started".into());
}

pub fn stop(app: &mut ScuttleGUI) {
    if let Some(stream) = &mut app.control_stream {
        let _ = stream.write_all(b"STOP\n");
    }

    app.child = None;
    app.control_stream = None;
    app.server_running = false;

    app.logs.lock().unwrap().push("-- Server stopped".into());
}

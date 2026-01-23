use std::process::{Command, Stdio};
use std::thread;
use std::io::{BufRead, BufReader, Write};
use std::net::TcpStream;
use std::time::Duration;

use crate::app::MyApp;

pub fn start(app: &mut MyApp) {
    let project_root = std::env::current_dir()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf(); //points to scuttle/ root directory
    
    let mut child = Command::new("python")
        .arg("-u")
        .arg("main.py")
        .current_dir(&project_root)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start main script");

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

    drop(child);

    app.control_port = Some(50067);
    app.server_running = true;
    app.logs.lock().unwrap().push("-- Server started".into());
}


fn send_shutdown_command(port: u16) -> std::io::Result<()> {
    let mut stream = TcpStream::connect(("127.0.0.1", port))?;
    stream.set_write_timeout(Some(Duration::from_secs(1)))?;
    stream.write_all(b"STOP\n")?;
    Ok(())
}

pub fn stop(app: &mut MyApp) {
    if let Some(port) = app.control_port {
        let _ = send_shutdown_command(port); //ignore result, python logs it
    }

    app.control_port = None;
    app.server_running = false;
    app.logs.lock().unwrap().push("-- Server stopped".into());
}

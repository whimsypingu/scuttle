use eframe::egui;
use std::sync::{Arc, Mutex};
use std::process::Child;
use std::net::TcpStream;
use std::collections::VecDeque;
use std::path::PathBuf;
use std::env;

use crate::server;

/// `ScuttleGUI` is the main application state for the Rust GUI
/// that interacts with a Python backend server.
/// 
/// Fields are separated into:
/// 1. **Immutable during runtime:** control port and log storage.
/// 2. **Mutable during runtime:** server state, child process handle, control stream.
pub struct ScuttleGUI {
    //these shouldn't change during program execution
    pub control_port: u16, //declared as an ephemeral port once at start
    pub logs: Arc<Mutex<VecDeque<String>>>, //all logs for the rust gui
    pub root_dir: PathBuf, //path to executable parent directory (main project directory)

    //these can change as the program executes
    pub server_running: bool, 
    pub child: Option<Child>, //hold this reference for force kills if needed?
    pub control_stream: Option<TcpStream>,

    pub webhook_url: String, //current discord webhook URL
    pub webhook_dirty: bool,
}

impl ScuttleGUI {
    // /// Append a log message in a thread-safe manner.
    // ///
    // /// # Parameters
    // /// - `msg`: The log message to append.
    // pub fn append_log(&self, msg: impl Into<String>) {
    //     server::append_log_threadsafe(&self.logs, msg);
    // }

    /// Returns a snapshot of the current logs.
    /// Useful for rendering the GUI without holding the lock too long.
    ///
    /// # Returns
    /// A `VecDeque<String>` containing cloned log lines.
    pub fn snapshot_logs(&self) -> VecDeque<String> {
        self.logs
            .lock()
            .unwrap()
            .iter()
            .cloned()
            .collect()
    }

    /// Marks the backend server as started, storing the child process
    /// and control stream, and updating the `server_running` flag.
    ///
    /// # Parameters
    /// - `child`: Handle to the spawned Python process.
    /// - `stream`: TCP stream for controlling the backend.
    pub fn mark_server_started(&mut self, child: Child, stream: TcpStream) {
        self.child = Some(child);
        self.control_stream = Some(stream);
        self.server_running = true;

        //self.append_log("[INFO] Server started");
    }

    /// Marks the backend server as stopped, clearing the process handle,
    /// control stream, and updating the `server_running` flag.
    pub fn mark_server_stopped(&mut self) {
        self.child = None;
        self.control_stream = None;
        self.server_running = false;

        //self.append_log("[INFO] Server stopped");
    }
}


impl Default for ScuttleGUI {
    /// Creates a default `ScuttleGUI` instance.
    /// Binds a control port and initializes log storage.
    fn default() -> Self {
        let control_port = server::bind_control_port()
            .expect("Failed to bind control port");

        //determine root directory of project where .exe file should be
        let root_dir: PathBuf = env::current_exe()
            .expect("Failed to get executable path")
            .parent() //launcher/
            .expect("Exe has no parent")
            .parent() //scuttle/
            .expect("No root directory")
            .parent()
            .expect("debug")
            .parent() //debugging
            .expect("debug")
            .to_path_buf();

        //load webhook from .env if it exists
        let env_path = root_dir.join(".env");
        if env_path.exists() {
            let _ = dotenvy::from_path(&env_path); //load using std::env::set_var()
        }
        let webhook_url = env::var("DISCORD_WEBHOOK_URL").unwrap_or_default();

        Self {
            control_port,
            logs: Arc::new(Mutex::new(VecDeque::new())),
            root_dir,

            child: None,
            control_stream: None,
            server_running: false,

            webhook_url,
            webhook_dirty: false,
        }
    }
}

impl eframe::App for ScuttleGUI {
    /// Main GUI update loop.
    /// Handles rendering panels, buttons, and log output.
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        egui::TopBottomPanel::top("header_panel").show(ctx, |ui| {
            //status
            ui.horizontal(|ui| {
                let button_label = if self.server_running { "Stop Server" } else { "Start Server" };

                let button = ui.add_sized(
                    [120.0, 32.0],
                    egui::Button::new(button_label),
                );

                if button.clicked() {
                    if self.server_running {
                        server::stop(self);
                    } else {
                        server::start(self);
                    }
                }
            });

            ui.add_space(4.0); //spacing to the bottom of the header
        });

        egui::TopBottomPanel::bottom("footer_panel").show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.label("Bottom text here");
            });
        });

        egui::CentralPanel::default().show(ctx, |ui| {
            //webhook area
            ui.add_space(8.0);
            ui.horizontal(|ui| {
                ui.label("Webhook:");

                let webhook_input = ui.add(
                    egui::TextEdit::singleline(&mut self.webhook_url)
                        .hint_text("https://discord.com/api/webhooks/...")
                        .desired_width(400.0),
                );

                //mark dirty if user changed it
                if webhook_input.changed() {
                    self.webhook_dirty = true;
                }
            });

            //logs
            ui.add_space(8.0);
            egui::ScrollArea::vertical()
                .auto_shrink([false; 2])
                .stick_to_bottom(true)
                .show(ui, |ui| {
                    for log in self.snapshot_logs() {
                        ui.label(log);
                    }
                });
        });

        // Smooth UI refresh
        ctx.request_repaint();
    }

    //safe thread exit on program close without turning off the server
    fn on_exit(&mut self, _gl: Option<&eframe::glow::Context>) {
        if self.server_running {
            server::stop(self);
        }
    }
}

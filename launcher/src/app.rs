use eframe::egui;
use std::sync::{Arc, Mutex};
use std::process::Child;
use std::net::TcpStream;
use std::collections::VecDeque;
use std::path::PathBuf;
use std::env;

use crate::server;
use crate::customui;

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
    pub egui_ctx: Option<egui::Context>, //used as reference to trigger a repaint

    //these can change as the program executes
    pub server_running: bool, 
    pub child: Option<Child>, //hold this reference for force kills if needed?
    pub control_stream: Option<TcpStream>,

    pub show_settings: bool,

    pub webhook_url: String, //current discord webhook URL
    pub webhook_saved: String, //last applied value
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
    pub fn mark_server_started(&mut self, child: Child, stream: TcpStream, webhook_saved: String) {
        self.child = Some(child);
        self.control_stream = Some(stream);
        self.server_running = true;

        self.webhook_saved = webhook_saved;

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
            egui_ctx: None,

            child: None,
            control_stream: None,
            server_running: false,

            show_settings: false,

            webhook_saved: webhook_url.clone(),
            webhook_url,
            webhook_dirty: false,
        }
    }
}

impl eframe::App for ScuttleGUI {
    /// Main GUI update loop.
    /// Handles rendering panels, buttons, and log output.
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        //capture context once
        if self.egui_ctx.is_none() {
            self.egui_ctx = Some(ctx.clone());

            customui::apply_theme(ctx);
        }

        egui::TopBottomPanel::top("header_panel").show(ctx, |ui| {
            ui.add_space(6.0);
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

                ui.add_space(14.0);

                //settings button
                let label = egui::Label::new(egui::RichText::new("⚙").size(20.0))
                    .sense(egui::Sense::click()); // <--- Makes the label interactable

                let settings_label = ui.add(label)
                    .on_hover_cursor(egui::CursorIcon::PointingHand); // Change the cursor

                if settings_label.clicked() {
                    self.show_settings = !self.show_settings;
                }
            });

            if self.show_settings {

            ui.add_space(10.0);

            ui.horizontal(|ui| {
                let row_height = 20.0;

                // 1. Label - use the 'zero-width' trick from before
                ui.add_sized([0.0, row_height], egui::Label::new(
                    egui::RichText::new("Webhook:").text_style(egui::TextStyle::Name("Webhook".into()))
                ));

                ui.add_space(6.0);

                // 2. TextEdit - Use desired_width instead of a Frame
                let webhook_input = ui.add_sized(
                    [400.0, row_height], // Match row_height exactly
                    egui::TextEdit::singleline(&mut self.webhook_url)
                        .hint_text("https://discord.com/api/webhooks/...")
                        .font(egui::TextStyle::Name("Webhook".into()))
                );

                if webhook_input.changed() {
                    self.webhook_dirty = self.webhook_url != self.webhook_saved;
                }

                ui.add_space(8.0);

                // 3. Revert Button
                ui.add_enabled_ui(self.webhook_dirty, |ui| {
                    if ui.add_sized([60.0, row_height], egui::Button::new("Revert")).clicked() {
                        self.webhook_url = self.webhook_saved.clone();
                        self.webhook_dirty = false;
                    }
                });
            });

            // //webhook area
            // ui.horizontal(|ui| {
            //     let row_height = 32.0;
            //     let inner_height = 20.0;

            //     ui.add_sized(
            //         [0.0, row_height],
            //         egui::Label::new(
            //             egui::RichText::new("Webhook:")
            //                 .text_style(egui::TextStyle::Name("Webhook".into())),
            //         ),
            //     );

            //     egui::Frame::none()
            //         .inner_margin(egui::Margin {
            //             top: (row_height - inner_height) / 2.0,
            //             bottom: (row_height - inner_height) / 2.0,
            //             left: 4.0,
            //             right: 4.0,
            //         })
            //         .show(ui, |ui| {
            //             let webhook_input = ui.add_sized(
            //                 [400.0, inner_height],
            //                 egui::TextEdit::singleline(&mut self.webhook_url)
            //                     .hint_text("https://discord.com/api/webhooks/...")
            //                     .font(egui::TextStyle::Name("Webhook".into())),
            //             );

            //             if webhook_input.changed() {
            //                 self.webhook_dirty = self.webhook_url != self.webhook_saved;
            //             }
            //         });

            //     //undo changes to webhook text
            //     let revert = ui.add_enabled(
            //         self.webhook_dirty,
            //         egui::Button::new(
            //             egui::RichText::new("Revert").size(14.0)
            //         ).min_size(egui::vec2(40.0, inner_height)),
            //     );

            //     if revert.clicked() {
            //         self.webhook_url = self.webhook_saved.clone();
            //         self.webhook_dirty = false;
            //     }
            // });

            }
            ui.add_space(6.0);

        });

        egui::TopBottomPanel::bottom("footer_panel").show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.label("Bottom text here");
            });
        });

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.add_space(8.0);

            egui::Frame::none()
                .fill(ui.visuals().extreme_bg_color)
                .rounding(egui::Rounding::same(6.0))
                .inner_margin(egui::Margin::same(8.0))
                .show(ui, |ui| {
                    //logs
                    egui::ScrollArea::vertical()
                        .auto_shrink([false; 2])
                        .stick_to_bottom(true)
                        .show(ui, |ui| {
                            for log in self.snapshot_logs() {
                                customui::render_log_line(ui, &log);
                            }
                        });
                });
        });

        // Smooth UI refresh
        //ctx.request_repaint();
    }

    //safe thread exit on program close without turning off the server
    fn on_exit(&mut self, _gl: Option<&eframe::glow::Context>) {
        if self.server_running {
            server::stop(self);
        }
    }
}

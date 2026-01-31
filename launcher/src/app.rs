use eframe::egui;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
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
    pub python_cmd: String, //python, py, or python3 to install successfully on start
    pub control_port: u16, //declared as an ephemeral port once at start
    pub logs: Arc<Mutex<VecDeque<String>>>, //all logs for the rust gui
    pub root_dir: PathBuf, //path to executable parent directory (main project directory)
    pub egui_ctx: Option<egui::Context>, //used as reference to trigger a repaint

    //these can change as the program executes
    pub is_installed: Arc<AtomicBool>,
    pub is_installing: Arc<AtomicBool>,

    pub server_running: bool, 
    pub child: Option<Child>, //hold this reference for force kills if needed?
    pub control_stream: Option<TcpStream>,

    pub show_settings: bool,

    pub webhook_url: String, //current discord webhook URL
    pub webhook_saved: String, //last applied value
    pub webhook_dirty: bool,

    pub verbose: bool,
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

    
    //installation screen
    fn render_install_consent_screen(&mut self, ui: &mut egui::Ui) {
        ui.vertical_centered(|ui| {

            ui.add_space(40.0);
            ui.heading(egui::RichText::new("Setup Required").size(24.0).strong());

            ui.add_space(30.0);
            ui.label(
                egui::RichText::new("Scuttle needs to install some dependencies to function.")
                    .color(egui::Color32::from_rgb(100, 100, 100))
            );
            ui.label(egui::RichText::new("• venv  • cloudflared  • ffmpeg  • deno  •").italics());        

            ui.add_space(30.0);
            ui.scope(|ui| {
                customui::apply_start_stop_button(ui.style_mut());

                let install_button = ui.add_sized(
                    [160.0, 50.0],
                    egui::Button::new(egui::RichText::new("Start Installation").size(14.0))
                );

                if install_button.clicked() {
                    server::run_setup(self);
                }
            });
        });
    }

    //log main window
    fn render_log_window(&mut self, ui: &mut egui::Ui) {
        egui::Frame::none()
            .fill(egui::Color32::from_rgb(250, 250, 250))
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
    }
}


impl Default for ScuttleGUI {
    /// Creates a default `ScuttleGUI` instance.
    /// Binds a control port and initializes log storage.
    fn default() -> Self {
        let control_port = server::bind_control_port()
            .expect("Failed to bind control port");

        //determine root directory of project where .exe file should be
        let exe_path = env::current_exe().expect("Failed to get executable path");
        let exe_dir = exe_path.parent().expect("Executable has no parent");

        let root_dir = if cfg!(debug_assertions) {
            //debug mode: climb to find project root from /launcher/target/debug/launcher.exe (4x)
            exe_dir.parent().unwrap().parent().unwrap().parent().unwrap().to_path_buf()
        } else {
            //release mode: exe sitting next to /main.py
            exe_dir.to_path_buf()
        };

        //load webhook from .env if it exists
        //frankly unreal that for whatever reason dogshit dotenvy and turbo int windows cant handle a path correclty and implode
        let env_path = root_dir.join(".env");
        let mut webhook_url = String::new();

        if env_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&env_path) {
                //find the line that starts with our key
                if let Some(line) = content.lines().find(|l| l.trim().starts_with("DISCORD_WEBHOOK_URL=")) {
                    //split by '=' and take the second half
                    if let Some((_, value)) = line.split_once('=') {
                        //.trim() removes spaces and the \r
                        //.trim_matches removes potential quotes if Python added them
                        webhook_url = value.trim()
                            .trim_matches(|c| c == '"' || c == '\'')
                            .to_string();
                    }
                }
            }
        }
        if webhook_url.is_empty() {
            webhook_url = std::env::var("DISCORD_WEBHOOK_URL").unwrap_or_default();
        }

        //shows settings by default only if webhook url is blank
        let show_settings = webhook_url.trim().is_empty();

        Self {
            python_cmd: "python".to_string(),
            control_port,
            logs: Arc::new(Mutex::new(VecDeque::new())),
            root_dir,
            egui_ctx: None,

            is_installed: Arc::new(AtomicBool::new(false)),
            is_installing: Arc::new(AtomicBool::new(false)),

            child: None,
            control_stream: None,
            server_running: false,

            show_settings,

            webhook_saved: webhook_url.clone(),
            webhook_url,
            webhook_dirty: false,

            verbose: false,
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

            //simple setup check via /venv/ existence, consider tmp file
            if !server::setup_exists(self) {
                server::detect_and_set_python(self);
            }
        }

        egui::TopBottomPanel::top("header_panel")
            .frame(egui::Frame::none()
                .inner_margin(egui::Margin::symmetric(20.0, 14.0))
                .fill(egui::Color32::from_rgb(210, 210, 210))
            ).show(ctx, |ui| {
                ui.add_space(6.0);

                //server status
                ui.horizontal(|ui| {

                    ui.add_enabled_ui(self.is_installed.load(Ordering::SeqCst), |ui| {
                        ui.scope(|ui| {
                            customui::apply_start_stop_button(ui.style_mut());

                            let button_label = if self.server_running { "Stop Server" } else { "Start Server" };
        
                            let button = ui.add_sized(
                                [120.0, 32.0],
                                egui::Button::new(button_label),
                            ).on_hover_cursor(egui::CursorIcon::PointingHand);

                            if button.clicked() {
                                if self.server_running { server::stop(self); } 
                                else { server::start(self); }
                            }
                        });
                    });

                    ui.add_space(14.0);

                    //settings button
                    ui.scope(|ui| {
                        customui::apply_settings_button(ui.style_mut());

                        let settings_button = ui.add_sized(
                            [32.0, 32.0],
                            egui::Button::new(egui::RichText::new("⚙").size(20.0))
                                .frame(false),
                        )
                        .on_hover_cursor(egui::CursorIcon::PointingHand)
                        .on_hover_text("Additional settings");

                        if settings_button.clicked() {
                            self.show_settings = !self.show_settings;
                        }
                    });
                });

                //OPTIONAL SETTINGS
                if self.show_settings {
                    let row_height = 20.0;

                    //row for webhook url setting
                    ui.add_space(14.0);
                    ui.horizontal(|ui| {
                        //label
                        ui.add_sized([0.0, row_height], egui::Label::new(
                            egui::RichText::new("Webhook:").text_style(egui::TextStyle::Name("Webhook".into()))
                        ));

                        ui.add_space(6.0);

                        //text field
                        let webhook_input = ui.add_sized(
                            [400.0, row_height],
                            egui::TextEdit::singleline(&mut self.webhook_url)
                                .hint_text("https://discord.com/api/webhooks/...")
                                .font(egui::TextStyle::Name("Webhook".into()))
                                .vertical_align(egui::Align::Center)
                        );

                        //figure out some CCursor shit to make it highlight on focus automatically for easier copy paste

                        if webhook_input.changed() {
                            self.webhook_dirty = self.webhook_url != self.webhook_saved;
                        }

                        ui.add_space(8.0);

                        //revert Button
                        ui.add_enabled_ui(self.webhook_dirty, |ui| {
                            ui.scope(|ui| {
                                customui::apply_settings_button(ui.style_mut());

                                let revert_button = ui.add_sized(
                                    [0.0, row_height],
                                    egui::Button::new(egui::RichText::new("↺"))
                                        .frame(false),
                                )
                                .on_hover_cursor(egui::CursorIcon::PointingHand)
                                .on_hover_text("Revert last used webhook. Restart server to apply changes.");
                                
                                if revert_button.clicked() {
                                    self.webhook_url = self.webhook_saved.clone();
                                    self.webhook_dirty = false;
                                }
                            });
                        });
                    });

                    //row for verbose settings
                    ui.add_space(10.0);
                    ui.horizontal(|ui| {
                        //label
                        ui.add_sized([0.0, row_height], egui::Label::new(
                            egui::RichText::new("Debug Mode:").text_style(egui::TextStyle::Name("Webhook".into()))
                        ));

                        ui.add_space(6.0);

                        ui.scope(|ui| {
                            customui::apply_settings_button(ui.style_mut());

                            // Change the text based on the state
                            let btn_text = if self.verbose { "ON" } else { "OFF" };
                            
                            let verbose_button = ui.add_sized(
                                [40.0, row_height], // Fixed width so the UI doesn't jump when text changes
                                egui::Button::new(egui::RichText::new(btn_text))
                                    .frame(true)
                            ).on_hover_cursor(egui::CursorIcon::PointingHand)
                            .on_hover_text("Enable to see detailed terminal output and logs. Restart server to apply changes.");

                            if verbose_button.clicked() {
                                self.verbose = !self.verbose;
                            }
                        });
                    });
                }

                ui.add_space(2.0);
            });

        egui::TopBottomPanel::bottom("footer_panel")
            .frame(egui::Frame::none()
                .inner_margin(egui::Margin::symmetric(20.0, 14.0))
                .fill(egui::Color32::from_rgb(210, 210, 210))
            )
            .show(ctx, |ui| {
                ui.horizontal(|ui| {

                    //left side hyperlink
                    let github_link = egui::Button::new(egui::RichText::new("</>"))
                        .frame(false);
                    
                    if ui.add(github_link).on_hover_cursor(egui::CursorIcon::PointingHand).clicked() {
                        ui.ctx().open_url(egui::OpenUrl::new_tab("https://github.com/whimsypingu/scuttle"));
                    }

                    //Solid Status (No CPU drain)
                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {

                        let (text, color) = if self.is_installing.load(Ordering::SeqCst) {
                            ("Installing", egui::Color32::from_rgb(245, 166, 35)) //yellow
                        } else if !self.is_installed.load(Ordering::SeqCst) {
                            ("Setup Required", egui::Color32::from_rgb(180, 40, 40)) //red
                        } else if self.server_running {
                            ("Running", egui::Color32::from_rgb(40, 180, 40)) //green                      
                        } else {
                            ("Offline", egui::Color32::from_rgb(180, 40, 40)) //red
                        };

                        // Allocate space for the dot
                        let (rect, _) = ui.allocate_exact_size(egui::vec2(10.0, 10.0), egui::Sense::hover());
                        
                        // Draw a smooth anti-aliased circle
                        ui.painter().circle_filled(rect.center(), 6.0, color);
                        
                        ui.add_space(8.0);
                        ui.label(text);
                    });
                });
            });

        egui::CentralPanel::default()
            .frame(egui::Frame::none()
                .inner_margin(egui::Margin::symmetric(20.0, 20.0))
                .fill(egui::Color32::from_rgb(230, 230, 230))
            )
            .show(ctx, |ui| {
            
                if !self.is_installed.load(Ordering::SeqCst) && !self.is_installing.load(Ordering::SeqCst) {
                    self.render_install_consent_screen(ui);
                } else {
                    self.render_log_window(ui);
                }
            });
    }

    //safe thread exit on program close without turning off the server
    fn on_exit(&mut self, _gl: Option<&eframe::glow::Context>) {
        if self.server_running {
            server::stop(self);
        }
    }
}


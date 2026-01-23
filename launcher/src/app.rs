use eframe::egui;
use std::sync::{Arc, Mutex};
use std::process::Child;
use std::net::TcpStream;
use std::collections::VecDeque;

use crate::server;

pub struct ScuttleGUI {
    //these shouldn't change during program execution
    pub control_port: u16, //declared as an ephemeral port once at start
    pub logs: Arc<Mutex<VecDeque<String>>>, //all logs for the rust gui

    //these can change as the program executes
    pub server_running: bool, 
    pub child: Option<Child>, //hold this reference for force kills if needed?
    pub control_stream: Option<TcpStream>,
}

impl ScuttleGUI {
    pub fn append_log(&self, msg: impl Into<String>) {
        server::append_log_threadsafe(&self.logs, msg);
    }

    pub fn snapshot_logs(&self) -> VecDeque<String> {
        self.logs
            .lock()
            .unwrap()
            .iter()
            .cloned()
            .collect()
    }

    pub fn mark_server_started(&mut self, child: Child, stream: TcpStream) {
        self.child = Some(child);
        self.control_stream = Some(stream);
        self.server_running = true;

        self.append_log("[INFO] Server started");
    }

    pub fn mark_server_stopped(&mut self) {
        self.child = None;
        self.control_stream = None;
        self.server_running = false;

        self.append_log("[INFO] Server stopped");
    }
}


impl Default for ScuttleGUI {
    fn default() -> Self {
        let port = server::bind_control_port()
            .expect("Failed to bind control port");

        Self {
            control_port: port,
            logs: Arc::new(Mutex::new(VecDeque::new())),

            child: None,
            control_stream: None,
            server_running: false,
        }
    }
}

impl eframe::App for ScuttleGUI {
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
            //logs
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

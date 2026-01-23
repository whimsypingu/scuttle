use eframe::egui;
use std::sync::{Arc, Mutex};

use crate::server;

pub struct MyApp {
    pub server_running: bool,
    pub logs: Arc<Mutex<Vec<String>>>,
    pub control_port: Option<u16>,
}

impl Default for MyApp {
    fn default() -> Self {
        Self {
            server_running: false,
            logs: Arc::new(Mutex::new(Vec::new())),
            control_port: Some(50067),
        }
    }
}

impl eframe::App for MyApp {
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
                    ui.vertical(|ui| {
                        let logs = self.logs.lock().unwrap();
                        for log in logs.iter() {
                            ui.label(log);
                        }
                    });
                });
        });

        // Smooth UI refresh
        ctx.request_repaint();
    }
}

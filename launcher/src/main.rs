use eframe::egui;
use egui::ViewportBuilder;
use egui::viewport::IconData;

mod app;
mod server;

fn load_icon() -> IconData {
    let bytes = include_bytes!("../../frontend/assets/big_favicon.png");

    let image = image::load_from_memory(bytes)
        .expect("Failed to laod icon")
        .into_rgba8();

    let (width, height) = image.dimensions();
    let rgba = image.into_raw();

    IconData {
        rgba,
        width,
        height,
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: ViewportBuilder::default()
            .with_icon(load_icon()),
        ..Default::default()
    };

    eframe::run_native(
        "Scuttle", 
        options,
        Box::new(|_cc| {
            //cc.egui_ctx.set_visuals(eframe::egui::Visuals::dark());

            Box::new(app::MyApp::default()) //no semicolon here
        }),
    )
}

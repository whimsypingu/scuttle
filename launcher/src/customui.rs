use eframe::egui;

pub fn apply_theme(ctx: &egui::Context) {
    let mut visuals = egui::Visuals::light();

    // Window & panel backgrounds
    visuals.window_fill = egui::Color32::from_rgb(245, 245, 245);
    visuals.panel_fill  = egui::Color32::from_rgb(250, 250, 250);

    // Rounded corners
    visuals.window_rounding = egui::Rounding::same(8.0);
    visuals.menu_rounding   = egui::Rounding::same(6.0);
    visuals.widgets.noninteractive.rounding = egui::Rounding::same(6.0);
    visuals.widgets.inactive.rounding       = egui::Rounding::same(6.0);
    visuals.widgets.hovered.rounding        = egui::Rounding::same(6.0);
    visuals.widgets.active.rounding         = egui::Rounding::same(6.0);

    // Widget background colors
    visuals.widgets.inactive.bg_fill = egui::Color32::from_rgb(235, 235, 235);
    visuals.widgets.hovered.bg_fill  = egui::Color32::from_rgb(220, 220, 220);
    visuals.widgets.active.bg_fill   = egui::Color32::from_rgb(210, 210, 210);

    // Subtle borders
    visuals.widgets.inactive.bg_stroke =
        egui::Stroke::new(1.0, egui::Color32::from_rgb(200, 200, 200));
    visuals.widgets.hovered.bg_stroke  =
        egui::Stroke::new(1.0, egui::Color32::from_rgb(170, 170, 170));
    visuals.widgets.active.bg_stroke   =
        egui::Stroke::new(1.0, egui::Color32::from_rgb(150, 150, 150));

    ctx.set_visuals(visuals);

    // Spacing & layout
    ctx.style_mut(|style| {
        style.spacing.item_spacing = egui::vec2(10.0, 8.0);
        style.spacing.window_margin = egui::Margin::same(12.0);
        style.spacing.button_padding = egui::vec2(10.0, 6.0);
    });
}


pub fn render_log_line(ui: &mut egui::Ui, line: &str) {
    if let Some(idx) = line.find("https://") {
        let (before, url) = line.split_at(idx);
        ui.horizontal_wrapped(|ui| {
            if !before.is_empty() {
                ui.label(before);
            }
            ui.add(egui::Hyperlink::from_label_and_url(url, url));
        });
    } else {
        ui.label(line);
    }
}
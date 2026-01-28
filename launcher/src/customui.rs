use eframe::egui;

pub fn apply_theme(ctx: &egui::Context) {
    let mut visuals = egui::Visuals::light();

    // Window & panel backgrounds
    visuals.window_fill = egui::Color32::from_rgb(210, 210, 210);
    visuals.panel_fill  = egui::Color32::from_rgb(230, 230, 230);

    // Rounded corners
    visuals.window_rounding = egui::Rounding::same(8.0);
    visuals.menu_rounding   = egui::Rounding::same(6.0);
    visuals.widgets.noninteractive.rounding = egui::Rounding::same(6.0);
    visuals.widgets.inactive.rounding       = egui::Rounding::same(6.0);
    visuals.widgets.hovered.rounding        = egui::Rounding::same(6.0);
    visuals.widgets.active.rounding         = egui::Rounding::same(6.0);
    
    ctx.set_visuals(visuals);

    // Spacing & layout
    ctx.style_mut(|style| {
        style.spacing.item_spacing = egui::vec2(0.0, 8.0);
        style.spacing.window_margin = egui::Margin::same(12.0);
        style.spacing.button_padding = egui::vec2(6.0, 0.0);

        style.text_styles.insert(
            egui::TextStyle::Name("Webhook".into()),
            egui::FontId::new(14.0, egui::FontFamily::Proportional),
        );
    });
}


//start and stop button styling
pub fn apply_start_stop_button(style: &mut egui::Style) {
    let visuals = &mut style.visuals;

    // 1. Inactive State (Resting)
    visuals.widgets.inactive.weak_bg_fill = egui::Color32::from_rgb(40, 40, 40);
    visuals.widgets.inactive.bg_stroke = egui::Stroke::new(2.0, egui::Color32::BLACK);
    visuals.widgets.inactive.fg_stroke = egui::Stroke::new(1.0, egui::Color32::WHITE);
    visuals.widgets.inactive.rounding = egui::Rounding::same(6.0); // Slightly smoother corners

    // 2. Hovered State (Mouse Over)
    visuals.widgets.hovered.weak_bg_fill = egui::Color32::from_rgb(180, 0, 0);
    visuals.widgets.hovered.bg_stroke = egui::Stroke::new(2.0, egui::Color32::from_rgb(140, 0, 0));
    visuals.widgets.hovered.fg_stroke = egui::Stroke::new(1.0, egui::Color32::BLACK);

    // 3. Active State (Moment of Click)
    visuals.widgets.active.weak_bg_fill = egui::Color32::from_rgb(220, 0, 0);
    visuals.widgets.active.bg_stroke = egui::Stroke::new(2.0, egui::Color32::from_rgb(180, 0, 0));
    visuals.widgets.active.fg_stroke = egui::Stroke::new(1.0, egui::Color32::BLACK);
}

//settings button styling
pub fn apply_settings_button(style: &mut egui::Style) {
    let visuals = &mut style.visuals;

    // 1. Inactive State (Resting)
    visuals.widgets.inactive.fg_stroke = egui::Stroke::new(1.0, egui::Color32::from_rgb(40, 40, 40));

    // 2. Hovered State (Mouse Over)
    visuals.widgets.hovered.fg_stroke = egui::Stroke::new(1.0, egui::Color32::from_rgb(140, 0, 0));

    // 3. Active State (Moment of Click)
    visuals.widgets.active.fg_stroke = egui::Stroke::new(2.0, egui::Color32::from_rgb(180, 0, 0));
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
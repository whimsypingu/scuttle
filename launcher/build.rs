// build.rs
fn main() {
    // This only runs when you are compiling for Windows
    if std::env::var("CARGO_CFG_TARGET_OS").unwrap() == "windows" {
        let mut res = winresource::WindowsResource::new();
        
        // This must be a real .ico file, not a .png
        res.set_icon("../frontend/assets/favicon.ico"); 
        
        res.set("ProductName", "Scuttle");
        res.set("FileDescription", "YouTube Downloader");
        res.compile().unwrap();
    }
}
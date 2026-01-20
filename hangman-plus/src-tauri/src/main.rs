#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn hello_from_rust() -> String {
    hangman_core::hello()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![hello_from_rust])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

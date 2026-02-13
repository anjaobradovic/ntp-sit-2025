mod db;
mod utils;
mod domain;
mod services;
mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();

            tauri::async_runtime::block_on(async move {
                let data_dir = app_handle
                    .path()
                    .app_data_dir()
                    .map_err(|e| format!("app_data_dir failed: {e}"))?;

                let db_path = data_dir.join("hangman.db");
                println!("SQLite DB path: {}", db_path.display());

                let pool = db::init_db(db_path).await?;
                app_handle.manage(pool);

                // Game state
                app_handle.manage(commands::game_commands::GamesState::default());

                Ok::<(), String>(())
            })
            .map_err(|e| tauri::Error::Setup(Box::<dyn std::error::Error>::from(e).into()))?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth_commands::register_user,
            commands::auth_commands::login_user,
            commands::auth_commands::validate_session,
            commands::auth_commands::logout,
            commands::game_commands::start_game,
            commands::game_commands::next_card,
            commands::game_commands::reset_game,
            commands::game_commands::end_game,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}

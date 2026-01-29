use sqlx::SqlitePool;
use tauri::State;

use crate::domain::dto::LoginResponse;
use crate::services::auth_service::AuthService;

#[tauri::command]
pub async fn register_user(
    pool: State<'_, SqlitePool>,
    first_name: String,
    last_name: String,
    username: String,
    email: String,
    password: String,
) -> Result<(), String> {
    AuthService::register_user(&pool, first_name, last_name, username, email, password).await
}

#[tauri::command]
pub async fn login_user(
    pool: State<'_, SqlitePool>,
    identifier: String,
    password: String,
) -> Result<LoginResponse, String> {
    AuthService::login_user(&pool, identifier, password).await
}

#[tauri::command]
pub async fn validate_session(
    pool: State<'_, SqlitePool>,
    session_token: String,
) -> Result<bool, String> {
    AuthService::validate_session(&pool, session_token).await
}

#[tauri::command]
pub async fn logout(
    pool: State<'_, SqlitePool>,
    session_token: String,
) -> Result<(), String> {
    AuthService::logout(&pool, session_token).await
}

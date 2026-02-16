use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::State;

use crate::services::profile_service::ProfileService;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileResponse {
    pub id: i64,
    pub first_name: String,
    pub last_name: String,
    pub username: String,
    pub email: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfileRequest {
    pub session_token: String,
    pub first_name: String,
    pub last_name: String,
    pub username: String,
    pub email: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordRequest {
    pub session_token: String,
    pub old_password: String,
    pub new_password: String,
}

#[tauri::command]
pub async fn get_profile(
    pool: State<'_, SqlitePool>,
    session_token: String,
) -> Result<ProfileResponse, String> {
    let row = ProfileService::get_profile(&pool, session_token).await?;
    Ok(ProfileResponse {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        username: row.username,
        email: row.email,
        role: row.role,
    })
}

#[tauri::command]
pub async fn update_profile(
    pool: State<'_, SqlitePool>,
    req: UpdateProfileRequest,
) -> Result<(), String> {
    ProfileService::update_profile(
        &pool,
        req.session_token,
        req.first_name,
        req.last_name,
        req.username,
        req.email,
    )
    .await
}

#[tauri::command]
pub async fn change_password(
    pool: State<'_, SqlitePool>,
    req: ChangePasswordRequest,
) -> Result<(), String> {
    ProfileService::change_password(&pool, req.session_token, req.old_password, req.new_password).await
}

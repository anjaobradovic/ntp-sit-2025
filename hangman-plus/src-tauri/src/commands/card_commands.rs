use sqlx::SqlitePool;
use tauri::State;

use crate::domain::dto::{CardResponse, CreateCardInput};
use crate::services::card_service::CardService;
use crate::domain::dto::PendingCard;


#[tauri::command]
pub async fn admin_add_card(
    pool: State<'_, SqlitePool>,
    input: CreateCardInput,
) -> Result<CardResponse, String> {
    CardService::add_card_admin(&pool, input).await
}

#[tauri::command]
pub async fn user_request_card(
    pool: State<'_, SqlitePool>,
    input: CreateCardInput,
) -> Result<CardResponse, String> {
    CardService::request_card_user(&pool, input).await
}

#[tauri::command]
pub async fn approve_card(
    pool: State<'_, SqlitePool>,
    session_token: String,
    card_id: i64,
) -> Result<(), String> {
    CardService::approve_card(&pool, session_token, card_id).await
}

#[tauri::command]
pub async fn reject_card(
    pool: State<'_, SqlitePool>,
    session_token: String,
    card_id: i64,
) -> Result<(), String> {
    CardService::reject_card(&pool, session_token, card_id).await
}


#[tauri::command]
pub async fn list_pending_cards(
    pool: State<'_, SqlitePool>,
    sessionToken: String,
) -> Result<Vec<PendingCard>, String> {
    CardService::list_pending_cards(&pool, sessionToken).await
}

#[tauri::command]
pub async fn count_pending_cards(
    pool: State<'_, SqlitePool>,
    sessionToken: String,
) -> Result<i64, String> {
    CardService::count_pending_cards(&pool, sessionToken).await
}

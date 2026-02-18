use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize)]
pub struct LoginResponse {
    pub session_token: String,
}

#[derive(Serialize)]
pub struct MeResponse {
    pub id: i64,
    pub username: String,
    pub role: String,
}

#[derive(Deserialize)]
pub struct CreateCardInput {
    pub sessionToken: String,
    pub category: String, // "ORGANS" | "BONES"
    pub english: String,
    pub latin: String,
    pub imagePath: String,
}

#[derive(Serialize)]
pub struct CardResponse {
    pub id: i64,
    pub status: String,
}

#[derive(Serialize, FromRow)]
pub struct PendingCard {
    pub id: i64,
    pub category: String,
    pub english: String,
    pub latin: String,
    pub image_path: String,
    pub status: String,
    pub created_by: i64,
    pub created_at: i64,
}

#[derive(Deserialize)]
pub struct UpdateCardInput {
    pub sessionToken: String,
    pub id: i64,
    pub english: String,
    pub latin: String,
    pub imagePath: String,
}

#[derive(Serialize, FromRow)]
pub struct CardAdminItem {
    pub id: i64,
    pub category: String,
    pub english: String,
    pub latin: String,
    pub image_path: String,
    pub status: String,
}

// ---------- ANALYTICS DTOs ----------

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyPoint {
    pub day: String, // "YYYY-MM-DD"
    pub attempts: i64,
    pub wins: i64,
    pub losses: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelValue {
    pub label: String,
    pub value: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DifficultyStats {
    pub difficulty: String,
    pub attempts: i64,
    pub wins: i64,
    pub losses: i64,
    pub win_rate: f64, // 0..1
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserAnalyticsResponse {
    pub daily: Vec<DailyPoint>,
    pub missed_by_category: Vec<LabelValue>,
    pub attempts_by_category: Vec<LabelValue>,
    pub difficulty: Vec<DifficultyStats>,
    pub wrong_count_dist: Vec<LabelValue>,
}


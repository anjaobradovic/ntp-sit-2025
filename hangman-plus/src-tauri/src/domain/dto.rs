use serde::{Deserialize, Serialize};

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
    pub category: String,  
    pub english: String,
    pub latin: String,
    pub imagePath: String,
}

#[derive(Serialize)]
pub struct CardResponse {
    pub id: i64,
    pub status: String,
}

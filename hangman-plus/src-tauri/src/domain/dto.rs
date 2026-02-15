use serde::Serialize;

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

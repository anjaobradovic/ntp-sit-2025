use serde::Serialize;

#[derive(Serialize)]
pub struct LoginResponse {
  pub session_token: String,
}

use sqlx::SqlitePool;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::domain::dto::LoginResponse;
use crate::utils::security::{hash_password, hash_token, verify_password};

fn now_unix() -> i64 {
    OffsetDateTime::now_utc().unix_timestamp()
}

fn validate_register(first_name: &str, last_name: &str, username: &str, email: &str, password: &str) -> Result<(), String> {
    if first_name.trim().len() < 2 {
        return Err("First name must be at least 2 characters.".into());
    }
    if last_name.trim().len() < 2 {
        return Err("Last name must be at least 2 characters.".into());
    }
    if username.trim().len() < 3 {
        return Err("Username must be at least 3 characters.".into());
    }
    if !email.contains('@') {
        return Err("Email is not valid.".into());
    }
    if password.len() < 8 {
        return Err("Password must be at least 8 characters.".into());
    }
    Ok(())
}

fn validate_login(identifier: &str, password: &str) -> Result<(), String> {
    if identifier.trim().is_empty() {
        return Err("Enter username or email.".into());
    }
    if password.is_empty() {
        return Err("Enter password.".into());
    }
    Ok(())
}

pub struct AuthService;

#[derive(sqlx::FromRow, Debug)]
struct UserLoginRow {
    pub id: i64,
    pub password_hash: String,
}

impl AuthService {
    pub async fn register_user(
        pool: &SqlitePool,
        first_name: String,
        last_name: String,
        username: String,
        email: String,
        password: String,
    ) -> Result<(), String> {
        validate_register(&first_name, &last_name, &username, &email, &password)?;

        // unique check
        let existing = sqlx::query_scalar::<_, i64>(
            r#"SELECT COUNT(*) FROM users WHERE username = ?1 OR email = ?2"#,
        )
        .bind(username.trim())
        .bind(email.trim())
        .fetch_one(pool)
        .await
        .map_err(|e| format!("DB error: {e}"))?;

        if existing > 0 {
            return Err("Username or email already exists.".into());
        }

        let password_hash = hash_password(&password)?;

        sqlx::query(
            r#"
            INSERT INTO users (first_name, last_name, username, email, password_hash, role, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, 'USER', ?6)
            "#,
        )
        .bind(first_name.trim())
        .bind(last_name.trim())
        .bind(username.trim())
        .bind(email.trim())
        .bind(password_hash)
        .bind(now_unix())
        .execute(pool)
        .await
        .map_err(|e| format!("Insert failed: {e}"))?;

        Ok(())
    }

    pub async fn login_user(
        pool: &SqlitePool,
        identifier: String,
        password: String,
    ) -> Result<LoginResponse, String> {
        validate_login(&identifier, &password)?;

        let row = sqlx::query_as::<_, UserLoginRow>(
            r#"
            SELECT id as "id", password_hash as "password_hash"
            FROM users
            WHERE username = ?1 OR email = ?1
            "#,
        )
        .bind(identifier.trim())
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("DB error: {e}"))?;

        let row = match row {
            Some(r) => r,
            None => return Err("Invalid credentials.".into()),
        };

        let ok = verify_password(&password, &row.password_hash)?;
        if !ok {
            return Err("Invalid credentials.".into());
        }

        let session_token = Uuid::new_v4().to_string();
        let token_hash = hash_token(&session_token);

        sqlx::query(
            r#"
            INSERT INTO sessions (user_id, token_hash, created_at, revoked_at)
            VALUES (?1, ?2, ?3, NULL)
            "#,
        )
        .bind(row.id)
        .bind(token_hash)
        .bind(now_unix())
        .execute(pool)
        .await
        .map_err(|e| format!("Session create failed: {e}"))?;

        Ok(LoginResponse { session_token })
    }

    pub async fn validate_session(pool: &SqlitePool, session_token: String) -> Result<bool, String> {
        if session_token.trim().is_empty() {
            return Ok(false);
        }
        let token_hash = hash_token(session_token.trim());

        let exists = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM sessions
            WHERE token_hash = ?1 AND revoked_at IS NULL
            "#,
        )
        .bind(token_hash)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("DB error: {e}"))?;

        Ok(exists > 0)
    }

    pub async fn logout(pool: &SqlitePool, session_token: String) -> Result<(), String> {
        let token_hash = hash_token(session_token.trim());

        sqlx::query(
            r#"
            UPDATE sessions
            SET revoked_at = ?2
            WHERE token_hash = ?1 AND revoked_at IS NULL
            "#,
        )
        .bind(token_hash)
        .bind(now_unix())
        .execute(pool)
        .await
        .map_err(|e| format!("Logout failed: {e}"))?;

        Ok(())
    }
}

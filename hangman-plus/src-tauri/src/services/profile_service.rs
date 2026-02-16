use sqlx::SqlitePool;

use crate::utils::security::{hash_password, verify_password};
use crate::services::auth_service::AuthService;

fn validate_profile(first_name: &str, last_name: &str, username: &str, email: &str) -> Result<(), String> {
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
    Ok(())
}

fn validate_new_password(old_password: &str, new_password: &str) -> Result<(), String> {
    if old_password.is_empty() {
        return Err("Enter old password.".into());
    }
    if new_password.len() < 8 {
        return Err("New password must be at least 8 characters.".into());
    }
    Ok(())
}

#[derive(sqlx::FromRow, Debug)]
pub struct ProfileRow {
    pub id: i64,
    pub first_name: String,
    pub last_name: String,
    pub username: String,
    pub email: String,
    pub role: String,
}

#[derive(sqlx::FromRow, Debug)]
struct PasswordRow {
    pub password_hash: String,
}

pub struct ProfileService;

impl ProfileService {
    pub async fn get_profile(pool: &SqlitePool, session_token: String) -> Result<ProfileRow, String> {
        let (user_id, _role) = AuthService::require_session_user(pool, &session_token).await?;

        let row = sqlx::query_as::<_, ProfileRow>(
            r#"
            SELECT
              id,
              first_name,
              last_name,
              username,
              email,
              role
            FROM users
            WHERE id = ?1
            "#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("DB error: {e}"))?;

        Ok(row)
    }

    pub async fn update_profile(
        pool: &SqlitePool,
        session_token: String,
        first_name: String,
        last_name: String,
        username: String,
        email: String,
    ) -> Result<(), String> {
        let (user_id, _role) = AuthService::require_session_user(pool, &session_token).await?;

        validate_profile(&first_name, &last_name, &username, &email)?;

        // unique check (excluding current user)
        let existing = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM users
            WHERE (username = ?1 OR email = ?2) AND id <> ?3
            "#,
        )
        .bind(username.trim())
        .bind(email.trim())
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("DB error: {e}"))?;

        if existing > 0 {
            return Err("Username or email already exists.".into());
        }

        sqlx::query(
            r#"
            UPDATE users
            SET first_name = ?1,
                last_name  = ?2,
                username   = ?3,
                email      = ?4
            WHERE id = ?5
            "#,
        )
        .bind(first_name.trim())
        .bind(last_name.trim())
        .bind(username.trim())
        .bind(email.trim())
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| format!("Update failed: {e}"))?;

        Ok(())
    }

    pub async fn change_password(
        pool: &SqlitePool,
        session_token: String,
        old_password: String,
        new_password: String,
    ) -> Result<(), String> {
        let (user_id, _role) = AuthService::require_session_user(pool, &session_token).await?;

        validate_new_password(&old_password, &new_password)?;

        let row = sqlx::query_as::<_, PasswordRow>(
            r#"
            SELECT password_hash as "password_hash"
            FROM users
            WHERE id = ?1
            "#,
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("DB error: {e}"))?;

        let ok = verify_password(&old_password, &row.password_hash)?;
        if !ok {
            return Err("Old password is not correct.".into());
        }

        let new_hash = hash_password(&new_password)?;

        sqlx::query(
            r#"
            UPDATE users
            SET password_hash = ?1
            WHERE id = ?2
            "#,
        )
        .bind(new_hash)
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(|e| format!("Password update failed: {e}"))?;

        Ok(())
    }
}

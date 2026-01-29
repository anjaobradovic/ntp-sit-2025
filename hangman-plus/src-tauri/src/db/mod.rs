use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::fs;
use std::path::PathBuf;

pub async fn init_db(db_path: PathBuf) -> Result<SqlitePool, String> {
    // napravi parent folder da SQLite može da kreira fajl
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create db dir failed: {e}"))?;
    }

    // NOTE: sqlx sqlite URL format
    let db_url = format!("sqlite:{}", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .map_err(|e| format!("DB connect failed: {e}"))?;

    sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&pool)
        .await
        .map_err(|e| format!("PRAGMA failed: {e}"))?;

    // USERS
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name  TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Create users failed: {e}"))?;

    // Ako ti je baza već postojala prije, treba ALTER za nove kolone:
    // SQLite nema IF NOT EXISTS za ADD COLUMN u svim verzijama, pa pokušamo “best effort”
    let _ = sqlx::query(r#"ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT '';"#)
        .execute(&pool)
        .await;
    let _ = sqlx::query(r#"ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT '';"#)
        .execute(&pool)
        .await;

    // SESSIONS
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL,
          revoked_at INTEGER NULL,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(&pool)
    .await
    .map_err(|e| format!("Create sessions failed: {e}"))?;

    Ok(pool)
}

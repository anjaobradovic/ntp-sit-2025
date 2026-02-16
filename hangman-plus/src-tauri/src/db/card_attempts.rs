use sqlx::SqlitePool;

pub async fn init(pool: &SqlitePool) -> Result<(), String> {
 
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS card_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          card_id INTEGER NOT NULL,

          is_won INTEGER NOT NULL CHECK (is_won IN (0, 1)),

          category TEXT,
          language TEXT,
          difficulty TEXT,
          wrong_count INTEGER,
          max_wrong INTEGER,

          played_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_card_attempts_user ON card_attempts(user_id);
        CREATE INDEX IF NOT EXISTS idx_card_attempts_user_won ON card_attempts(user_id, is_won);
        CREATE INDEX IF NOT EXISTS idx_card_attempts_user_time ON card_attempts(user_id, played_at);
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Init card_attempts failed: {e}"))?;

    Ok(())
}

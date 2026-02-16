use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct LogAttemptRequest {
    #[serde(rename = "userId")]
    pub user_id: i64,

    #[serde(rename = "cardId")]
    pub card_id: i64,

    #[serde(rename = "isWon")]
    pub is_won: bool,

    pub category: Option<String>,   // "BONES" | "ORGANS"
    pub language: Option<String>,   // "EN" | "LAT"
    pub difficulty: Option<String>, // "EASY" | "HARD"

    #[serde(rename = "wrongCount")]
    pub wrong_count: Option<i64>,

    #[serde(rename = "maxWrong")]
    pub max_wrong: Option<i64>,
}

async fn ensure_table(pool: &SqlitePool) -> Result<(), String> {
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

#[tauri::command]
pub async fn log_card_attempt(
    pool: State<'_, SqlitePool>,
    req: LogAttemptRequest,
) -> Result<(), String> {
    println!(
        "[log_card_attempt] user_id={} card_id={} is_won={}",
        req.user_id, req.card_id, req.is_won
    );

    ensure_table(&pool).await?;

    sqlx::query(
        r#"
        INSERT INTO card_attempts
          (user_id, card_id, is_won, category, language, difficulty, wrong_count, max_wrong)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(req.user_id)
    .bind(req.card_id)
    .bind(if req.is_won { 1 } else { 0 })
    .bind(req.category)
    .bind(req.language)
    .bind(req.difficulty)
    .bind(req.wrong_count)
    .bind(req.max_wrong)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Insert attempt failed: {e}"))?;

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MissedCard {
    pub card_id: i64,
    pub category: String,
    pub english: String,
    pub latin: String,
    pub image_path: String,
    pub last_played_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserStatsResponse {
    pub guessed_count: i64,
    pub missed_count: i64,
    pub missed_cards: Vec<MissedCard>,
}

#[tauri::command]
pub async fn get_user_stats(
    pool: State<'_, SqlitePool>,
    userId: i64, // JS: invoke("get_user_stats", { userId })
) -> Result<UserStatsResponse, String> {
    let user_id = userId;

    println!("[get_user_stats] called for user {}", user_id);

    ensure_table(&pool).await?;

    let totals = sqlx::query(
        r#"
        SELECT
          COALESCE(SUM(CASE WHEN is_won = 1 THEN 1 ELSE 0 END), 0) AS guessed,
          COALESCE(SUM(CASE WHEN is_won = 0 THEN 1 ELSE 0 END), 0) AS missed
        FROM card_attempts
        WHERE user_id = ?
        "#,
    )
    .bind(user_id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("Fetch totals failed: {e}"))?;

    let guessed_count: i64 = totals.get("guessed");
    let missed_count: i64 = totals.get("missed");

    let rows = sqlx::query(
        r#"
        SELECT
          c.id AS card_id,
          c.category AS category,
          c.english AS english,
          c.latin AS latin,
          c.image_path AS image_path,
          MAX(a.played_at) AS last_played_at
        FROM card_attempts a
        JOIN cards c ON c.id = a.card_id
        WHERE a.user_id = ?
          AND a.is_won = 0
        GROUP BY c.id, c.category, c.english, c.latin, c.image_path
        ORDER BY last_played_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Fetch missed cards failed: {e}"))?;

    let missed_cards = rows
        .into_iter()
        .map(|r| MissedCard {
            card_id: r.get::<i64, _>("card_id"),
            category: r.get::<String, _>("category"),
            english: r.get::<String, _>("english"),
            latin: r.get::<String, _>("latin"),
            image_path: r.get::<String, _>("image_path"),
            last_played_at: r.get::<String, _>("last_played_at"),
        })
        .collect();

    Ok(UserStatsResponse {
        guessed_count,
        missed_count,
        missed_cards,
    })
}

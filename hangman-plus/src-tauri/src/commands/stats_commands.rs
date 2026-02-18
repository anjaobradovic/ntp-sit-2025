use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::State;

// -------------------- LOG ATTEMPT --------------------

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogAttemptRequest {
    pub user_id: i64,
    pub card_id: i64,
    pub is_won: bool,

    pub category: Option<String>,   // "BONES" | "ORGANS"
    pub language: Option<String>,   // "EN" | "LAT"
    pub difficulty: Option<String>, // "EASY" | "HARD"

    pub wrong_count: Option<i64>,
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

// -------------------- STATS --------------------

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
        .collect::<Vec<_>>();

    Ok(UserStatsResponse {
        guessed_count,
        missed_count,
        missed_cards,
    })
}

// -------------------- ANALYTICS DTOs --------------------

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

// -------------------- ANALYTICS COMMAND --------------------

#[tauri::command]
pub async fn get_user_analytics(
    pool: State<'_, SqlitePool>,
    userId: i64,
    days: Option<i64>, // JS: invoke("get_user_analytics", { userId, days: 14 })
) -> Result<UserAnalyticsResponse, String> {
    let user_id = userId;
    let days = days.unwrap_or(14).clamp(1, 365);

    ensure_table(&pool).await?;

    // 1) DAILY (attempts/wins/losses) last N days
    let daily_rows = sqlx::query(
        r#"
        SELECT
          date(played_at) AS day,
          COUNT(*) AS attempts,
          SUM(CASE WHEN is_won = 1 THEN 1 ELSE 0 END) AS wins,
          SUM(CASE WHEN is_won = 0 THEN 1 ELSE 0 END) AS losses
        FROM card_attempts
        WHERE user_id = ?
          AND datetime(played_at) >= datetime('now', '-' || ? || ' days')
        GROUP BY date(played_at)
        ORDER BY day ASC
        "#,
    )
    .bind(user_id)
    .bind(days)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Fetch daily analytics failed: {e}"))?;

    let daily = daily_rows
        .into_iter()
        .map(|r| DailyPoint {
            day: r.get::<String, _>("day"),
            attempts: r.get::<i64, _>("attempts"),
            wins: r.get::<i64, _>("wins"),
            losses: r.get::<i64, _>("losses"),
        })
        .collect::<Vec<_>>();

    // 2) MISSED BY CATEGORY
    let missed_cat_rows = sqlx::query(
        r#"
        SELECT COALESCE(category, 'UNKNOWN') AS label, COUNT(*) AS value
        FROM card_attempts
        WHERE user_id = ?
          AND is_won = 0
        GROUP BY COALESCE(category, 'UNKNOWN')
        ORDER BY value DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Fetch missed_by_category failed: {e}"))?;

    let missed_by_category = missed_cat_rows
        .into_iter()
        .map(|r| LabelValue {
            label: r.get::<String, _>("label"),
            value: r.get::<i64, _>("value"),
        })
        .collect::<Vec<_>>();

    // 3) ATTEMPTS BY CATEGORY
    let attempts_cat_rows = sqlx::query(
        r#"
        SELECT COALESCE(category, 'UNKNOWN') AS label, COUNT(*) AS value
        FROM card_attempts
        WHERE user_id = ?
        GROUP BY COALESCE(category, 'UNKNOWN')
        ORDER BY value DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Fetch attempts_by_category failed: {e}"))?;

    let attempts_by_category = attempts_cat_rows
        .into_iter()
        .map(|r| LabelValue {
            label: r.get::<String, _>("label"),
            value: r.get::<i64, _>("value"),
        })
        .collect::<Vec<_>>();

    // 4) DIFFICULTY STATS
    let diff_rows = sqlx::query(
        r#"
        SELECT
          COALESCE(difficulty, 'UNKNOWN') AS difficulty,
          COUNT(*) AS attempts,
          SUM(CASE WHEN is_won = 1 THEN 1 ELSE 0 END) AS wins,
          SUM(CASE WHEN is_won = 0 THEN 1 ELSE 0 END) AS losses
        FROM card_attempts
        WHERE user_id = ?
        GROUP BY COALESCE(difficulty, 'UNKNOWN')
        ORDER BY attempts DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Fetch difficulty analytics failed: {e}"))?;

    let difficulty = diff_rows
        .into_iter()
        .map(|r| {
            let attempts: i64 = r.get("attempts");
            let wins: i64 = r.get("wins");
            let losses: i64 = r.get("losses");
            let win_rate = if attempts > 0 {
                wins as f64 / attempts as f64
            } else {
                0.0
            };

            DifficultyStats {
                difficulty: r.get::<String, _>("difficulty"),
                attempts,
                wins,
                losses,
                win_rate,
            }
        })
        .collect::<Vec<_>>();

    // 5) WRONG COUNT DISTRIBUTION
    let wrong_rows = sqlx::query(
        r#"
        SELECT CAST(wrong_count AS TEXT) AS label, COUNT(*) AS value
        FROM card_attempts
        WHERE user_id = ?
          AND wrong_count IS NOT NULL
        GROUP BY wrong_count
        ORDER BY wrong_count ASC
        "#,
    )
    .bind(user_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Fetch wrong_count_dist failed: {e}"))?;

    let wrong_count_dist = wrong_rows
        .into_iter()
        .map(|r| LabelValue {
            label: r.get::<String, _>("label"),
            value: r.get::<i64, _>("value"),
        })
        .collect::<Vec<_>>();

    Ok(UserAnalyticsResponse {
        daily,
        missed_by_category,
        attempts_by_category,
        difficulty,
        wrong_count_dist,
    })
}

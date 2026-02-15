use sqlx::SqlitePool;
use time::OffsetDateTime;

use crate::domain::dto::{CardResponse, CreateCardInput};
use crate::services::auth_service::AuthService;

fn now_unix() -> i64 {
    OffsetDateTime::now_utc().unix_timestamp()
}

pub struct CardService;

impl CardService {
    pub async fn add_card_admin(
        pool: &SqlitePool,
        input: CreateCardInput,
    ) -> Result<CardResponse, String> {
        let (user_id, role) =
            AuthService::require_session_user(pool, &input.sessionToken).await?;
        if role != "ADMIN" {
            return Err("Forbidden: admin only.".into());
        }

        let id = sqlx::query_scalar::<_, i64>(
            r#"
            INSERT INTO cards (category, english, latin, image_path, status, created_by, created_at)
            VALUES (?1, ?2, ?3, ?4, 'APPROVED', ?5, ?6)
            RETURNING id
            "#,
        )
        .bind(input.category.trim())
        .bind(input.english.trim())
        .bind(input.latin.trim())
        .bind(input.imagePath.trim())
        .bind(user_id)
        .bind(now_unix())
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Insert failed: {e}"))?;

        Ok(CardResponse {
            id,
            status: "APPROVED".into(),
        })
    }

    pub async fn request_card_user(
        pool: &SqlitePool,
        input: CreateCardInput,
    ) -> Result<CardResponse, String> {
        let (user_id, _role) =
            AuthService::require_session_user(pool, &input.sessionToken).await?;

        let id = sqlx::query_scalar::<_, i64>(
            r#"
            INSERT INTO cards (category, english, latin, image_path, status, created_by, created_at)
            VALUES (?1, ?2, ?3, ?4, 'PENDING', ?5, ?6)
            RETURNING id
            "#,
        )
        .bind(input.category.trim())
        .bind(input.english.trim())
        .bind(input.latin.trim())
        .bind(input.imagePath.trim())
        .bind(user_id)
        .bind(now_unix())
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Request create failed: {e}"))?;

        Ok(CardResponse {
            id,
            status: "PENDING".into(),
        })
    }

    pub async fn approve_card(
        pool: &SqlitePool,
        sessionToken: String,
        cardId: i64,
    ) -> Result<(), String> {
        let (_user_id, role) = AuthService::require_session_user(pool, &sessionToken).await?;
        if role != "ADMIN" {
            return Err("Forbidden: admin only.".into());
        }

        let rows = sqlx::query(r#"UPDATE cards SET status = 'APPROVED' WHERE id = ?1"#)
            .bind(cardId)
            .execute(pool)
            .await
            .map_err(|e| format!("Approve failed: {e}"))?
            .rows_affected();

        if rows == 0 {
            return Err("Card not found.".into());
        }

        Ok(())
    }

    pub async fn reject_card(
        pool: &SqlitePool,
        sessionToken: String,
        cardId: i64,
    ) -> Result<(), String> {
        let (_user_id, role) = AuthService::require_session_user(pool, &sessionToken).await?;
        if role != "ADMIN" {
            return Err("Forbidden: admin only.".into());
        }

        let rows = sqlx::query(r#"UPDATE cards SET status = 'REJECTED' WHERE id = ?1"#)
            .bind(cardId)
            .execute(pool)
            .await
            .map_err(|e| format!("Reject failed: {e}"))?
            .rows_affected();

        if rows == 0 {
            return Err("Card not found.".into());
        }

        Ok(())
    }

    pub async fn list_pending_cards(
    pool: &SqlitePool,
    sessionToken: String,
) -> Result<Vec<crate::domain::dto::PendingCard>, String> {
    let (_user_id, role) = AuthService::require_session_user(pool, &sessionToken).await?;
    if role != "ADMIN" {
        return Err("Forbidden: admin only.".into());
    }

    let rows = sqlx::query_as::<_, crate::domain::dto::PendingCard>(
        r#"
        SELECT
            id,
            category,
            english,
            latin,
            image_path,
            status,
            created_by,
            created_at
        FROM cards
        WHERE status = 'PENDING'
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("DB error: {e}"))?;

    Ok(rows)
}

pub async fn count_pending_cards(
    pool: &SqlitePool,
    sessionToken: String,
) -> Result<i64, String> {
    let (_user_id, role) = AuthService::require_session_user(pool, &sessionToken).await?;
    if role != "ADMIN" {
        return Err("Forbidden: admin only.".into());
    }

    let cnt = sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*) FROM cards WHERE status = 'PENDING'"#,
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("DB error: {e}"))?;

    Ok(cnt)
}


}

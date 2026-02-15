use sqlx::{Row, SqlitePool};

use crate::domain::{card::Card, category::Category};

pub async fn get_cards_by_category(
    pool: &SqlitePool,
    category: Category,
) -> Result<Vec<Card>, String> {
    let rows = sqlx::query(
        r#"
        SELECT id, category, english, latin, image_path
        FROM cards
        WHERE category = ?
          AND status = 'APPROVED'
        "#,
    )
    .bind(category.as_str())
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Fetch cards failed: {e}"))?;

    let mut cards = Vec::with_capacity(rows.len());

    for r in rows {
        let cat_str: String = r.get("category");

        let cat = match cat_str.as_str() {
            "BONES" => Category::Bones,
            "ORGANS" => Category::Organs,
            other => return Err(format!("Unknown category in DB: {other}")),
        };

        cards.push(Card {
            id: r.get::<i64, _>("id"),
            category: cat,
            english: r.get::<String, _>("english"),
            latin: r.get::<String, _>("latin"),
            image_path: r.get::<String, _>("image_path"),
        });
    }

    Ok(cards)
}

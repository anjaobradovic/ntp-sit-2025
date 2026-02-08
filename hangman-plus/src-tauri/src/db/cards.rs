use sqlx::{Row, SqlitePool};

use crate::domain::card::Card;
use crate::domain::category::Category;

pub async fn get_random_card(pool: &SqlitePool, category: Category) -> Result<Card, String> {
    let row = sqlx::query(
        r#"
        SELECT id, category, english, latin, image_path
        FROM cards
        WHERE category = ?
        ORDER BY RANDOM()
        LIMIT 1
        "#,
    )
    .bind(category.as_str())
    .fetch_one(pool)
    .await
    .map_err(|e| format!("get_random_card failed: {e}"))?;

    let id: i64 = row.try_get("id").map_err(|e| e.to_string())?;
    let cat_str: String = row.try_get("category").map_err(|e| e.to_string())?;
    let english: String = row.try_get("english").map_err(|e| e.to_string())?;
    let latin: String = row.try_get("latin").map_err(|e| e.to_string())?;
    let image_path: String = row.try_get("image_path").map_err(|e| e.to_string())?;

    let cat = match cat_str.as_str() {
        "BONES" => Category::Bones,
        "ORGANS" => Category::Organs,
        other => return Err(format!("Unknown category in DB: {other}")),
    };

    Ok(Card {
        id,
        category: cat,
        english,
        latin,
        image_path,
    })
}

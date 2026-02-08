#[cfg(test)]
mod tests {
    use crate::db;
    use crate::domain::category::Category;

    #[tokio::test]
    async fn test_get_random_card_bones() {
        // TEMP db file (ne dira tvoju pravu bazu)
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("test.db");

        let pool = db::init_db(db_path).await.unwrap();

        // ubaci test row
        sqlx::query(
            r#"
            INSERT INTO cards (category, english, latin, image_path)
            VALUES ('BONES', 'Test bone', 'Testus os', '/cards/bones/test.png');
            "#
        )
        .execute(&pool)
        .await
        .unwrap();

        let card = db::cards::get_random_card(&pool, Category::Bones).await.unwrap();
        assert_eq!(card.english, "Test bone");
    }
}

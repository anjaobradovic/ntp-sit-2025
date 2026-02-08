use serde::Serialize;
use crate::domain::category::Category;

#[derive(Debug, Clone, Serialize)]
pub struct Card {
    pub id: i64,
    pub category: Category,
    pub english: String,
    pub latin: String,
    pub image_path: String,
}

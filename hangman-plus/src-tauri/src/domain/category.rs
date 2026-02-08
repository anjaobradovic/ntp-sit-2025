use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Category {
    Bones,
    Organs,
}

impl Category {
    pub fn as_str(&self) -> &'static str {
        match self {
            Category::Bones => "BONES",
            Category::Organs => "ORGANS",
        }
    }
}

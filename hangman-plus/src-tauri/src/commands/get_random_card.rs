#[tauri::command]
pub fn get_random_card(category: Category, state: tauri::State<DbState>)
    -> Result<Card, String>
{
    let conn = state.conn.lock().map_err(|_| "DB lock error")?;
    db::cards_repo::get_random_card(&conn, category)
        .map_err(|e| e.to_string())
}

use std::collections::HashMap;
use std::sync::Mutex;

use rand::seq::SliceRandom;
use rand::thread_rng;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;

use crate::db;
use crate::domain::{card::Card, category::Category};

#[derive(Debug)]
pub struct GamesState {
    pub games: Mutex<HashMap<Uuid, GameRun>>,
}

impl Default for GamesState {
    fn default() -> Self {
        Self {
            games: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Debug)]
struct GameRun {
    category: Category,
    deck: Vec<Card>,
    idx: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StartGameResponse {
    pub game_id: Uuid,
    pub total: usize,
    pub card: Option<Card>,
    pub finished: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NextCardResponse {
    pub card: Option<Card>,
    pub finished: bool,
    pub remaining: usize,
    pub message: String,
}

// START
#[tauri::command]
pub async fn start_game(
    pool: State<'_, SqlitePool>,
    games: State<'_, GamesState>,
    category: Category,
) -> Result<StartGameResponse, String> {
    let mut deck = db::cards::get_cards_by_category(&pool, category).await?;

    if deck.is_empty() {
        return Ok(StartGameResponse {
            game_id: Uuid::new_v4(),
            total: 0,
            card: None,
            finished: true,
            message: "Nema karata za ovu kategoriju.".to_string(),
        });
    }

    deck.shuffle(&mut thread_rng());

    let game_id = Uuid::new_v4();
    let first = deck.get(0).cloned();

    let run = GameRun {
        category,
        deck,
        idx: 0,
    };

    games
        .games
        .lock()
        .map_err(|_| "GamesState lock failed".to_string())?
        .insert(game_id, run);

    Ok(StartGameResponse {
        game_id,
        total: run_total(&games, game_id)?,
        card: first,
        finished: false,
        message: "Igra je počela.".to_string(),
    })
}

// NEXT
#[tauri::command]
pub async fn next_card(
    games: State<'_, GamesState>,
    game_id: Uuid,
) -> Result<NextCardResponse, String> {
    let mut map = games
        .games
        .lock()
        .map_err(|_| "GamesState lock failed".to_string())?;

    let run = map.get_mut(&game_id).ok_or("Nevažeći game_id.")?;

    run.idx += 1;

    if run.idx >= run.deck.len() {
        return Ok(NextCardResponse {
            card: None,
            finished: true,
            remaining: 0,
            message: "Došli ste do kraja. Hoćete li da ponovite od početka?".to_string(),
        });
    }

    let remaining = run.deck.len().saturating_sub(run.idx + 1);

    Ok(NextCardResponse {
        card: Some(run.deck[run.idx].clone()),
        finished: false,
        remaining,
        message: "Nova karta.".to_string(),
    })
}

// RESET
#[tauri::command]
pub async fn reset_game(
    games: State<'_, GamesState>,
    game_id: Uuid,
) -> Result<NextCardResponse, String> {
    let mut map = games
        .games
        .lock()
        .map_err(|_| "GamesState lock failed".to_string())?;

    let run = map.get_mut(&game_id).ok_or("Nevažeći game_id.")?;

    run.deck.shuffle(&mut thread_rng());
    run.idx = 0;

    let remaining = run.deck.len().saturating_sub(1);

    Ok(NextCardResponse {
        card: Some(run.deck[0].clone()),
        finished: false,
        remaining,
        message: "Krenuli smo ispočetka.".to_string(),
    })
}

// END
#[tauri::command]
pub async fn end_game(games: State<'_, GamesState>, game_id: Uuid) -> Result<(), String> {
    games
        .games
        .lock()
        .map_err(|_| "GamesState lock failed".to_string())?
        .remove(&game_id);
    Ok(())
}

fn run_total(games: &State<'_, GamesState>, game_id: Uuid) -> Result<usize, String> {
    let map = games
        .games
        .lock()
        .map_err(|_| "GamesState lock failed".to_string())?;

    Ok(map.get(&game_id).map(|r| r.deck.len()).unwrap_or(0))
}

import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "../styles/gamepage.css";

type Settings = {
  category: "ORGANS" | "BONES";
  language: "EN" | "LAT";
  difficulty: "EASY" | "HARD";
  maxWrong: number;
};

type Card = {
  id: number;
  category: "ORGANS" | "BONES";
  english: string;
  latin: string;
  image_path: string;
};

type StartGameResponse = {
  game_id: string;
  total: number;
  card: Card | null;
  finished: boolean;
  message: string;
};

type NextCardResponse = {
  card: Card | null;
  finished: boolean;
  remaining: number;
  message: string;
};

type Props = {
  settings: Settings;
  userId: number;
  onExit: () => void;
};

export default function GamePage({ settings, userId, onExit }: Props) {
  const [gameId, setGameId] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);

  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");

  const [endOfDeckOpen, setEndOfDeckOpen] = useState(false);
  const [endOfDeckText, setEndOfDeckText] = useState("");
  const [uiMsg, setUiMsg] = useState<string>("");

  const lastLoggedRef = useRef<{ cardId: number; status: "won" | "lost" } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const answer = useMemo(() => {
    if (!card) return "";
    return settings.language === "EN" ? card.english : card.latin;
  }, [card, settings.language]);

  const normalizedAnswer = useMemo(() => normalize(answer), [answer]);

  const revealed = useMemo(() => {
    const g = new Set(guessed);
    return normalizedAnswer.split("").map((ch) => {
      if (ch === " ") return " ";
      if (!isAlpha(ch)) return ch;
      return g.has(ch) ? ch : "";
    });
  }, [normalizedAnswer, guessed]);

  const mistakesLeft = settings.maxWrong - wrong;

  const hasWon = useMemo(() => {
    if (!normalizedAnswer) return false;
    for (const ch of normalizedAnswer) {
      if (ch === " ") continue;
      if (!isAlpha(ch)) continue;
      if (!guessed.includes(ch)) return false;
    }
    return true;
  }, [normalizedAnswer, guessed]);

  const hasLost = useMemo(() => wrong >= settings.maxWrong, [wrong, settings.maxWrong]);
  const canGoNext = status === "won" || status === "lost";

  // START game when category changes
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await invoke<StartGameResponse>("start_game", {
          category: settings.category,
        });

        if (!mounted) return;

        lastLoggedRef.current = null;

        setGameId(res.game_id);
        setCard(res.card);
        setGuessed([]);
        setWrong(0);
        setStatus("playing");
        setEndOfDeckOpen(false);
        setEndOfDeckText("");
        setUiMsg("");
      } catch (e) {
        console.error("START_GAME failed:", e);
        if (!mounted) return;
        setUiMsg("Backend error: start_game failed. Check console.");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [settings.category]);

  // Derive win/lose
  useEffect(() => {
    if (!card) return;
    if (hasWon) setStatus("won");
    else if (hasLost) setStatus("lost");
    else setStatus("playing");
  }, [card, hasWon, hasLost]);

  // Log attempt exactly once per card when won/lost
  useEffect(() => {
    if (!card) return;
    if (status !== "won" && status !== "lost") return;

    if (
      lastLoggedRef.current &&
      lastLoggedRef.current.cardId === card.id &&
      lastLoggedRef.current.status === status
    ) {
      return;
    }

    lastLoggedRef.current = { cardId: card.id, status };

    (async () => {
      try {
        await invoke("log_card_attempt", {
          req: {
            userId,               
            cardId: card.id,
            isWon: status === "won",
            category: settings.category,
            language: settings.language,
            difficulty: settings.difficulty,
            wrongCount: wrong,
            maxWrong: settings.maxWrong,
          },
        });
      } catch (e) {
        console.error("LOG_CARD_ATTEMPT failed:", e);
      }
    })();
  }, [card, status, userId, wrong, settings.category, settings.language, settings.difficulty, settings.maxWrong]);

  const focusInput = () => inputRef.current?.focus();

  const submitLetter = (raw: string) => {
    if (!normalizedAnswer) return;
    if (status !== "playing") return;

    const letter = normalize(raw).trim();
    if (letter.length !== 1) return;
    if (!isAlpha(letter)) return;
    if (guessed.includes(letter)) return;

    setGuessed((prev) => [...prev, letter]);

    if (!normalizedAnswer.includes(letter)) {
      setWrong((w) => w + 1);
    }
  };

  const nextCard = async () => {
    if (!canGoNext) {
      setUiMsg("Finish this card first.");
      return;
    }
    if (!gameId) {
      setUiMsg("Missing game id (start_game did not return it).");
      return;
    }

    setUiMsg("");

    try {
      const res = await invoke<NextCardResponse>("next_card", { gameId });

      if (res.finished) {
        setEndOfDeckText(res.message || "You reached the end. Restart from the beginning?");
        setEndOfDeckOpen(true);
        return;
      }

      lastLoggedRef.current = null;

      setCard(res.card);
      setGuessed([]);
      setWrong(0);
      setStatus("playing");
      setEndOfDeckOpen(false);
      setEndOfDeckText("");
    } catch (e) {
      console.error("NEXT_CARD invoke failed:", e);
      setUiMsg("Backend error while loading next card. Check console.");
    }
  };

  const restartDeck = async () => {
    if (!gameId) {
      setUiMsg("Missing game id (start_game did not return it).");
      return;
    }

    setUiMsg("");

    try {
      const res = await invoke<NextCardResponse>("reset_game", { gameId });

      lastLoggedRef.current = null;

      setCard(res.card);
      setGuessed([]);
      setWrong(0);
      setStatus("playing");
      setEndOfDeckOpen(false);
      setEndOfDeckText("");
    } catch (e) {
      console.error("RESET_GAME invoke failed:", e);
      setUiMsg("Backend error: reset_game failed. Check console.");
    }
  };

  const exitGame = async () => {
    try {
      if (gameId) {
        await invoke("end_game", { gameId });
      }
    } catch (e) {
      console.error("END_GAME invoke failed:", e);
    } finally {
      onExit();
    }
  };

  const headerLine = `${settings.category} • ${settings.language} • ${settings.difficulty} • ${mistakesLeft}/${settings.maxWrong}`;

  return (
    <div className="gp-page">
      <div className="gp-card">
        <div className="gp-topbar">
          <div>
            <div className="gp-title">Hangman+</div>
            <div className="gp-subtitle">{headerLine}</div>
          </div>

          <button className="gp-ghost" onClick={exitGame} type="button">
            Exit
          </button>
        </div>

        <div className="gp-layout">
          <div className="gp-hero">
            {card?.image_path ? <img src={card.image_path} alt="card" /> : null}
          </div>

          <div className="gp-grid">
            <div className="gp-left">
              <div className="gp-panel">
                <div className="gp-hangman">
                  <HangmanSvg wrong={wrong} maxWrong={settings.maxWrong} />
                </div>
              </div>
            </div>

            <div className="gp-right">
              <div className="gp-panel">
                <div className="gp-wordwrap" onClick={focusInput} role="button" tabIndex={0}>
                  <div className="gp-word">
                    {revealed.map((ch, i) => {
                      const isSpace = normalizedAnswer[i] === " ";
                      return (
                        <span className={`gp-slot ${isSpace ? "space" : ""}`} key={i}>
                          <span className="gp-slot-char">
                            {isSpace ? "\u00A0" : ch ? ch.toUpperCase() : "\u00A0"}
                          </span>
                          {!isSpace && <span className="gp-slot-underline" />}
                        </span>
                      );
                    })}
                  </div>

                  <div className="gp-tip">Click the word and type letters.</div>

                  <input
                    ref={inputRef}
                    className="gp-hidden-input"
                    value=""
                    onChange={() => {}}
                    onKeyDown={(e) => {
                      if (e.key.length === 1) submitLetter(e.key);
                      if (e.key === "Enter" || e.key === "Escape") inputRef.current?.blur();
                    }}
                  />
                </div>

                <div className="gp-status">
                  {status === "won" && <span className="gp-win">✅ Correct!</span>}
                  {status === "lost" && (
                    <span className="gp-lose">
                      ❌ Game over. Correct answer: <b>{answer}</b>
                    </span>
                  )}
                </div>

                <div className="gp-actions">
                  <button className="gp-primary" type="button" onClick={nextCard}>
                    Next card →
                  </button>
                  <button className="gp-secondary" type="button" onClick={focusInput}>
                    Type
                  </button>
                </div>

                {uiMsg && <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>{uiMsg}</div>}

                <div className="gp-guessed">
                  <div className="gp-guessed-title">Guessed:</div>
                  <div className="gp-guessed-list">
                    {guessed.length ? guessed.map((c) => c.toUpperCase()).join(" ") : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {endOfDeckOpen && (
        <div className="gp-modal-backdrop">
          <div className="gp-modal">
            <div className="gp-modal-title">End of deck</div>
            <div className="gp-modal-text">
              {endOfDeckText || "You reached the end. Restart from the beginning?"}
            </div>
            <div className="gp-modal-actions">
              <button className="gp-ghost" onClick={exitGame} type="button">
                Exit
              </button>
              <button className="gp-primary" onClick={restartDeck} type="button">
                Restart deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function normalize(s: string) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isAlpha(ch: string) {
  return /^[a-z]$/.test(ch);
}

/* ---------- hangman svg ---------- */

function HangmanSvg({ wrong, maxWrong }: { wrong: number; maxWrong: number }) {
  const parts = (() => {
    if (maxWrong <= 3) {
      const set = new Set<string>();
      if (wrong >= 1) set.add("head");
      if (wrong >= 2) set.add("body");
      if (wrong >= 3) {
        set.add("armL");
        set.add("armR");
        set.add("legL");
        set.add("legR");
      }
      return set;
    }

    const set = new Set<string>();
    if (wrong >= 1) set.add("head");
    if (wrong >= 2) set.add("body");
    if (wrong >= 3) set.add("armL");
    if (wrong >= 4) set.add("armR");
    if (wrong >= 5) set.add("legL");
    if (wrong >= 6) set.add("legR");
    return set;
  })();

  const stroke = "white";
  const op = 0.92;

  return (
    <svg viewBox="0 0 520 420" width="100%" height="100%">
      <line x1="70" y1="380" x2="250" y2="380" stroke={stroke} strokeWidth="12" opacity={op} />
      <line x1="120" y1="380" x2="120" y2="40" stroke={stroke} strokeWidth="12" opacity={op} />
      <line x1="118" y1="40" x2="340" y2="40" stroke={stroke} strokeWidth="12" opacity={op} />
      <line x1="338" y1="40" x2="338" y2="90" stroke={stroke} strokeWidth="12" opacity={op} />

      {parts.has("head") && (
        <circle cx="338" cy="125" r="36" stroke={stroke} strokeWidth="10" fill="none" opacity={op} />
      )}

      {parts.has("body") && (
        <line x1="338" y1="162" x2="338" y2="255" stroke={stroke} strokeWidth="10" opacity={op} />
      )}

      {parts.has("armL") && (
        <line x1="338" y1="195" x2="300" y2="230" stroke={stroke} strokeWidth="10" opacity={op} />
      )}
      {parts.has("armR") && (
        <line x1="338" y1="195" x2="376" y2="230" stroke={stroke} strokeWidth="10" opacity={op} />
      )}

      {parts.has("legL") && (
        <line x1="338" y1="255" x2="306" y2="320" stroke={stroke} strokeWidth="10" opacity={op} />
      )}
      {parts.has("legR") && (
        <line x1="338" y1="255" x2="370" y2="320" stroke={stroke} strokeWidth="10" opacity={op} />
      )}
    </svg>
  );
}

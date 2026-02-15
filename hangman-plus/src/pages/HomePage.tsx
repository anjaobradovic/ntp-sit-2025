import { useMemo, useState } from "react";
import "../styles/homepage.css";

type Role = "ADMIN" | "USER";

type Props = {
  role?: Role;

  onLogout?: () => void;

  // ADMIN actions
  onAddNewCard?: () => void;
  onCardRequests?: () => void;
  onUsers?: () => void;

  // USER actions
  onGrowTogether?: () => void;
  onStats?: () => void;

  onPlay?: (s: {
    category: "ORGANS" | "BONES";
    language: "EN" | "LAT";
    difficulty: "EASY" | "HARD";
    maxWrong: number;
  }) => void;
};

type Category = "ORGANS" | "BONES" | "";
type Language = "EN" | "LAT" | "";
type Difficulty = "EASY" | "HARD" | "";

export default function HomePage({
  role,
  onLogout,
  onAddNewCard,
  onCardRequests,
  onUsers,
  onGrowTogether,
  onStats,
  onPlay,
}: Props) {
  const [category, setCategory] = useState<Category>("");
  const [language, setLanguage] = useState<Language>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("");

  const maxWrong = useMemo(() => {
    if (!difficulty) return 0;
    return difficulty === "EASY" ? 6 : 3;
  }, [difficulty]);

  const canPlay = useMemo(
    () => Boolean(category && language && difficulty),
    [category, language, difficulty]
  );

  const handlePlay = () => {
    if (!canPlay || !onPlay) return;

    onPlay({
      category: category as "ORGANS" | "BONES",
      language: language as "EN" | "LAT",
      difficulty: difficulty as "EASY" | "HARD",
      maxWrong,
    });
  };

  return (
    <div className="hp-page">
      <div className="hp-card">
        <div className="hp-topbar">
          <div>
            <h1 className="hp-title">Hangman+</h1>
            <p className="hp-subtitle">
              Pick a category, language, and difficulty, then press Play.
            </p>
          </div>

          <div className="hp-actions">
            {role === "ADMIN" && (
              <>
                <button
                  className="hp-ghost"
                  onClick={onAddNewCard}
                  type="button"
                >
                  Add new card
                </button>

                <button
                  className="hp-ghost"
                  onClick={onCardRequests}
                  type="button"
                >
                  Card requests
                </button>

                <button
                  className="hp-ghost"
                  onClick={onUsers}
                  type="button"
                >
                  Users
                </button>
              </>
            )}

            {role === "USER" && (
              <>
                <button
                  className="hp-ghost"
                  onClick={onGrowTogether}
                  type="button"
                >
                  Grow together
                </button>

                <button
                  className="hp-ghost"
                  onClick={onStats}
                  type="button"
                >
                  Stats
                </button>
              </>
            )}

            {onLogout && (
              <button className="hp-ghost" onClick={onLogout} type="button">
                Log out
              </button>
            )}
          </div>
        </div>

        {/* CATEGORY */}
        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Category</span>
            {category && (
              <span className="hp-pill">
                {category === "ORGANS" ? "Organs" : "Bones"}
              </span>
            )}
          </div>

          <div className="hp-row">
            <ChoiceCard
              title="Organs"
              desc="Anatomy – organs"
              icon="🫀"
              selected={category === "ORGANS"}
              onClick={() => setCategory("ORGANS")}
            />
            <ChoiceCard
              title="Bones"
              desc="Skeletal system"
              icon="🦴"
              selected={category === "BONES"}
              onClick={() => setCategory("BONES")}
            />
          </div>
        </section>

        {/* LANGUAGE */}
        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Language</span>
            {language && (
              <span className="hp-pill">
                {language === "EN" ? "English" : "Latin"}
              </span>
            )}
          </div>

          <div className="hp-row">
            <ChoiceCard
              title="English"
              desc="Guess in English"
              icon="🇬🇧"
              selected={language === "EN"}
              onClick={() => setLanguage("EN")}
            />
            <ChoiceCard
              title="Latin"
              desc="Guess in Latin"
              icon="🏛️"
              selected={language === "LAT"}
              onClick={() => setLanguage("LAT")}
            />
          </div>
        </section>

        {/* DIFFICULTY */}
        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Difficulty</span>
            {difficulty && (
              <span className="hp-pill">
                {difficulty === "EASY" ? "Easy" : "Hard"} • {maxWrong} mistakes
              </span>
            )}
          </div>

          <div className="hp-row">
            <ChoiceCard
              title="Easy"
              desc="6 mistakes: head, body, arms (L/R), legs (L/R)"
              icon="🙂"
              selected={difficulty === "EASY"}
              onClick={() => setDifficulty("EASY")}
            />
            <ChoiceCard
              title="Hard"
              desc="3 mistakes: head, body, arms+legs together"
              icon="😈"
              selected={difficulty === "HARD"}
              onClick={() => setDifficulty("HARD")}
            />
          </div>
        </section>

        <button
          className={`hp-play ${!canPlay ? "disabled" : ""}`}
          onClick={handlePlay}
          disabled={!canPlay}
          type="button"
        >
          ▶ PLAY
        </button>

        <div className="hp-hint">
          {!canPlay
            ? "Select category, language, and difficulty to enable Play."
            : `Ready. You will have ${maxWrong} mistakes.`}
        </div>
      </div>
    </div>
  );
}

type ChoiceCardProps = {
  title: string;
  desc: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
};

function ChoiceCard({
  title,
  desc,
  icon,
  selected,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      className={`hp-choice ${selected ? "selected" : ""}`}
      onClick={onClick}
      type="button"
    >
      <div className="hp-choice-top">
        <span className="hp-choice-icon">{icon}</span>
        <span className="hp-choice-title">{title}</span>
      </div>
      <div className="hp-choice-desc">{desc}</div>
      {selected && <div className="hp-check">✓ Selected</div>}
    </button>
  );
}

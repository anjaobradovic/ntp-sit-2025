import { useMemo, useState } from "react";
import "../styles/homepage.css";

type Props = {
  onLogout?: () => void;
};

type Topic = "MUSCLES" | "BONES" | "";
type Mode = "EASY" | "HARD" | "";

export default function HomePage({ onLogout }: Props) {
  const [topic, setTopic] = useState<Topic>("");
  const [mode, setMode] = useState<Mode>("");

  const canPlay = useMemo(() => Boolean(topic && mode), [topic, mode]);

  const handlePlay = () => {
    if (!canPlay) return;
    console.log("PLAY:", { topic, mode });
  };

  return (
    <div className="hp-page">
      <div className="hp-card">
        <div className="hp-topbar">
          <div>
            <h1 className="hp-title">Hangman+</h1>
            <p className="hp-subtitle">Choose a topic and difficulty, then press Play.</p>
          </div>

          {onLogout && (
            <button className="hp-ghost" onClick={onLogout} type="button">
              Log out
            </button>
          )}
        </div>

        {/* TOPIC */}
        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Topic</span>
            {topic && (
              <span className="hp-pill">
                {topic === "MUSCLES" ? "Muscles" : "Bones"}
              </span>
            )}
          </div>

          <div className="hp-row">
            <ChoiceCard
              title="Muscles"
              desc="Muscular system"
              icon="💪"
              selected={topic === "MUSCLES"}
              onClick={() => setTopic("MUSCLES")}
            />
            <ChoiceCard
              title="Bones"
              desc="Skeletal system"
              icon="🦴"
              selected={topic === "BONES"}
              onClick={() => setTopic("BONES")}
            />
          </div>
        </section>

        {/* MODE */}
        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Mode</span>
            {mode && (
              <span className="hp-pill">
                {mode === "EASY" ? "Easy (English)" : "Hard (Latin)"}
              </span>
            )}
          </div>

          <div className="hp-row">
            <ChoiceCard
              title="Easy"
              desc="Guess words in English"
              icon="🇬🇧"
              selected={mode === "EASY"}
              onClick={() => setMode("EASY")}
            />
            <ChoiceCard
              title="Hard"
              desc="Guess terms in Latin"
              icon="🏛️"
              selected={mode === "HARD"}
              onClick={() => setMode("HARD")}
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
            ? "Select a topic and a mode to enable Play."
            : "Ready. Press Play."}
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

function ChoiceCard({ title, desc, icon, selected, onClick }: ChoiceCardProps) {
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

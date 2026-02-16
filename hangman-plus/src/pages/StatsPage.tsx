import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "../styles/statspage.css";

type Props = {
  userId: number;
  onBack: () => void;
};

type MissedCard = {
  cardId: number;
  category: "ORGANS" | "BONES" | string;
  english: string;
  latin: string;
  imagePath: string;
  lastPlayedAt: string;
};

type UserStatsResponse = {
  guessedCount: number;
  missedCount: number;
  missedCards: MissedCard[];
};

export default function StatsPage({ userId, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<UserStatsResponse | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await invoke<UserStatsResponse>("get_user_stats", { userId });
        if (!mounted) return;
        setData(res);
      } catch (e: any) {
        console.error("get_user_stats failed:", e);
        if (!mounted) return;
        setErr(e?.message ?? "Failed to load stats.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const guessed = data?.guessedCount ?? 0;
  const missed = data?.missedCount ?? 0;

  const missedLabel = useMemo(() => {
    if (!data) return "Missed cards";
    const n = data.missedCards.length;
    return `Missed cards (${n})`;
  }, [data]);

  return (
    <div className="sp-page">
      <div className="sp-card">
        <div className="sp-topbar">
          <div>
            <div className="sp-title">Stats</div>
            <div className="sp-subtitle">Your performance overview</div>
          </div>

          <div className="sp-actions">
            <button className="sp-ghost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>
        </div>
        

        {loading && <div className="sp-info">Loading…</div>}
        {!loading && err && <div className="sp-error">{err}</div>}

        {!loading && !err && data && (
          <>
            <div className="sp-grid">
              <div className="sp-metric">
                <div className="sp-metric-label">Guessed</div>
                <div className="sp-metric-value">{guessed}</div>
              </div>

              <div className="sp-metric danger">
                <div className="sp-metric-label">Missed</div>
                <div className="sp-metric-value">{missed}</div>
              </div>
            </div>

            <div className="sp-panel">
              <button className="sp-accordion" type="button" onClick={() => setOpen((v) => !v)}>
                <span>{missedLabel}</span>
                <span className="sp-acc-icon">{open ? "▾" : "▸"}</span>
              </button>

              {open && (
                <div className="sp-list">
                  {data.missedCards.length === 0 ? (
                    <div className="sp-empty">No missed cards yet. 🔥</div>
                  ) : (
                    data.missedCards.map((c) => (
                      <div className="sp-item" key={c.cardId}>
                        <div className="sp-thumb">
                          {c.imagePath ? <img src={c.imagePath} alt="card" /> : null}
                        </div>

                        <div className="sp-item-main">
                          <div className="sp-item-title">
                            {c.category === "ORGANS" ? "🫀 Organs" : c.category === "BONES" ? "🦴 Bones" : c.category}
                          </div>
                          <div className="sp-item-sub">
                            <span className="sp-pill">EN: {c.english}</span>
                            <span className="sp-pill">LAT: {c.latin}</span>
                          </div>
                        </div>

                        <div className="sp-date">
                          <div className="sp-date-label">Last played</div>
                          <div className="sp-date-value">{c.lastPlayedAt}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

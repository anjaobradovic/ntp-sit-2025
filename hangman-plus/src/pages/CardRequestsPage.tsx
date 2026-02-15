import { useEffect, useState } from "react";
import { safeInvoke } from "../lib/invoke";
import "../styles/homepage.css";

type Props = {
  sessionToken: string;
  onBack: () => void;
};

type PendingCard = {
  id: number;
  category: string;
  english: string;
  latin: string;
  image_path: string;
  status: string;
  created_by: number;
  created_at: number;
};

export default function CardRequestsPage({ sessionToken, onBack }: Props) {
  const [items, setItems] = useState<PendingCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const load = async () => {
    setMsg("");
    setLoading(true);
    try {
      const res = await safeInvoke<PendingCard[]>("list_pending_cards", {
        sessionToken,
      });
      setItems(res);
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (cardId: number) => {
    setMsg("");
    try {
      await safeInvoke<void>("approve_card", { sessionToken, cardId });
      setItems((prev) => prev.filter((x) => x.id !== cardId));
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    }
  };

  const reject = async (cardId: number) => {
    setMsg("");
    try {
      await safeInvoke<void>("reject_card", { sessionToken, cardId });
      setItems((prev) => prev.filter((x) => x.id !== cardId));
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    }
  };

  return (
    <div className="hp-page">
      <div className="hp-card">
        <div className="hp-topbar">
          <div>
            <h1 className="hp-title">Card requests</h1>
            <p className="hp-subtitle">Pending submissions from users.</p>
          </div>

          <div className="hp-actions">
            <button className="hp-ghost" type="button" onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button className="hp-ghost" type="button" onClick={onBack}>
              ← Back
            </button>
          </div>
        </div>

        {msg && (
          <div className="hp-hint" style={{ marginTop: 8 }}>
            ❌ {msg}
          </div>
        )}

        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">
              Pending ({items.length})
            </span>
          </div>

          {items.length === 0 && !loading && (
            <div className="hp-hint">No pending requests.</div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            {items.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 14,
                  padding: 14,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      #{c.id} • {c.category}
                    </div>
                    <div style={{ opacity: 0.9, marginTop: 4 }}>
                      <b>EN:</b> {c.english} &nbsp; | &nbsp; <b>LAT:</b> {c.latin}
                    </div>
                    <div style={{ opacity: 0.75, marginTop: 6, fontSize: 13 }}>
                      <b>Image:</b> {c.image_path}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <button className="hp-ghost" type="button" onClick={() => approve(c.id)}>
                      ✅ Approve
                    </button>
                    <button className="hp-ghost" type="button" onClick={() => reject(c.id)}>
                      ❌ Reject
                    </button>
                  </div>
                </div>

                {/* optional preview */}
                <div style={{ marginTop: 12, opacity: 0.9 }}>
                  <img
                    src={c.image_path}
                    alt={c.english}
                    style={{
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "contain",
                      borderRadius: 12,
                      background: "rgba(0,0,0,0.18)",
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

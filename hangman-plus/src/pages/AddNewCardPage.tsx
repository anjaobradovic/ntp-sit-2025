import { useMemo, useState } from "react";
import { safeInvoke } from "../lib/invoke";

type Props = {
  sessionToken: string;
  onBack: () => void;
};

type Category = "ORGANS" | "BONES";

export default function AddNewCardPage({ sessionToken, onBack }: Props) {
  const [category, setCategory] = useState<Category>("BONES");
  const [english, setEnglish] = useState("");
  const [latin, setLatin] = useState("");
  const [imagePath, setImagePath] = useState("/cards/bones/");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const canSubmit = useMemo(() => {
    return (
      english.trim().length > 0 &&
      latin.trim().length > 0 &&
      imagePath.trim().length > 0 &&
      (category === "BONES" || category === "ORGANS")
    );
  }, [english, latin, imagePath, category]);

  const submit = async () => {
    if (!canSubmit || loading) return;
    setMsg("");
    setLoading(true);

    try {
      const res = await safeInvoke<{ id: number; status: string }>("admin_add_card", {
        input: {
          sessionToken,
          category,
          english,
          latin,
          imagePath,
        },
      });

      setMsg(`✅ Added! id=${res.id}, status=${res.status}`);
      setEnglish("");
      setLatin("");
      setImagePath(category === "BONES" ? "/cards/bones/" : "/cards/organs/");
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hp-page">
      <div className="hp-card">
        <div className="hp-topbar">
          <div>
            <h1 className="hp-title">Add new card</h1>
            <p className="hp-subtitle">Admin only • saves card into DB (imagePath for now).</p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="hp-ghost" type="button" onClick={onBack}>
              ← Back
            </button>
          </div>
        </div>

        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Category</span>
          </div>

          <div className="hp-row">
            <ChoiceMini
              title="Bones"
              desc="Skeletal system"
              selected={category === "BONES"}
              onClick={() => {
                setCategory("BONES");
                setImagePath("/cards/bones/");
              }}
            />
            <ChoiceMini
              title="Organs"
              desc="Anatomy – organs"
              selected={category === "ORGANS"}
              onClick={() => {
                setCategory("ORGANS");
                setImagePath("/cards/organs/");
              }}
            />
          </div>
        </section>

        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Names</span>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, opacity: 0.85 }}>English</label>
              <input
                className="hp-input"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                placeholder="e.g. Frontal bone"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, opacity: 0.85 }}>Latin</label>
              <input
                className="hp-input"
                value={latin}
                onChange={(e) => setLatin(e.target.value)}
                placeholder="e.g. Os frontale"
              />
            </div>
          </div>
        </section>

        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Image path</span>
          </div>

          <input
            className="hp-input"
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
            placeholder="/cards/bones/frontal-bone.png"
          />

          <div className="hp-hint" style={{ marginTop: 8 }}>
            For now we store just a path. Later we’ll add real upload into app data dir.
          </div>
        </section>

        <button
          className={`hp-play ${!canSubmit || loading ? "disabled" : ""}`}
          onClick={submit}
          disabled={!canSubmit || loading}
          type="button"
        >
          {loading ? "Saving..." : "Save card"}
        </button>

        {msg && <div className="hp-hint" style={{ marginTop: 10 }}>{msg}</div>}
      </div>
    </div>
  );
}

function ChoiceMini({
  title,
  desc,
  selected,
  onClick,
}: {
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`hp-choice ${selected ? "selected" : ""}`}
      onClick={onClick}
      type="button"
    >
      <div className="hp-choice-top">
        <span className="hp-choice-title">{title}</span>
      </div>
      <div className="hp-choice-desc">{desc}</div>
      {selected && <div className="hp-check">✓ Selected</div>}
    </button>
  );
}

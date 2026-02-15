import { useMemo, useState } from "react";
import { safeInvoke } from "../lib/invoke";
import "../styles/homepage.css";

type Props = {
  sessionToken: string;
  mode: "ADMIN" | "USER";
  onBack: () => void;
};

type Category = "ORGANS" | "BONES";

export default function AddNewCardPage({ sessionToken, mode, onBack }: Props) {
  const isAdmin = mode === "ADMIN";

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
      imagePath.trim().length > 0
    );
  }, [english, latin, imagePath]);

  const submit = async () => {
    if (loading) return;

    if (!canSubmit) {
      setMsg("❌ Please fill in all fields before submitting.");
      return;
    }

    setMsg("");
    setLoading(true);

    try {
      const command = isAdmin ? "admin_add_card" : "user_request_card";

      const res = await safeInvoke<{ id: number; status: string }>(command, {
        input: {
          sessionToken,
          category,
          english,
          latin,
          imagePath,
        },
      });

      if (isAdmin) {
        setMsg(`✅ Card successfully saved! (Status: ${res.status})`);
      } else {
        setMsg("✅ Request successfully sent! An admin will review it.");
      }

      setEnglish("");
      setLatin("");
      setImagePath(category === "BONES" ? "/cards/bones/" : "/cards/organs/");
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const title = isAdmin ? "Add New Card" : "Grow Together";
  const subtitle = isAdmin
    ? "Admin mode • The card will be instantly approved."
    : "User mode • Send a request for admin approval.";

  const buttonText = isAdmin ? "Save Card" : "Send Request";

  return (
    <div className="hp-page">
      <div className="hp-card">
        <div className="hp-topbar">
          <div>
            <h1 className="hp-title">{title}</h1>
            <p className="hp-subtitle">{subtitle}</p>
          </div>

          <div className="hp-actions">
            <button className="hp-ghost" type="button" onClick={onBack}>
              ← Back
            </button>
          </div>
        </div>

        {/* CATEGORY */}
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

        {/* NAMES */}
        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Names</span>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, opacity: 0.85 }}>
                English Name
              </label>
              <input
                className="hp-input"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                placeholder="e.g. Frontal bone"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, opacity: 0.85 }}>
                Latin Name
              </label>
              <input
                className="hp-input"
                value={latin}
                onChange={(e) => setLatin(e.target.value)}
                placeholder="e.g. Os frontale"
              />
            </div>
          </div>
        </section>

        {/* IMAGE */}
        <section className="hp-section">
          <div className="hp-section-header">
            <span className="hp-section-title">Image Path</span>
          </div>

          <input
            className="hp-input"
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
            placeholder="/cards/bones/frontal-bone.png"
          />

          <div className="hp-hint" style={{ marginTop: 8 }}>
            Currently we store only the image path. File upload can be added later.
          </div>
        </section>

        <button
          className={`hp-play ${(!canSubmit || loading) ? "disabled" : ""}`}
          onClick={submit}
          disabled={!canSubmit || loading}
          type="button"
        >
          {loading ? "Processing..." : buttonText}
        </button>

        {msg && (
          <div className="hp-hint" style={{ marginTop: 10 }}>
            {msg}
          </div>
        )}
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

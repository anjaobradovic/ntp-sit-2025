import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "../styles/statspage.css";

type Props = {
  sessionToken: string;
  userId: number; // mozes ostaviti stats preko userId (kao do sad)
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

type ProfileResponse = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
};

export default function StatsPage({ sessionToken, userId, onBack }: Props) {
  // stats
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<UserStatsResponse | null>(null);
  const [open, setOpen] = useState(false);

  // profile modal
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErr, setProfileErr] = useState<string>("");
  const [profileOk, setProfileOk] = useState<string>("");

  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [pwErr, setPwErr] = useState<string>("");
  const [pwOk, setPwOk] = useState<string>("");

  // -------------------- load stats --------------------
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

  // -------------------- profile helpers --------------------
  const openProfile = async () => {
    setProfileOpen(true);
    setProfileErr("");
    setProfileOk("");
    setPwErr("");
    setPwOk("");
    setOldPassword("");
    setNewPassword("");
    setNewPassword2("");

    setProfileLoading(true);
    try {
      const p = await invoke<ProfileResponse>("get_profile", { sessionToken });
      setProfile(p);

      // init editable
      setFirstName(p.firstName ?? "");
      setLastName(p.lastName ?? "");
      setUsername(p.username ?? "");
      setEmail(p.email ?? "");
    } catch (e: any) {
      console.error("get_profile failed:", e);
      setProfileErr(e?.message ?? "Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    setProfileOpen(false);
    setProfileErr("");
    setProfileOk("");
    setPwErr("");
    setPwOk("");
  };

  const saveProfile = async () => {
    setProfileErr("");
    setProfileOk("");
    setPwErr("");
    setPwOk("");

    setProfileLoading(true);
    try {
      await invoke<void>("update_profile", {
        req: {
          sessionToken,
          firstName,
          lastName,
          username,
          email,
        },
      });

      setProfileOk("Profile updated ✅");

      // refresh profile (optional)
      const p = await invoke<ProfileResponse>("get_profile", { sessionToken });
      setProfile(p);
      setFirstName(p.firstName ?? "");
      setLastName(p.lastName ?? "");
      setUsername(p.username ?? "");
      setEmail(p.email ?? "");
    } catch (e: any) {
      console.error("update_profile failed:", e);
      setProfileErr(e?.message ?? "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async () => {
    setPwErr("");
    setPwOk("");

    if (!oldPassword || !newPassword || !newPassword2) {
      setPwErr("Fill all password fields.");
      return;
    }
    if (newPassword !== newPassword2) {
      setPwErr("New password and confirmation do not match.");
      return;
    }

    setProfileLoading(true);
    try {
      await invoke<void>("change_password", {
        req: {
          sessionToken,
          oldPassword,
          newPassword,
        },
      });

      setPwOk("Password changed ✅");
      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e: any) {
      console.error("change_password failed:", e);
      setPwErr(e?.message ?? "Failed to change password.");
    } finally {
      setProfileLoading(false);
    }
  };

  // -------------------- UI --------------------
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

            <button className="sp-primary" onClick={openProfile} type="button">
              My profile
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
                            {c.category === "ORGANS"
                              ? "🫀 Organs"
                              : c.category === "BONES"
                              ? "🦴 Bones"
                              : c.category}
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

      {/* ---------- PROFILE MODAL ---------- */}
      {profileOpen && (
        <div className="sp-modal-backdrop" onClick={closeProfile} role="presentation">
          <div className="sp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="sp-modal-top">
              <div>
                <div className="sp-modal-title">My profile</div>
                <div className="sp-modal-sub">
                  {profile ? `@${profile.username} • ${profile.role}` : " "}
                </div>
              </div>

              <button className="sp-ghost" onClick={closeProfile} type="button">
                ✕
              </button>
            </div>

            {profileLoading && <div className="sp-info">Loading…</div>}
            {!profileLoading && profileErr && <div className="sp-error">{profileErr}</div>}
            {!profileLoading && profileOk && <div className="sp-success">{profileOk}</div>}

            <div className="sp-form">
              <div className="sp-row">
                <div className="sp-field">
                  <label>First name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="sp-field">
                  <label>Last name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="sp-row">
                <div className="sp-field">
                  <label>Username</label>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="sp-field">
                  <label>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="sp-form-actions">
                <button className="sp-primary" type="button" onClick={saveProfile} disabled={profileLoading}>
                  Save changes
                </button>
              </div>

              <div className="sp-divider" />

              <div className="sp-section-title">Change password</div>
              {pwErr && <div className="sp-error">{pwErr}</div>}
              {pwOk && <div className="sp-success">{pwOk}</div>}

              <div className="sp-row">
                <div className="sp-field">
                  <label>Old password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="sp-row">
                <div className="sp-field">
                  <label>New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="sp-field">
                  <label>Confirm new password</label>
                  <input
                    type="password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                  />
                </div>
              </div>

              <div className="sp-form-actions">
                <button className="sp-secondary" type="button" onClick={changePassword} disabled={profileLoading}>
                  Update password
                </button>
              </div>

              <div className="sp-modal-bottom">
                <button className="sp-ghost" onClick={closeProfile} type="button">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

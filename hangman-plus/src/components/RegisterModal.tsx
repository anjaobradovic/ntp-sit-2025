import { useState } from "react";
import { safeInvoke } from "../lib/invoke";
import "../styles/AuthModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  onSwitchToLogin: () => void;
};

export default function RegisterModal({ open, onClose, onSuccess, onSwitchToLogin }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (!open) return null; 

  const submit = async () => {
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      await safeInvoke<void>("register_user", {
        firstName,
        lastName,
        username,
        email,
        password,
      });

      const res = await safeInvoke<{ session_token: string }>("login_user", {
        identifier: username,
        password,
      });

      onSuccess(res.session_token);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Register</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="grid-2">
            <div className="field">
              <label className="label">First name</label>
              <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Last name</label>
              <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="label">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="field">
            <label className="label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>

          {error && <div className="error">{error}</div>}

          <div className="helper">
            Already have an account?{" "}
            <button onClick={onSwitchToLogin}>Log in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

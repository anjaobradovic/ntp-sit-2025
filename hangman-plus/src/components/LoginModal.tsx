import { useState } from "react";
import { safeInvoke } from "../lib/invoke";
import "../styles/AuthModal.css";
import type { LoginResponse } from "../types/auth";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  onSwitchToRegister: () => void;
};

export default function LoginModal({
  open,
  onClose,
  onSuccess,
  onSwitchToRegister,
}: Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await safeInvoke<LoginResponse>("login_user", {
        identifier,
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
          <h2 className="modal-title">Log in</h2>
          <button className="modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label className="label">Username or email</label>
            <input
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={submit} disabled={loading} type="button">
            {loading ? "Signing in..." : "Continue"}
          </button>

          {error && <div className="error">{error}</div>}

          <div className="helper">
            No account?{" "}
            <button onClick={onSwitchToRegister} type="button">
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import LandingPage from "./pages/LandingPage";
import NextPage from "./pages/NextPage";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import Toast from "./components/Toast";

type Screen = "landing" | "next";

const SESSION_KEY = "hangman_session_token";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // restore session on app start
  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return;

    (async () => {
      try {
        const ok = await invoke<boolean>("validate_session", { sessionToken: token });
        if (ok) setScreen("next");
        else localStorage.removeItem(SESSION_KEY);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    })();
  }, []);

  const showToast5s = (msg: string, after?: () => void) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => {
      setToastOpen(false);
      after?.();
    }, 5000);
  };

  const openAuth = () => {
    // default otvori login, a register je tab switch
    setLoginOpen(true);
    setRegisterOpen(false);
  };

  const onLoginSuccess = (token: string) => {
    localStorage.setItem(SESSION_KEY, token);
    setLoginOpen(false);

    showToast5s("Successfully logged in.", () => {
      setScreen("next");
    });
  };

  const onRegisterSuccess = () => {
    setRegisterOpen(false);

    showToast5s("Successfully registered.", () => {
      // nakon registracije otvori login
      setLoginOpen(true);
    });
  };

  const switchToRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const switchToLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  return (
    <div className="app-bg">
      {screen === "landing" && <LandingPage onOpenAuth={openAuth} />}
      {screen === "next" && <NextPage />}

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={onLoginSuccess}
        onSwitchToRegister={switchToRegister}
      />

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={onRegisterSuccess}
        onSwitchToLogin={switchToLogin}
      />

      <Toast message={toastMsg} open={toastOpen} />
    </div>
  );
}

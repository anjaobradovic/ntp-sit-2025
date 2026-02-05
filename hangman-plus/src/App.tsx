import { useState } from "react";

import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import Toast from "./components/Toast";

type Screen = "landing" | "home";

const SESSION_KEY = "hangman_session_token";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast5s = (msg: string, after?: () => void) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => {
      setToastOpen(false);
      after?.();
    }, 5000);
  };

  const openAuth = () => {
    setLoginOpen(true);
    setRegisterOpen(false);
  };

  const onLoginSuccess = (token: string) => {
    localStorage.setItem(SESSION_KEY, token);
    setLoginOpen(false);

    showToast5s("Successfully logged in.", () => {
      setScreen("home");
    });
  };

  const onRegisterSuccess = () => {
    setRegisterOpen(false);

    showToast5s("Successfully registered.", () => {
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

  const onLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setScreen("landing");
    showToast5s("Logged out.");
  };

  return (
    <div className="app-bg">
      {screen === "landing" && <LandingPage onOpenAuth={openAuth} />}
      {screen === "home" && <HomePage onLogout={onLogout} />}

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

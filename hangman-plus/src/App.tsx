import { useState } from "react";

import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";

import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import Toast from "./components/Toast";

type Screen = "landing" | "home" | "game"; 
type GameSettings = {
  category: "ORGANS" | "BONES";
  language: "EN" | "LAT";
  difficulty: "EASY" | "HARD";
  maxWrong: number;
};

const SESSION_KEY = "hangman_session_token";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string, ms = 2500) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), ms);
  };

  const openAuth = () => {
    setLoginOpen(true);
    setRegisterOpen(false);
  };

  const onLoginSuccess = (token: string) => {
    localStorage.setItem(SESSION_KEY, token);
    setLoginOpen(false);
    setScreen("home");
    showToast("Uspješno ste se prijavili ✅");
  };

  const onRegisterSuccess = (token: string) => {
    localStorage.setItem(SESSION_KEY, token);
    setRegisterOpen(false);
    setScreen("home");
    showToast("Uspješno ste se registrovali ✅");
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
    setGameSettings(null);
    setScreen("landing");
    showToast("Odjavljeni ste.");
  };

  const onExitGame = () => {
    setScreen("home");
  };

  return (
    <div className="app-bg">
      {screen === "landing" && <LandingPage onOpenAuth={openAuth} />}

      {screen === "home" && (
        <HomePage
          onLogout={onLogout}
          onPlay={(s: GameSettings) => {
            setGameSettings(s);
            setScreen("game");
          }}
        />
      )}

      {screen === "game" && gameSettings && (
        <GamePage settings={gameSettings} onExit={onExitGame} />
      )}

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

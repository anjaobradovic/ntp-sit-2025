import { useEffect, useState } from "react";
import { safeInvoke } from "./lib/invoke";

import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import AddNewCardPage from "./pages/AddNewCardPage";
import CardRequestsPage from "./pages/CardRequestsPage";

import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import Toast from "./components/Toast";

import type { MeResponse, Role } from "./types/auth";

type Screen = "landing" | "home" | "game" | "add_card" | "card_requests";

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

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const showToast = (msg: string, ms = 2500) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), ms);
  };

  const openAuth = () => {
    setLoginOpen(true);
    setRegisterOpen(false);
  };

  const loadMe = async (token: string) => {
    const me = await safeInvoke<MeResponse>("get_me", { sessionToken: token });
    setRole(me.role);
    setUsername(me.username);
  };

  useEffect(() => {
    const t = localStorage.getItem(SESSION_KEY);
    if (!t) return;

    setSessionToken(t);

    loadMe(t)
      .then(() => setScreen("home"))
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        setSessionToken(null);
        setRole(null);
        setUsername(null);
        setScreen("landing");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLoginSuccess = async (token: string) => {
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    setLoginOpen(false);

    try {
      await loadMe(token);
      setScreen("home");
      showToast("Logged in successfully ✅");
    } catch (e: any) {
      localStorage.removeItem(SESSION_KEY);
      setSessionToken(null);
      setRole(null);
      setUsername(null);
      setScreen("landing");
      showToast(e?.message ?? "Failed to load profile.");
    }
  };

  const onRegisterSuccess = async (token: string) => {
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    setRegisterOpen(false);

    try {
      await loadMe(token);
      setScreen("home");
      showToast("Registered successfully ✅");
    } catch (e: any) {
      localStorage.removeItem(SESSION_KEY);
      setSessionToken(null);
      setRole(null);
      setUsername(null);
      setScreen("landing");
      showToast(e?.message ?? "Failed to load profile.");
    }
  };

  const switchToRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const switchToLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  const onLogout = async () => {
    const token = sessionToken ?? localStorage.getItem(SESSION_KEY);

    if (token) {
      try {
        await safeInvoke<void>("logout", { sessionToken: token });
      } catch {
        // ignore
      }
    }

    localStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
    setRole(null);
    setUsername(null);

    setGameSettings(null);
    setScreen("landing");
    showToast("Logged out.");
  };

  const onExitGame = () => setScreen("home");

  return (
    <div className="app-bg">
      {screen === "landing" && <LandingPage onOpenAuth={openAuth} />}

      {screen === "home" && (
        <HomePage
          role={role ?? undefined}
          onLogout={onLogout}
          onAddNewCard={() => setScreen("add_card")}
          onCardRequests={() => setScreen("card_requests")}
          onUsers={() => console.log("users")}
          onGrowTogether={() => setScreen("add_card")}
          onStats={() => console.log("stats")}
          onPlay={(s: GameSettings) => {
            setGameSettings(s);
            setScreen("game");
          }}
        />
      )}

      {screen === "add_card" && sessionToken && (
        <AddNewCardPage
          sessionToken={sessionToken}
          mode={(role ?? "USER") as "ADMIN" | "USER"}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "card_requests" && sessionToken && (
        <CardRequestsPage sessionToken={sessionToken} onBack={() => setScreen("home")} />
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

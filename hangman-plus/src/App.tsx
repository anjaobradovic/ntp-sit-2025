import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [msg, setMsg] = useState<string>("");

  const callRust = async () => {
    try {
      console.log("Button clicked");
      const response = await invoke<string>("hello_from_rust");
      console.log("Rust response:", response);
      setMsg(response); // <-- ovo prikazuje na ekranu
    } catch (e) {
      console.error("Invoke failed:", e);
      setMsg("Invoke failed: " + String(e));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Hangman+</h1>

      <button onClick={callRust}>Call Rust</button>

      <p style={{ marginTop: 12 }}>
        <strong>Message:</strong> {msg || "(nothing yet)"}
      </p>
    </div>
  );
}

export default App;

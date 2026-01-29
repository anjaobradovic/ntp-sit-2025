import type { InvokeArgs } from "@tauri-apps/api/core";

// u browseru window.__TAURI__ ne postoji
export async function safeInvoke<T>(cmd: string, args?: InvokeArgs): Promise<T> {
  const w = window as any;

  if (!w.__TAURI__) {
    throw new Error("Tauri API is not available in the browser. Open the app in the Tauri window (npm run tauri dev).");
  }

  const mod = await import("@tauri-apps/api/core");
  return mod.invoke<T>(cmd, args);
}

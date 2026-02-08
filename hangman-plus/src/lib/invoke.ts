import { invoke, type InvokeArgs } from "@tauri-apps/api/core";

export async function safeInvoke<T>(cmd: string, args?: InvokeArgs): Promise<T> {
  const w = window as any;

  if (!w.__TAURI_INTERNALS__) {
    throw new Error("This action requires the Hangman+ desktop app (Tauri).");
  }

  return invoke<T>(cmd, args);
}

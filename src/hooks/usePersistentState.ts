"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

interface PersistentStateOptions { debounceMs?: number; }

export function usePersistentState<T>(key: string, initialValue: T, options: PersistentStateOptions = {}): [T, Dispatch<SetStateAction<T>>] {
  const delay = options.debounceMs ?? 250;
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);
  const loadedKey = useRef<string | null>(null);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      setValue(stored ? JSON.parse(stored) as T : initialValueRef.current);
    } catch {
      setValue(initialValueRef.current);
    } finally {
      loadedKey.current = key;
      setReady(true);
    }
  }, [key]);

  useEffect(() => {
    if (!ready || loadedKey.current !== key) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable or full. */ }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay, key, ready, value]);

  return [value, setValue];
}

export function exportLocalStorageBackup(): void {
  const backup = Object.fromEntries(Object.keys(window.localStorage).map((key) => [key, window.localStorage.getItem(key)]));
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `personal-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importLocalStorageBackup(file: File): Promise<void> {
  const backup = JSON.parse(await file.text()) as Record<string, string | null>;
  Object.entries(backup).forEach(([key, value]) => { if (typeof value === "string") window.localStorage.setItem(key, value); });
}
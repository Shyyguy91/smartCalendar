"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const hydratedKey = useRef<string | null>(null);
  const previousKey = useRef(key);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        // Browser-only restoration keeps server-rendered markup deterministic.
        /* eslint-disable react-hooks/set-state-in-effect */
        setValue(JSON.parse(stored) as T);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
      hydratedKey.current = key;
    } catch {
      // Keep the typed default when storage is unavailable or malformed.
    }
  }, [key]);

  useEffect(() => {
    if (previousKey.current !== key) {
      previousKey.current = key;
      return;
    }
    if (hydratedKey.current !== key) {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  }, [key, value]);

  return [value, setValue];
}
// i18nb.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Language = "en" | "cy";

const cache = new Map<string, string>();
const pendingKeys = new Set<string>();

let notifyTranslated: (() => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function translateBatch(keys: string[]) {
  if (keys.length === 0) return;
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: keys }),
    });
    if (res.ok) {
      const data = await res.json();
      data.translations?.forEach((translated: string, index: number) => {
        cache.set(keys[index], translated);
      });
      notifyTranslated?.();
    }
  } catch (error) {
    console.error("Translation error:", error);
  }
}

function scheduleTranslate() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const batch = Array.from(pendingKeys);
    pendingKeys.clear();
    translateBatch(batch);
  }, 50);
}

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  version: number;
};

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  version: 0,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    notifyTranslated = () => setVersion(v => v + 1);
    return () => {
      notifyTranslated = null;
    };
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("site-language");
    const initial = saved === "cy" || saved === "en" ? saved : "en";
    setLanguageState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("site-language", next);
    document.documentElement.lang = next;
    setVersion(v => v + 1); // forces immediate re-check of every t() call
  };

  const value = useMemo(
    () => ({ language, setLanguage, version }),
    [language, version]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function t(key: string): string {
  const context = useContext(I18nContext);

  if (context.language === "en") return key;

  if (!cache.has(key) && !pendingKeys.has(key)) {
    pendingKeys.add(key);
    scheduleTranslate();
  }

  return cache.get(key) ?? key;
}

export function useLanguage() {
  return useContext(I18nContext);
}

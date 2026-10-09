"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "cy";

const welshCache: Record<string, string> = {};
const inFlight = new Set<string>();

async function translateText(text: string) {
  if (!text || inFlight.has(text)) return;

  inFlight.add(text);

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts: [text],
      }),
    });

    if (!res.ok) return;

    const data = await res.json();
    const translated = data.translations?.[0];

    if (translated) {
      welshCache[text] = translated;
    }
  } catch {
    // fallback to English
  } finally {
    inFlight.delete(text);
  }
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => undefined,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

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
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function t(key: string) {
  if (typeof window === "undefined") return key;

  const lang =
    window.localStorage.getItem("site-language") === "cy" ? "cy" : "en";

  if (lang === "en") return key;

  if (welshCache[key]) return welshCache[key];

  // Trigger async translation if not cached yet
  void translateText(key);

  return key;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

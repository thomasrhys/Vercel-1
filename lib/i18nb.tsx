"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode, } from "react";

export type Language = "en" | "cy";

const cache = new Map<string, string>();

async function fetchTranslation(text: string): Promise<string> {
  if (!text || cache.has(text)) return cache.get(text) || text;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: [text] }),
    });

    if (!res.ok) return text;

    const data = await res.json();
    const translated = data?.translations?.[0] ?? text;

    cache.set(text, translated);
    return translated;
  } catch {
    return text;
  }
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
    const saved = window.localStorage.getItem("site-language");
    const initial = saved === "cy" || saved === "en" ? saved : "en";
    setLanguageState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLanguage = async (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("site-language", next);
    document.documentElement.lang = next;

    if (next === "cy") {
      // Start loading translations and re-render as they arrive
      const allTexts = Array.from(cache.keys());
      for (const text of allTexts) {
        await fetchTranslation(text);
        setVersion((v) => v + 1); // Force re-render
      }
    }
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
  // Access context to force re-render when language changes
  useContext(I18nContext);

  if (typeof window === "undefined") return key;

  const lang =
    window.localStorage.getItem("site-language") === "cy" ? "cy" : "en";

  if (lang === "en") return key;

  if (cache.has(key)) return cache.get(key)!;

  // Trigger fetch in background
  void fetchTranslation(key);

  return key; // Return English while fetching
}

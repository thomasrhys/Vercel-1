"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "cy";

const welshCache: Record<string, string> = {};
let loadingPromise: Promise<void> | null = null;

async function loadWelshTranslations() {
  if (Object.keys(welshCache).length > 0) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      // Collect all strings from the app and send to Techiaith
      // For now, we load on-demand as strings are used
    } catch {
      // fallback to English
    }
  })();

  return loadingPromise;
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

    if (initial === "cy") {
      void loadWelshTranslations();
    }
  }, []);

  const setLanguage = async (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("site-language", next);
    document.documentElement.lang = next;

    if (next === "cy") {
      await loadWelshTranslations();
    }
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function t(key: string) {
  const lang =
    typeof window !== "undefined"
      ? (window.localStorage.getItem("site-language") || "en")
      : "en";

  if (lang === "en") return key;
  return welshCache[key] ?? key;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

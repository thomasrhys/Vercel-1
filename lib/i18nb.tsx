"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Language = "en" | "cy";

const cache = new Map<string, string>();
const allStringsUsed = new Set<string>();

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

    if (next === "cy" && allStringsUsed.size > 0) {
      try {
        const textsToTranslate = Array.from(allStringsUsed).filter(t => !cache.has(t));
        
        if (textsToTranslate.length > 0) {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: textsToTranslate }),
          });

          if (res.ok) {
            const data = await res.json();
            data.translations?.forEach((translated: string, index: number) => {
              cache.set(textsToTranslate[index], translated);
            });
          }
        }

        setVersion(v => v + 1);
      } catch (error) {
        console.error("Translation error:", error);
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
  const context = useContext(I18nContext);
  allStringsUsed.add(key);

  if (context.language === "en") return key;

  return cache.get(key) ?? key;
}

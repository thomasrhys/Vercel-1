"use client";

import { useLanguage, t } from "@/lib/i18n";
import { useLanguage as useLanguageB } from "@/lib/i18nb"; // adjust path if different

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { setLanguage: setLanguageB } = useLanguageB();

  const handleChange = (next: "en" | "cy") => {
    setLanguage(next);
    setLanguageB(next);
  };

  return (
    <label className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-muted-foreground">
      <span aria-hidden="true">🌐</span>
      <span className="hidden sm:inline">{t("Language")}</span>
      <select
        value={language}
        onChange={(event) => handleChange(event.target.value as "en" | "cy")}
        className="rounded border border-border bg-background px-1.5 py-1 text-foreground outline-none"
        aria-label="Language"
      >
        <option value="en">{t("English")}</option>
        <option value="cy">{t("Welsh")}</option>
      </select>
    </label>
  );
}

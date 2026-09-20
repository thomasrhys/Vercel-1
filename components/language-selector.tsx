"use client";

import { useLanguage, t } from "@/lib/i18n";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <label className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-muted-foreground">
      <span aria-hidden="true">🌐</span>
      <span className="hidden sm:inline">Language</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as "en" | "cy")}
        className="rounded border border-border bg-background px-1.5 py-1 text-foreground outline-none"
        aria-label="Language"
      >
        <option value="en">English</option>
        <option value="cy">Cymraeg</option>
      </select>
    </label>
  );
}

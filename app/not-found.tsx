// app/not-found.tsx
"use client"

import Link from "next/link";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="text-8xl font-bold text-muted-foreground/20 select-none text-[#232323]">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {t("Page Not Found")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("This page doesn't exist or may have been moved. Let's get you back to the games.")}
          </p>
        </div>
        <Link
          href="/"
          className="inline-block rounded-md border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {t("Back to Games")}
        </Link>
      </div>
    </main>
  );
}

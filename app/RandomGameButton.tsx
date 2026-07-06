"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type Game } from "@/lib/games";

type PortalGame = Game & {
  hidden?: boolean;
};

export default function RandomGameButton() {
  const [games, setGames] = useState<PortalGame[]>([]);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const isHomePage = typeof window !== "undefined" && window.location.pathname === "/";

  useEffect(() => {
    if (!isHomePage) return;

    fetch("/api/games")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setGames(data.filter((game) => !game.hidden));
      })
      .catch(() => setGames([]));
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage) return;

    const findTarget = () => {
      const headerActions = document.querySelector("header .sm\\:ml-auto") as HTMLElement | null;
      if (headerActions) setTarget(headerActions);
    };

    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isHomePage]);

  if (!isHomePage || !target || games.length === 0) return null;

  return createPortal(
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={() => {
        const game = games[Math.floor(Math.random() * games.length)];
        window.location.href = `/game/${game.id}`;
      }}
    >
      🎲 Random
    </button>,
    target
  );
}

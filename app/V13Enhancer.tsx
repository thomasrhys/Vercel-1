"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { getGameImage, type Game } from "@/lib/games";

type PortalGame = Game & {
  image?: string | null;
  category?: string | null;
  hidden?: boolean;
};

type RecentItem = {
  game_id: string;
  play_count: number;
  last_played: string;
};

export default function V13Enhancer() {
  const { isSignedIn } = useUser();
  const [games, setGames] = useState<PortalGame[]>([]);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [recentSlot, setRecentSlot] = useState<HTMLElement | null>(null);

  const isHomePage = typeof window !== "undefined" && window.location.pathname === "/";

  useEffect(() => {
    if (!isHomePage) return;

    fetch("/api/games")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setGames(data);
      })
      .catch(() => undefined);
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage || !isSignedIn) {
      setFavouriteIds([]);
      setRecentItems([]);
      return;
    }

    fetch("/api/favourites")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.favourites)) setFavouriteIds(data.favourites);
      })
      .catch(() => setFavouriteIds([]));

    fetch("/api/recently-played")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.recent)) setRecentItems(data.recent);
      })
      .catch(() => setRecentItems([]));
  }, [isHomePage, isSignedIn]);

  useEffect(() => {
    if (!isHomePage) return;

    const ensureSlot = () => {
      const main = document.querySelector("main");
      if (!main) return;

      let slot = document.getElementById("v13-recently-played-slot");
      if (!slot) {
        slot = document.createElement("section");
        slot.id = "v13-recently-played-slot";
        slot.className = "mb-6";
        main.insertBefore(slot, main.firstChild?.nextSibling || main.firstChild);
      }

      setRecentSlot(slot);
    };

    const timeout = window.setTimeout(ensureSlot, 0);
    return () => window.clearTimeout(timeout);
  }, [isHomePage]);

  const visibleGamesByTitle = useMemo(() => {
    const map = new Map<string, PortalGame>();
    games.filter((game) => !game.hidden).forEach((game) => map.set(game.title.trim().toLowerCase(), game));
    return map;
  }, [games]);

  const recentGames = useMemo(() => {
    return recentItems
      .map((item) => {
        const game = games.find((entry) => entry.id === item.game_id && !entry.hidden);
        return game ? { ...item, game } : null;
      })
      .filter((item): item is RecentItem & { game: PortalGame } => Boolean(item))
      .slice(0, 4);
  }, [recentItems, games]);

  useEffect(() => {
    if (!isHomePage || games.length === 0) return;

    const applyCardButtons = () => {
      const cardTitles = Array.from(document.querySelectorAll(".text-base, .sm\\:text-lg"));

      cardTitles.forEach((titleElement) => {
        const title = titleElement.textContent?.trim().toLowerCase();
        if (!title) return;

        const game = visibleGamesByTitle.get(title);
        if (!game) return;

        const card = titleElement.closest(".group") as HTMLElement | null;
        const imageWrap = card?.querySelector(".aspect-video.relative") as HTMLElement | null;
        if (!card || !imageWrap || imageWrap.querySelector(`[data-favourite-game-id=\"${game.id}\"]`)) return;

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.favouriteGameId = game.id;
        button.setAttribute("aria-label", `Favourite ${game.title}`);
        button.className = "absolute top-2 right-2 z-20 rounded-full bg-background/90 p-2 shadow hover:bg-background transition";

        const updateButton = () => {
          const selected = favouriteIds.includes(game.id);
          button.innerHTML = selected
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>';
        };

        updateButton();

        button.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();

          if (!isSignedIn) {
            window.location.href = `/login?redirect_url=${encodeURIComponent(window.location.pathname)}`;
            return;
          }

          const isFavourite = favouriteIds.includes(game.id);
          const response = await fetch("/api/favourites", {
            method: isFavourite ? "DELETE" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId: game.id }),
          });

          if (response.ok) {
            setFavouriteIds((currentIds) =>
              isFavourite
                ? currentIds.filter((id) => id !== game.id)
                : Array.from(new Set([...currentIds, game.id]))
            );
          }
        });

        imageWrap.appendChild(button);
      });
    };

    applyCardButtons();
    const observer = new MutationObserver(applyCardButtons);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isHomePage, games, visibleGamesByTitle, favouriteIds, isSignedIn]);

  useEffect(() => {
    if (!isHomePage || !isSignedIn || games.length === 0) return;

    const recorded = new Set<string>();

    const recordPlayingIframe = () => {
      const iframe = document.querySelector("iframe[title]") as HTMLIFrameElement | null;
      const title = iframe?.getAttribute("title")?.trim().toLowerCase();
      if (!title) return;

      const game = visibleGamesByTitle.get(title);
      if (!game || recorded.has(game.id)) return;

      recorded.add(game.id);
      fetch("/api/recently-played", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      }).catch(() => undefined);
    };

    recordPlayingIframe();
    const observer = new MutationObserver(recordPlayingIframe);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isHomePage, isSignedIn, games, visibleGamesByTitle]);

  if (!isHomePage || !isSignedIn || !recentSlot || recentGames.length === 0) return null;

  return createPortal(
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Gamepad2Icon />
        <h2 className="text-xl font-bold text-foreground">Continue Playing</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {recentGames.map(({ game, play_count }) => {
          const coverImage = game.image || getGameImage(game.id);
          return (
            <a key={game.id} href={`/game/${game.id}`} className="rounded-lg border border-border bg-card overflow-hidden hover:bg-muted/50 transition">
              <div className="aspect-video bg-muted">
                {coverImage ? (
                  <img src={coverImage} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-foreground truncate">{game.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Played {play_count} {play_count === 1 ? "time" : "times"}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>,
    recentSlot
  );
}

function Gamepad2Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <line x1="6" x2="10" y1="11" y2="11" />
      <line x1="8" x2="8" y1="9" y2="13" />
      <line x1="15" x2="15.01" y1="12" y2="12" />
      <line x1="18" x2="18.01" y1="10" y2="10" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.97 3.59c-.32 3.01-.08 5.88.73 8.5A3 3 0 0 0 6.35 19h.01a3 3 0 0 0 2.12-.88L10.6 16h2.8l2.12 2.12a3 3 0 0 0 2.12.88h.01a3 3 0 0 0 2.91-1.91c.81-2.62 1.05-5.49.73-8.5A4 4 0 0 0 17.32 5Z" />
    </svg>
  );
}

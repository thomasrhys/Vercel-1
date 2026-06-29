"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGameImage, type Game } from "@/lib/games";
import { ArrowLeft, Gamepad2, Maximize2, Minimize2, Monitor, Play, Smartphone, X } from "lucide-react";

type PortalGame = Game & {
  image?: string | null;
  category?: string | null;
  description?: string | null;
  featured?: boolean;
  hidden?: boolean;
  desktop_only?: boolean;
};

export default function GamePageClient({ id }: { id: string }) {
  const [games, setGames] = useState<PortalGame[]>([]);
  const [blobImages, setBlobImages] = useState<Record<string, string>>({});
  const [activeGame, setActiveGame] = useState<PortalGame | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGameData = async () => {
      setIsLoading(true);
      try {
        const [gamesResponse, imagesResponse] = await Promise.all([
          fetch("/api/games"),
          fetch("/api/game-images"),
        ]);

        const gamesData = await gamesResponse.json();
        const imagesData = await imagesResponse.json();

        if (gamesResponse.ok && Array.isArray(gamesData)) {
          setGames(gamesData);
        }

        if (imagesResponse.ok && imagesData && typeof imagesData === "object") {
          setBlobImages(imagesData);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadGameData();
  }, []);

  useEffect(() => {
    const updateMobileState = () => {
      const smallScreen = window.matchMedia("(max-width: 900px)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const mobileUserAgent = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileDevice((smallScreen && coarsePointer) || mobileUserAgent);
    };

    updateMobileState();
    window.addEventListener("resize", updateMobileState);
    window.addEventListener("orientationchange", updateMobileState);

    return () => {
      window.removeEventListener("resize", updateMobileState);
      window.removeEventListener("orientationchange", updateMobileState);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await gameContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error("Fullscreen error:", error);
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const closePlayer = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }

    setActiveGame(null);
    setIsFullscreen(false);
  };

  const game = useMemo(() => games.find((item) => item.id === id) || null, [games, id]);
  const relatedGames = useMemo(() => {
    if (!game?.category) return [];
    return games
      .filter((item) => item.id !== game.id && item.category === game.category)
      .slice(0, 4);
  }, [games, game]);

  const coverImage = game ? blobImages[game.id] || game.image || getGameImage(game.id) : "";
  const isDesktopOnlyOnMobile = !!game?.desktop_only && isMobileDevice;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Gamepad2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Loading game...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Game not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">This game may have been removed or hidden.</p>
            <Button onClick={() => (window.location.href = "/")}>Back to All Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-5xl">
        <Button variant="outline" size="sm" onClick={() => (window.location.href = "/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Games
        </Button>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mt-6">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted">
              {coverImage ? (
                <img src={coverImage} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gamepad2 className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl leading-tight">{game.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {game.category && (
                  <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {game.category}
                  </span>
                )}
                {game.desktop_only ? (
                  <span className="rounded-md bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-700 flex items-center gap-1">
                    <Monitor className="h-4 w-4" /> Desktop Only
                  </span>
                ) : (
                  <span className="rounded-md bg-green-500/20 px-3 py-1 text-sm font-medium text-green-700 flex items-center gap-1">
                    <Smartphone className="h-4 w-4" /> Mobile Friendly
                  </span>
                )}
              </div>

              {game.description ? (
                <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{game.description}</p>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Play {game.title} online for free.
                </p>
              )}

              {isDesktopOnlyOnMobile ? (
                <div className="rounded-md border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                  This game is marked desktop-only and may not work properly on phones or tablets.
                </div>
              ) : (
                <Button size="lg" className="w-full" onClick={() => setActiveGame(game)}>
                  <Play className="h-5 w-5 mr-2" />
                  Play Game
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        {relatedGames.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-foreground mb-3">Related Games</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {relatedGames.map((relatedGame) => {
                const relatedCover = blobImages[relatedGame.id] || relatedGame.image || getGameImage(relatedGame.id);
                return (
                  <a key={relatedGame.id} href={`/game/${relatedGame.id}`} className="rounded-lg border border-border bg-card overflow-hidden hover:bg-muted/50 transition">
                    <div className="aspect-video bg-muted">
                      {relatedCover ? (
                        <img src={relatedCover} alt={relatedGame.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-foreground truncate">{relatedGame.title}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {activeGame && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 ${isFullscreen ? "p-0" : ""}`}>
          <div
            ref={gameContainerRef}
            className={`bg-card rounded-lg overflow-hidden flex flex-col ${
              isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[85vh] sm:h-[80vh]"
            }`}
          >
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-muted">
              <h2 className="font-semibold text-sm sm:text-base text-foreground truncate mr-2">{activeGame.title}</h2>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={closePlayer}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-black">
              <iframe
                src={activeGame.url}
                className="w-full h-full border-0"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-pointer-lock allow-popups"
                title={activeGame.title}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

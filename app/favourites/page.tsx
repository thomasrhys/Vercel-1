"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGameImage, type Game } from "@/lib/games";
import { ArrowLeft, Gamepad2, Heart } from "lucide-react";

type PortalGame = Game & {
  image?: string | null;
  category?: string | null;
  featured?: boolean;
  hidden?: boolean;
  desktop_only?: boolean;
};

export default function FavouritesPage() {
  const { isSignedIn } = useUser();
  const [games, setGames] = useState<PortalGame[]>([]);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [blobImages, setBlobImages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const loadFavourites = async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [gamesResponse, favouritesResponse, imagesResponse] = await Promise.all([
          fetch("/api/games"),
          fetch("/api/favourites"),
          fetch("/api/game-images"),
        ]);

        const gamesData = await gamesResponse.json();
        const favouritesData = await favouritesResponse.json();
        const imagesData = await imagesResponse.json();

        if (gamesResponse.ok && Array.isArray(gamesData)) {
          setGames(gamesData);
        }

        if (favouritesResponse.ok && Array.isArray(favouritesData.favourites)) {
          setFavouriteIds(favouritesData.favourites);
        } else if (!favouritesResponse.ok) {
          setMessage(favouritesData.error || "Could not load favourites.");
        }

        if (imagesResponse.ok && imagesData && typeof imagesData === "object") {
          setBlobImages(imagesData);
        }
      } catch (error) {
        console.error("[favourites] Load error:", error);
        setMessage("Could not load favourites.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFavourites();
  }, [isSignedIn]);

  const favouriteGames = useMemo(() => {
    return favouriteIds
      .map((id) => games.find((game) => game.id === id && !game.hidden))
      .filter((game): game is PortalGame => Boolean(game));
  }, [favouriteIds, games]);

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Heart className="h-5 w-5" />
              Sign in to view favourites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SignInButton mode="modal">
              <Button className="w-full">Login</Button>
            </SignInButton>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Games
          </Button>
          <UserButton />
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Heart className="h-7 w-7" />
            My Favourites
          </h1>
          <p className="text-muted-foreground mt-2">Games saved to your account.</p>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading favourites...
            </CardContent>
          </Card>
        )}

        {!isLoading && message && (
          <div className="rounded-md bg-red-500/20 text-red-700 p-3 text-sm mb-4">✗ {message}</div>
        )}

        {!isLoading && !message && favouriteGames.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">No favourites yet</h2>
                <p className="text-sm text-muted-foreground mt-1">Open a game page and click Add to Favourites.</p>
              </div>
              <Button onClick={() => (window.location.href = "/")}>Browse Games</Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && favouriteGames.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {favouriteGames.map((game) => {
              const coverImage = blobImages[game.id] || game.image || getGameImage(game.id);

              return (
                <a key={game.id} href={`/game/${game.id}`} className="rounded-lg border border-border bg-card overflow-hidden hover:bg-muted/50 transition">
                  <div className="aspect-video bg-muted">
                    {coverImage ? (
                      <img src={coverImage} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-foreground truncate">{game.title}</p>
                    {game.category && <p className="text-xs text-muted-foreground mt-1 truncate">{game.category}</p>}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Maximize2, Minimize2, X, Gamepad2, Search } from "lucide-react"
import { games as fallbackGames, type Game, getGameImage } from "@/lib/games"

export default function GamePortal() {
  const [games, setGames] = useState<Game[]>(fallbackGames)
  const [activeGame, setActiveGame] = useState<Game | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [query, setQuery] = useState("")
  const [blobImages, setBlobImages] = useState<Record<string, string>>({})

  const gameContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setGames(data)
        }
      })
      .catch(() => {
        setGames(fallbackGames)
      })
  }, [])

  useEffect(() => {
    fetch("/api/game-images")
      .then((res) => res.json())
      .then((data) => setBlobImages(data))
      .catch(() => setBlobImages({}))
  }, [])

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return games

    return games.filter((game) =>
      game.title.toLowerCase().includes(q)
    )
  }, [games, query])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await gameContainerRef.current?.requestFullscreen()
        setIsFullscreen(true)
      } catch (err) {
        console.error("Fullscreen error:", err)
      }
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    )

    return () =>
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      )
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Game Portal
            </h1>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games..."
              className="pl-9"
            />
          </div>

          <div className="sm:ml-auto flex gap-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/admin")}
            >
              Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <p className="text-sm text-muted-foreground mb-4">
          {filteredGames.length}{" "}
          {filteredGames.length === 1 ? "game" : "games"}
          {query ? " found" : " available"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredGames.map((game) => {
            const coverImage =
              blobImages[game.id] || game.image || getGameImage(game.id)

            return (
              <Card
                key={game.id}
                className="group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveGame(game)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg truncate">
                    {game.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative group">
                    {coverImage ? (
                      <>
                        <img
                          src={coverImage}
                          alt={game.title}
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center" />

                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Play
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted-foreground/20">
                        <div className="text-center p-3 sm:p-4">
                          <Gamepad2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Tap to play
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-8 sm:py-16">
            <Gamepad2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              No games found
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground">
              Try a different search term.
            </p>
          </div>
        )}
      </main>

      {activeGame && (
        <div
          className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 ${
            isFullscreen ? "p-0" : ""
          }`}
        >
          <div
            ref={gameContainerRef}
            className={`bg-card rounded-lg overflow-hidden flex flex-col ${
              isFullscreen
                ? "w-full h-full rounded-none"
                : "w-full max-w-5xl h-[85vh] sm:h-[80vh]"
            }`}
          >
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-muted">
              <h2 className="font-semibold text-sm sm:text-base text-foreground truncate mr-2">
                {activeGame.title}
              </h2>

              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  onClick={() => {
                    setActiveGame(null)
                    setIsFullscreen(false)
                  }}
                >
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
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Maximize2, Minimize2, X, Gamepad2 } from "lucide-react"

// =====================================================
// CONFIGURE YOUR GAMES HERE
// Add your game iframe URLs below. Each game needs:
// - id: unique identifier
// - title: display name
// - url: the iframe src URL
// =====================================================
const GAMES = [
  {
    id: "geometry-dash",
    title: "Geometry Dash",
    url: "https://yoplay.io/geometry-dash.embed",
  },
  {
    id: "monkey-mart",
    title: "Monkey Mart",
    url: "https://yoplay.io/monkey-mart.embed",
  },
  {
    id: "slope",
    title: "Slope",
    url: "https://azgames.io/slope.embed",
  },
  {
    id: "escape-road-city-2",
    title: "Escape Road City 2",
    url: "https://yoplay.io/escape-road-city-2.embed",
  },
  {
    id: "slope-2",
    title: "Slope 2",
    url: "https://game.azgame.io/slope-2/",
  },
  {
    id: "drift-boss",
    title: "Drift Boss",
    url: "https://azgames.io/drift-boss.embed",
  },
  {
    id: "tap-road",
    title: "Tap Road",
    url: "https://azgames.io/tap-road.embed",
  },
  {
    id: "basket-random",
    title: "Basket Random",
    url: "https://www.twoplayergames.org/embed/basket-random",
  },
  {
    id: "soccer-random",
    title: "Soccer Random",
    url: "https://www.twoplayergames.org/embed/soccer-random",
  },
  {
    id: "slope-3",
    title: "Slope 3",
    url: "https://game.azgame.io/slope-3/",
  },
  // Add more games here:
  // {
  //   id: "my-game",
  //   title: "My Game",
  //   url: "https://example.com/game",
  // },
]
// =====================================================

interface Game {
  id: string
  title: string
  url: string
}

export default function GamePortal() {
  const [activeGame, setActiveGame] = useState<Game | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const gameContainerRef = useRef<HTMLDivElement>(null)

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
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Game Portal</h1>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {GAMES.map((game) => (
            <Card
              key={game.id}
              className="group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveGame(game)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{game.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="text-center p-3 sm:p-4">
                    <Gamepad2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs sm:text-sm text-muted-foreground">Tap to play</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {GAMES.length === 0 && (
          <div className="text-center py-8 sm:py-16">
            <Gamepad2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No games configured</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Add games to the GAMES array in page.tsx
            </p>
          </div>
        )}
      </main>

      {/* Game Modal */}
      {activeGame && (
        <div
          className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 ${
            isFullscreen ? "p-0" : ""
          }`}
        >
          <div
            ref={gameContainerRef}
            className={`bg-card rounded-lg overflow-hidden flex flex-col ${
              isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[85vh] sm:h-[80vh]"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-muted">
              <h2 className="font-semibold text-sm sm:text-base text-foreground truncate mr-2">{activeGame.title}</h2>
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

            {/* Game Content */}
            <div className="flex-1 bg-black">
              <iframe
                src={activeGame.url}
                className="w-full h-full border-0"
                allowFullScreen
                title={activeGame.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

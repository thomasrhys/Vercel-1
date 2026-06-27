"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Maximize2,
  Minimize2,
  X,
  Gamepad2,
  Search,
  Star,
  Monitor,
  Smartphone,
} from "lucide-react"
import { games as fallbackGames, type Game, getGameImage } from "@/lib/games"

type PortalGame = Game & {
  image?: string | null
  category?: string | null
  featured?: boolean
  hidden?: boolean
  desktop_only?: boolean
}

export default function GamePortal() {
  const [games, setGames] = useState<PortalGame[]>(fallbackGames)
  const [activeGame, setActiveGame] = useState<PortalGame | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [blobImages, setBlobImages] = useState<Record<string, string>>({})
  const [isMobileDevice, setIsMobileDevice] = useState(false)

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

  useEffect(() => {
    const updateMobileState = () => {
      const smallScreen = window.matchMedia("(max-width: 900px)").matches
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches
      const mobileUserAgent = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )

      setIsMobileDevice((smallScreen && coarsePointer) || mobileUserAgent)
    }

    updateMobileState()
    window.addEventListener("resize", updateMobileState)
    window.addEventListener("orientationchange", updateMobileState)

    return () => {
      window.removeEventListener("resize", updateMobileState)
      window.removeEventListener("orientationchange", updateMobileState)
    }
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        games
          .map((game) => game.category?.trim())
          .filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b))

    return ["All", ...uniqueCategories]
  }, [games])

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("All")
    }
  }, [categories, selectedCategory])

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase()

    return games.filter((game) => {
      const matchesCategory =
        selectedCategory === "All" || game.category === selectedCategory

      if (!matchesCategory) return false
      if (!q) return true

      return `${game.title} ${game.category || ""}`.toLowerCase().includes(q)
    })
  }, [games, query, selectedCategory])

  const featuredGames = useMemo(() => {
    if (query.trim() || selectedCategory !== "All") return []
    return filteredGames.filter((game) => game.featured)
  }, [filteredGames, query, selectedCategory])

  const regularGames = useMemo(() => {
    if (query.trim() || selectedCategory !== "All") return filteredGames
    return filteredGames.filter((game) => !game.featured)
  }, [filteredGames, query, selectedCategory])

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
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const renderGameCard = (game: PortalGame) => {
    const coverImage = blobImages[game.id] || game.image || getGameImage(game.id)
    const isDesktopOnlyOnMobile = isMobileDevice && game.desktop_only

    return (
      <Card
        key={game.id}
        className={`group hover:shadow-lg transition-shadow ${
          isDesktopOnlyOnMobile ? "cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={(event) => {
          if (isDesktopOnlyOnMobile) {
            event.preventDefault()
            event.stopPropagation()
            return
          }

          setActiveGame(game)
        }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg truncate flex items-center gap-2">
            {game.featured && <Star className="h-4 w-4 shrink-0" />}
            <span className="truncate">{game.title}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative group">
            {coverImage ? (
              <img
                src={coverImage}
                alt={game.title}
                className={`w-full h-full object-cover ${
                  isDesktopOnlyOnMobile ? "opacity-45" : ""
                }`}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted-foreground/20">
                <Gamepad2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground" />
              </div>
            )}

            {isDesktopOnlyOnMobile && (
              <div className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                Desktop Only
              </div>
            )}

            {isDesktopOnlyOnMobile ? (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/55 text-white"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
              >
                <Smartphone className="h-8 w-8 mb-2" />
                <p className="font-semibold">Desktop Only</p>
                <p className="text-xs mt-1 max-w-[220px]">
                  This game is not supported on mobile devices. Please use a desktop or laptop.
                </p>
              </div>
            ) : (
              <>
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
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

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
        {categories.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          {filteredGames.length} {filteredGames.length === 1 ? "game" : "games"}
          {query || selectedCategory !== "All" ? " found" : " available"}
          {selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
        </p>

        {featuredGames.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Featured Games
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {featuredGames.map(renderGameCard)}
            </div>
          </section>
        )}

        <section>
          {!query && selectedCategory === "All" && featuredGames.length > 0 && regularGames.length > 0 && (
            <h2 className="text-xl font-bold text-foreground mb-3">
              All Games
            </h2>
          )}

          {selectedCategory !== "All" && filteredGames.length > 0 && (
            <h2 className="text-xl font-bold text-foreground mb-3">
              {selectedCategory}
            </h2>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {regularGames.map(renderGameCard)}
          </div>
        </section>

        {filteredGames.length === 0 && (
          <div className="text-center py-8 sm:py-16">
            <Gamepad2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              No games found
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Try a different search term or category.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-6 text-center text-sm text-muted-foreground space-y-3">
          <p>© 2026 Game Portal</p>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <a className="hover:text-foreground underline underline-offset-4" href="/requests">
              Request a Game
            </a>
            <a className="hover:text-foreground underline underline-offset-4" href="/contact">
              Contact
            </a>
            <a className="hover:text-foreground underline underline-offset-4" href="/privacy">
              Privacy Policy
            </a>
            <a className="hover:text-foreground underline underline-offset-4" href="/terms">
              Terms of Use
            </a>
          </nav>
        </div>
      </footer>

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

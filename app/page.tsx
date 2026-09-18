"use client"

import { useState, useRef, useEffect, useMemo, Suspense } from "react" // Added Suspense import
import { useSearchParams } from "next/navigation"
import { UserButton, useSupabaseAuth } from "@/lib/supabase-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Maximize2, Minimize2, X, Gamepad2, Search, Star, Monitor, Smartphone, ArrowUp, Heart, Sparkles } from "lucide-react"
import { games as fallbackGames, type Game, getGameImage } from "@/lib/games"
import { t } from "@/lib/i18n"

type PortalGame = Game & {
  image?: string | null
  category?: string | null
  featured?: boolean
  hidden?: boolean
  desktop_only?: boolean
  is_new?: boolean
}

type PublicSettings = {
  site_name: string
  footer_text: string
  maintenance_mode: boolean
}

type Category = {
  id: string
  name: string
  emoji: string
}

export default function GamePortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Gamepad2 className="h-12 w-12 animate-pulse text-muted-foreground" /></div>}>
      <GamePortal />
    </Suspense>
  )
}

function GamePortal() {
  const { isSignedIn, isAdmin } = useSupabaseAuth()
  const [games, setGames] = useState<PortalGame[]>(fallbackGames)
  const [activeGame, setActiveGame] = useState<PortalGame | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [blobImages, setBlobImages] = useState<Record<string, string>>({})
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [categoriesFromApi, setCategoriesFromApi] = useState<Category[]>([])
  const [settings, setSettings] = useState<PublicSettings>({
    site_name: t("Game Portal"),
    footer_text: t("© 2026 Game Portal"),
    maintenance_mode: false,
  })

  const gameContainerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const playGameId = searchParams.get("play")

  useEffect(() => {
    if (playGameId && games.length > 0) {
      const targetGame = games.find((g) => g.id.toLowerCase() === playGameId.toLowerCase().trim())
      if (targetGame && (!activeGame || activeGame.id !== targetGame.id)) {
        openGame(targetGame)
      }
    }
  }, [playGameId, games, activeGame])

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          site_name: data.site_name || t("Game Portal"),
          footer_text: data.footer_text || t("© 2026 Game Portal"),
          maintenance_mode: data.maintenance_mode === true,
        })
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setGames(data)
      })
      .catch(() => setGames(fallbackGames))
  }, [])

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategoriesFromApi(data)
      })
      .catch(() => setCategoriesFromApi([]))
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
      const mobileUserAgent = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
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

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const gameCategoryNames = useMemo(
    () =>
      Array.from(
        new Set(
          games
            .map((game) => game.category?.trim())
            .filter((category): category is string => Boolean(category)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [games],
  )

  const categoryCards = useMemo(() => {
    const apiByName = new Map(categoriesFromApi.map((category) => [category.name, category]))
    return gameCategoryNames.map((name) => {
      const configuredCategory = apiByName.get(name)
      const gameCount = games.filter((game) => game.category === name).length
      return { name, emoji: configuredCategory?.emoji || "🎮", gameCount }
    })
  }, [categoriesFromApi, gameCategoryNames, games])

  const categories = useMemo(() => [t("All"), ...gameCategoryNames], [gameCategoryNames])

  useEffect(() => {
    if (!categories.includes(selectedCategory)) setSelectedCategory(t("All"))
  }, [categories, selectedCategory])

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase()
    return games.filter((game) => {
      const matchesCategory = selectedCategory === t("All") || game.category === selectedCategory
      if (!matchesCategory) return false
      if (!q) return true
      return `${game.title} ${game.category || ""}`.toLowerCase().includes(q)
    })
  }, [games, query, selectedCategory])

  const featuredGames = useMemo(
    () => (query.trim() || selectedCategory !== t("All") ? [] : filteredGames.filter((game) => game.featured === true)),
    [filteredGames, query, selectedCategory],
  )
  const newGames = useMemo(
    () => (query.trim() || selectedCategory !== t("All") ? [] : filteredGames.filter((game) => game.is_new === true).slice(0, 12)),
    [filteredGames, query, selectedCategory],
  )
  const regularGames = useMemo(
    () => (query.trim() || selectedCategory !== t("All") ? filteredGames : filteredGames.filter((game) => !game.featured && !game.is_new)),
    [filteredGames, query, selectedCategory],
  )

  const openGame = (game: PortalGame) => setActiveGame(game)

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
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const renderGameCard = (game: PortalGame) => {
    const coverImage = blobImages[game.id] || game.image || getGameImage(game.id)
    const isDesktopOnlyOnMobile = isMobileDevice && game.desktop_only

    return (
      <Card
        key={game.id}
        className={`group hover:shadow-lg transition-shadow ${isDesktopOnlyOnMobile ? "cursor-not-allowed" : "cursor-pointer"}`}
        onClick={(event) => {
          if (isDesktopOnlyOnMobile) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          openGame(game)
        }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg truncate flex items-center gap-2">
            {game.featured && <Star className="h-4 w-4 shrink-0" />}
            {game.is_new && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{t("New")}</span>}
            {game.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative group">
            {coverImage ? (
              <img
                src={coverImage}
                alt={game.title}
                className={`w-full h-full object-cover ${isDesktopOnlyOnMobile ? "opacity-45" : ""}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {t("No image")}
              </div>
            )}

            {isDesktopOnlyOnMobile && (
              <div className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                {t("Desktop only")}
              </div>
            )}

            {isDesktopOnlyOnMobile ? (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/55 text-white"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <Smartphone className="h-6 w-6 mb-2" />
                <p className="text-sm font-medium">{t("This game is best played on desktop.")}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                window.location.href = `/game/${game.id}`
              }}
              className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white border border-white/20 hover:bg-black/80"
            >
              {t("Play")}
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (settings.maintenance_mode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{settings.site_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">{t("We are currently under maintenance.")}</p>
            <p className="text-sm text-muted-foreground">{t("Please check back soon.")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background max-sm:bg-white max-sm:dark:bg-[#0a0a0a]">
      <header className="border-b border-border bg-card sticky top-0 z-40 max-sm:pt-12">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{settings.site_name}</h1>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search games...")}
              className="pl-9"
            />
          </div>

          <div className="sm:ml-auto flex items-center gap-2">
            {isSignedIn ? (
              <>
                <Button variant="outline" onClick={() => (window.location.href = "/favourites")}>
                  <Heart className="h-4 w-4 mr-2" />
                  {t("Favourites")}
                </Button>

                {isAdmin && (
                  <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
                    {t("Admin")}
                  </Button>
                )}

                <Button variant="outline" onClick={() => (window.location.href = "/account")}>
                  {t("Account")}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => (window.location.href = "/login?redirect_url=/")}>
                {t("Login")}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {categoryCards.length > 0 && !query.trim() && (
          <section className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-xl font-bold text-foreground">{t("Categories")}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categoryCards.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setSelectedCategory(category.name)}
                  className={`rounded-lg border p-3 text-left transition ${selectedCategory === category.name ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/60"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="text-xs text-muted-foreground">{category.gameCount} {category.gameCount === 1 ? t("game") : t("games")}</span>
                  </div>
                  <p className="mt-2 font-medium text-foreground">{category.name}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {categories.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="whitespace-nowrap"
                onClick={() => setSelectedCategory(category)}
              >
                {category === t("All") ? t("All") : category}
              </Button>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          {filteredGames.length} {filteredGames.length === 1 ? t("game") : t("games")}
          {query || selectedCategory !== t("All") ? ` ${t("found")}` : ` ${t("available")}`}
        </p>

        {featuredGames.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{t("Featured")}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featuredGames.map(renderGameCard)}
            </div>
          </section>
        )}

        {newGames.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{t("New Games")}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {newGames.map(renderGameCard)}
            </div>
          </section>
        )}

        <section>
          {!query && selectedCategory === t("All") && (featuredGames.length > 0 || newGames.length > 0) && regularGames.length > 0 && (
            <h2 className="text-xl font-bold text-foreground mb-3">{t("All Games")}</h2>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {regularGames.map(renderGameCard)}
          </div>
        </section>

        {filteredGames.length === 0 && (
          <div className="text-center py-8 sm:py-16">
            <Gamepad2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t("No games found")}</h2>
            <p className="text-sm sm:text-base text-muted-foreground">{t("Try a different search or category.")}</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-6 text-center text-sm text-muted-foreground space-y-3">
          <p>{settings.footer_text}</p>
          <nav className="flex justify-center gap-3 flex-wrap">
            <button type="button" className="hover:text-foreground" onClick={() => (window.location.href = "/")}>{t("Home")}</button>
            <button type="button" className="hover:text-foreground" onClick={() => (window.location.href = "/account")}>{t("Account")}</button>
            <button type="button" className="hover:text-foreground" onClick={() => (window.location.href = "/favourites")}>{t("Favourites")}</button>
          </nav>
        </div>
      </footer>

      {showBackToTop && (
        <Button className="fixed bottom-4 right-4 z-40 shadow-lg" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t("Back to top")}</span>
        </Button>
      )}

      {activeGame && (
        <div className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center ${isFullscreen ? "p-0" : "p-0 sm:p-4"}`}>
          <div ref={gameContainerRef} className={`bg-card overflow-hidden flex flex-col w-full h-full ${isFullscreen ? "rounded-none" : "rounded-none sm:rounded-lg sm:max-w-5xl sm:h-[80vh]"}`}>
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-muted pt-[env(safe-area-top,0px)]">
              <h2 className="font-semibold text-sm sm:text-base text-foreground truncate mr-2">{activeGame.title}</h2>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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

            <div className="flex-1 bg-black pb-[env(safe-area-bottom,0px)]">
              <iframe
                src={activeGame.url}
                className="w-full h-full border-0"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-pointer-lock"
                title={activeGame.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { UserButton, useSupabaseAuth } from "@/lib/supabase-auth"
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
  ArrowUp,
  Heart,
  Sparkles,
} from "lucide-react"
import { games as fallbackGames, type Game, getGameImage } from "@/lib/games"

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

export default function GamePortal() {
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
    site_name: "Game Portal",
    footer_text: "© 2026 Game Portal",
    maintenance_mode: false,
  })

  const gameContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          site_name: data.site_name || "Game Portal",
          footer_text: data.footer_text || "© 2026 Game Portal",
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

  const gameCategoryNames = useMemo(() => Array.from(new Set(games.map((game) => game.category?.trim()).filter((category): category is string => Boolean(category)))).sort((a, b) => a.localeCompare(b)), [games])

  const categoryCards = useMemo(() => {
    const apiByName = new Map(categoriesFromApi.map((category) => [category.name, category]))
    return gameCategoryNames.map((name) => {
      const configuredCategory = apiByName.get(name)
      const gameCount = games.filter((game) => game.category === name).length
      return { name, emoji: configuredCategory?.emoji || "🎮", gameCount }
    })
  }, [categoriesFromApi, gameCategoryNames, games])

  const categories = useMemo(() => ["All", ...gameCategoryNames], [gameCategoryNames])

  useEffect(() => {
    if (!categories.includes(selectedCategory)) setSelectedCategory("All")
  }, [categories, selectedCategory])

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase()
    return games.filter((game) => {
      const matchesCategory = selectedCategory === "All" || game.category === selectedCategory
      if (!matchesCategory) return false
      if (!q) return true
      return `${game.title} ${game.category || ""}`.toLowerCase().includes(q)
    })
  }, [games, query, selectedCategory])

  const featuredGames = useMemo(() => query.trim() || selectedCategory !== "All" ? [] : filteredGames.filter((game) => game.featured === true), [filteredGames, query, selectedCategory])
  const newGames = useMemo(() => query.trim() || selectedCategory !== "All" ? [] : filteredGames.filter((game) => game.is_new === true).slice(0, 12), [filteredGames, query, selectedCategory])
  const regularGames = useMemo(() => query.trim() || selectedCategory !== "All" ? filteredGames : filteredGames.filter((game) => !game.featured && !game.is_new), [filteredGames, query, selectedCategory])

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
      <Card key={game.id} className={`group hover:shadow-lg transition-shadow ${isDesktopOnlyOnMobile ? "cursor-not-allowed" : "cursor-pointer"}`} onClick={(event) => { if (isDesktopOnlyOnMobile) { event.preventDefault(); event.stopPropagation(); return } openGame(game) }}>
        <CardHeader className="pb-2"><CardTitle className="text-base sm:text-lg truncate flex items-center gap-2">{game.featured && <Star className="h-4 w-4 shrink-0" />}{game.is_new && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">NEW</span>}<span className="truncate">{game.title}</span></CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative group">
            {coverImage ? <img src={coverImage} alt={game.title} className={`w-full h-full object-cover ${isDesktopOnlyOnMobile ? "opacity-45" : ""}`} /> : <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted-foreground/20"><Gamepad2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground" /></div>}
            {isDesktopOnlyOnMobile && <div className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white flex items-center gap-1"><Monitor className="h-3 w-3" />Desktop Only</div>}
            {isDesktopOnlyOnMobile && <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/55 text-white" onClick={(event) => { event.preventDefault(); event.stopPropagation() }}><Smartphone className="h-8 w-8 mb-2" /><p className="font-semibold">Desktop Only</p></div>}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* TOP HEADER BAR DESK AREA */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedCategory("All")}>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{settings.site_name}</span>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </div>
      </header>

      {/* SEARCH AND GRID AREA CONTAINER */}
      <main className="flex-1 container py-6 px-4 sm:py-10 sm:px-8 max-w-7xl mx-auto space-y-8 sm:space-y-12">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 sm:p-6 rounded-2xl border border-muted">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Search games or categories..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 h-11 bg-background rounded-xl" />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
            {categories.map((cat) => (
              <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} onClick={() => setSelectedCategory(cat)} className="rounded-xl h-10 px-4 text-sm font-medium">
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* FEATURED RENDER SECTION */}
        {featuredGames.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"><Star className="h-5 w-5 text-primary fill-primary" />Featured Games</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{featuredGames.map(renderGameCard)}</div>
          </section>
        )}

        {/* REGULAR MAIN GAME GRID SECTION */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">All Games</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">{regularGames.map(renderGameCard)}</div>
        </section>
      </main>

      {/* FOOTER METRICS AREA */}
      <footer className="border-t bg-muted/20 py-6 text-center text-sm text-muted-foreground mt-auto">
        <p>{settings.footer_text}</p>
      </footer>

      {/* BACK TO TOP WIDGET HOOK */}
      {showBackToTop && (
        <Button variant="secondary" size="icon" className="fixed bottom-6 right-6 rounded-full shadow-md z-30" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}

      {/* THE ACTIVE POPUP MODAL IFRAME LAYER - PATIENT SHIELD TRAP FOR REDIRECTS */}
      {activeGame && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
          <div ref={gameContainerRef} className="w-full h-full sm:max-w-5xl sm:h-[80vh] bg-black sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/10 relative">
            
            {/* CANVAS INTERACTION HEADER CONTROLS */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 transition-opacity opacity-40 hover:opacity-100">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/15 rounded-lg" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-red-500/80 rounded-lg" onClick={() => setActiveGame(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* THE UNBREAKABLE SANBOXED CANVAS CONTAINER EMED ELEMENT THREAD */}
            <div className="flex-1 w-full h-full relative bg-black select-none">
              <iframe
                src={activeGame.embed_url}
                title={activeGame.title}
                className="w-full h-full border-none"
                scrolling="no"
                allow="autoplay; fullscreen"
                /* 
                  THE UNBREAKABLE OVERRIDE TRAP:
                  By explicitly omitting 'allow-top-navigation', the browser 
                  permanently strips the WebAssembly game engine of its privilege 
                  to change your portal domain address or force redirects!
                */
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

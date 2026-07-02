"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Gamepad2, Trash2 } from "lucide-react"
import { games as fallbackGames, type Game, getGameImage } from "@/lib/games"

type PortalGame = Game & {
  image?: string | null
  category?: string | null
  hidden?: boolean
}

type RecentEntry = {
  gameId: string
  playedAt: string
}

const RECENTLY_PLAYED_KEY = "games-portal-recently-played"

function readRecentlyPlayed(): RecentEntry[] {
  if (typeof window === "undefined") return []

  try {
    const value = window.localStorage.getItem(RECENTLY_PLAYED_KEY)
    const parsed = value ? JSON.parse(value) : []
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((entry) => entry && typeof entry.gameId === "string" && typeof entry.playedAt === "string")
      .slice(0, 24)
  } catch {
    return []
  }
}

function formatPlayedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recently"

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`

  return date.toLocaleDateString()
}

export default function RecentlyPlayedPage() {
  const [games, setGames] = useState<PortalGame[]>(fallbackGames)
  const [blobImages, setBlobImages] = useState<Record<string, string>>({})
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])

  useEffect(() => {
    setRecentEntries(readRecentlyPlayed())
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
    fetch("/api/game-images")
      .then((res) => res.json())
      .then((data) => setBlobImages(data))
      .catch(() => setBlobImages({}))
  }, [])

  const recentGames = useMemo(() => {
    const gamesById = new Map(games.map((game) => [game.id, game]))
    return recentEntries
      .map((entry) => ({ entry, game: gamesById.get(entry.gameId) }))
      .filter((item): item is { entry: RecentEntry; game: PortalGame } => Boolean(item.game) && !item.game?.hidden)
  }, [games, recentEntries])

  const clearRecentlyPlayed = () => {
    window.localStorage.removeItem(RECENTLY_PLAYED_KEY)
    setRecentEntries([])
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Recently Played</h1>
            </div>
            <p className="text-muted-foreground mt-2">Jump back into games you opened recently on this device.</p>
          </div>
          <div className="flex gap-2">
            {recentEntries.length > 0 && (
              <Button variant="outline" onClick={clearRecentlyPlayed}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            <Button variant="outline" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </div>
        </div>

        {recentGames.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">No recently played games yet</h2>
              <p className="text-sm text-muted-foreground">Open a game and it will appear here.</p>
              <Button onClick={() => (window.location.href = "/")}>Browse Games</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentGames.map(({ entry, game }) => {
              const coverImage = blobImages[game.id] || game.image || getGameImage(game.id)

              return (
                <Card key={`${game.id}-${entry.playedAt}`} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <button type="button" className="block w-full text-left" onClick={() => (window.location.href = `/game/${game.id}`)}>
                    <div className="aspect-video bg-muted overflow-hidden">
                      {coverImage ? (
                        <img src={coverImage} alt={game.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center"><Gamepad2 className="h-10 w-10 text-muted-foreground" /></div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base truncate">{game.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">Played {formatPlayedAt(entry.playedAt)}</p>
                    </CardHeader>
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

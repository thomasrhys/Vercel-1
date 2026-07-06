"use client";

import { useEffect, useMemo, useState } from "react";
import { UserButton, useSupabaseAuth } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { games as fallbackGames, type Game } from "@/lib/games";
import { Activity, FileText, Folder, Inbox, Lock, Package, UploadCloud, Wrench } from "lucide-react";

type AdminGame = Game & {
  image?: string | null;
  category?: string | null;
  featured?: boolean;
  hidden?: boolean;
  desktop_only?: boolean;
};

type Category = {
  id: string;
  name: string;
  emoji?: string | null;
};

type GameRequest = {
  status: "open" | "completed";
};

export default function AdminPageClient() {
  const { isLoaded, isSignedIn, isAdmin, signOut } = useSupabaseAuth();
  const [adminGames, setAdminGames] = useState<AdminGame[]>(fallbackGames);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [newGameTitle, setNewGameTitle] = useState("");
  const [newGameUrl, setNewGameUrl] = useState("");
  const [newGameCategory, setNewGameCategory] = useState("");
  const [newGameCoverFile, setNewGameCoverFile] = useState<File | null>(null);
  const [newGameCoverPreview, setNewGameCoverPreview] = useState("");
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");
  const [openRequestsCount, setOpenRequestsCount] = useState(0);
  const [isLoadingGames, setIsLoadingGames] = useState(false);

  const featuredCount = adminGames.filter((game) => game.featured).length;
  const hiddenCount = adminGames.filter((game) => game.hidden).length;
  const desktopOnlyCount = adminGames.filter((game) => game.desktop_only).length;

  const filteredGames = useMemo(() => {
    const query = managerSearch.trim().toLowerCase();
    if (!query) return adminGames;
    return adminGames.filter((game) => `${game.title} ${game.category || ""}`.toLowerCase().includes(query));
  }, [adminGames, managerSearch]);

  const loadAdminGames = async () => {
    setIsLoadingGames(true);
    try {
      const response = await fetch("/api/admin/games");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setAdminGames(data);
      else if (!response.ok) setMessage(`✗ ${data.error || "Failed to load games"}`);
    } catch (error) {
      console.error("[admin] load games error:", error);
      setMessage("Failed to load games");
    } finally {
      setIsLoadingGames(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setCategories(data);
    } catch (error) {
      console.error("[admin] load categories error:", error);
    }
  };

  const loadOpenRequestsCount = async () => {
    try {
      const response = await fetch("/api/admin/requests");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setOpenRequestsCount(data.filter((request: GameRequest) => request.status === "open").length);
      }
    } catch (error) {
      console.error("[admin] request count error:", error);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadAdminGames();
    loadCategories();
    loadOpenRequestsCount();
  }, [isAdmin]);

  const readFilePreview = (file: File, setPreviewValue: (value: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => setPreviewValue(reader.result as string);
    reader.readAsDataURL(file);
  };

  const setCoverFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }
    setSelectedFile(file);
    readFilePreview(file, setPreview);
    setMessage("");
  };

  const setNewGameCover = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }
    setNewGameCoverFile(file);
    readFilePreview(file, setNewGameCoverPreview);
    setMessage("");
  };

  const uploadCoverForGame = async (gameId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("gameId", gameId);

    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Cover upload failed");
    return data;
  };

  const handleAddGame = async () => {
    if (!newGameTitle || !newGameUrl) {
      setMessage("Please enter a title and URL");
      return;
    }

    setIsAddingGame(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newGameTitle, url: newGameUrl, category: newGameCategory }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(`✗ ${data.error || "Failed to add game"}`);
        return;
      }

      if (data.game && newGameCoverFile) await uploadCoverForGame(data.game.id, newGameCoverFile);

      setMessage(`✓ ${data.message || "Game added"}`);
      setNewGameTitle("");
      setNewGameUrl("");
      setNewGameCategory("");
      setNewGameCoverFile(null);
      setNewGameCoverPreview("");
      loadAdminGames();
    } catch (error) {
      setMessage(error instanceof Error ? `✗ ${error.message}` : "Failed to add game");
    } finally {
      setIsAddingGame(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedGameId) {
      setMessage("Please select a game and file");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const data = await uploadCoverForGame(selectedGameId, selectedFile);
      setMessage(`✓ ${data.message || "Cover uploaded"}`);
      setSelectedFile(null);
      setPreview("");
      setSelectedGameId("");
      loadAdminGames();
    } catch (error) {
      setMessage(error instanceof Error ? `✗ ${error.message}` : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const categorySelect = (value: string, onChange: (value: string) => void) => (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
      <option value="">Uncategorized</option>
      {categories.map((category) => (
        <option key={category.id} value={category.name}>{category.emoji || "🎮"} {category.name}</option>
      ))}
    </select>
  );

  if (!isLoaded) return <main className="min-h-screen bg-background flex items-center justify-center p-4">Loading admin...</main>;

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Admin Login</CardTitle>
            <CardDescription>Sign in to access admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => (window.location.href = "/login?redirect_url=/admin")}>Sign in</Button>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>This account does not have admin access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserButton />
            <Button variant="outline" className="w-full" onClick={signOut}>Sign out</Button>
            <Button className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Upload covers and manage games</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2"><UserButton /><div className="px-3 py-1 rounded-md text-sm font-medium bg-green-500/20 text-green-700">✓ Admin</div></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/")}>Back to Games</Button>
              <Button variant="outline" size="sm" onClick={signOut}>Logout</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <a href="/admin/utilities" className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition"><div className="flex items-center gap-2 text-sm font-medium"><Wrench className="h-4 w-4" />Utilities</div><p className="text-xs text-muted-foreground mt-1">Maintenance tools</p></a>
          <a href="/admin/bulk" className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition"><div className="flex items-center gap-2 text-sm font-medium"><Package className="h-4 w-4" />Bulk Actions</div><p className="text-xs text-muted-foreground mt-1">Update many games</p></a>
          <a href="/admin/descriptions" className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition"><div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" />Descriptions</div><p className="text-xs text-muted-foreground mt-1">Edit descriptions</p></a>
          <a href="/admin/categories" className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition"><div className="flex items-center gap-2 text-sm font-medium"><Folder className="h-4 w-4" />Categories</div><p className="text-xs text-muted-foreground mt-1">Manage emojis</p></a>
          <a href="/admin/health" className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition col-span-2 sm:col-span-1"><div className="flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4" />Health</div><p className="text-xs text-muted-foreground mt-1">Quality checks</p></a>
        </div>

        {message && <div className={`p-3 rounded-md text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>{message}</div>}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Games</p><p className="text-2xl font-bold">{adminGames.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Requests</p><p className="text-2xl font-bold">{openRequestsCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Featured</p><p className="text-2xl font-bold">{featuredCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Hidden</p><p className="text-2xl font-bold">{hiddenCount}</p></CardContent></Card>
          <Card className="col-span-2 sm:col-span-1"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Desktop Only</p><p className="text-2xl font-bold">{desktopOnlyCount}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5" />Game Requests</CardTitle><CardDescription>{openRequestsCount} open requests awaiting review.</CardDescription></CardHeader>
          <CardContent><Button className="w-full" onClick={() => (window.location.href = "/admin/requests")}>Open Requests</Button></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add Game</CardTitle><CardDescription>Add a game to Supabase. Cover image is optional.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <input type="text" placeholder="Game title" value={newGameTitle} onChange={(event) => setNewGameTitle(event.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
            <input type="url" placeholder="Game URL" value={newGameUrl} onChange={(event) => setNewGameUrl(event.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
            {categorySelect(newGameCategory, setNewGameCategory)}
            <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setNewGameCover(file); }} className="w-full px-3 py-2 border border-border rounded-md" />
            {newGameCoverPreview && <img src={newGameCoverPreview} alt="New game cover preview" className="w-full max-w-xs rounded-md border border-border" />}
            <Button onClick={handleAddGame} disabled={isAddingGame || !newGameTitle || !newGameUrl} className="w-full">{isAddingGame ? "Adding..." : "Add Game"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assign Cover Art</CardTitle><CardDescription>Select a game and upload or replace its cover image.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <select value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
              <option value="">-- Choose a game --</option>
              {adminGames.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}
            </select>
            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50" onClick={() => document.getElementById("cover-upload")?.click()}>
              <UploadCloud className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Click to choose a cover image</p>
              {selectedFile && <p className="text-xs text-muted-foreground mt-3">Selected: {selectedFile.name}</p>}
              <input id="cover-upload" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setCoverFile(file); }} className="hidden" />
            </div>
            {preview && <img src={preview} alt="Preview" className="w-full max-w-xs rounded-md border border-border" />}
            <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !selectedGameId} className="w-full">{isUploading ? "Uploading..." : "Upload & Assign"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Game Manager</CardTitle><CardDescription>Search current games. Use Bulk Actions for mass edits.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <input type="text" placeholder="Search by title or category..." value={managerSearch} onChange={(event) => setManagerSearch(event.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><span>Showing {filteredGames.length} of {adminGames.length} games</span><Button type="button" variant="outline" size="sm" onClick={() => { loadAdminGames(); loadCategories(); }} disabled={isLoadingGames}>{isLoadingGames ? "Refreshing..." : "Refresh"}</Button></div>
            <div className="space-y-2 max-h-96 overflow-auto">
              {filteredGames.map((game) => <div key={game.id} className="rounded-md border border-border p-3"><p className="font-medium truncate">{game.title}</p><p className="text-xs text-muted-foreground truncate">{game.category || "Uncategorized"}</p></div>)}
              {filteredGames.length === 0 && <div className="rounded-md border border-border p-4 text-sm text-muted-foreground text-center">No games found.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

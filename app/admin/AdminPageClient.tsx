"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { games as fallbackGames, type Game } from "@/lib/games";
import { Check, Eye, EyeOff, FileText, Folder, Inbox, Lock, Package, Pencil, Smartphone, Star, Trash2, UploadCloud, Wrench, X } from "lucide-react";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

type AdminGame = Game & {
  image?: string | null;
  category?: string | null;
  featured?: boolean;
  hidden?: boolean;
  desktop_only?: boolean;
  created_at?: string;
};

type GameRequest = {
  id: string;
  status: "open" | "completed";
};

type Category = {
  id: string;
  name: string;
  emoji: string;
  game_count?: number;
};

export default function AdminPageClient() {
  const { isSignedIn, user } = useUser();
  const isAdmin = !!user?.id && ADMIN_USER_IDS.includes(user.id);

  const [adminGames, setAdminGames] = useState<AdminGame[]>(fallbackGames);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [newGameTitle, setNewGameTitle] = useState("");
  const [newGameUrl, setNewGameUrl] = useState("");
  const [newGameCategory, setNewGameCategory] = useState("");
  const [newGameCoverFile, setNewGameCoverFile] = useState<File | null>(null);
  const [newGameCoverPreview, setNewGameCoverPreview] = useState("");
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [sourceRequestId, setSourceRequestId] = useState<string | null>(null);

  const [managerSearch, setManagerSearch] = useState("");
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [openRequestsCount, setOpenRequestsCount] = useState(0);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [togglingGameId, setTogglingGameId] = useState<string | null>(null);

  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [savingGameId, setSavingGameId] = useState<string | null>(null);

  const featuredCount = adminGames.filter((game) => game.featured).length;
  const hiddenCount = adminGames.filter((game) => game.hidden).length;
  const desktopOnlyCount = adminGames.filter((game) => game.desktop_only).length;

  const filteredManagerGames = useMemo(() => {
    const query = managerSearch.trim().toLowerCase();
    if (!query) return adminGames;
    return adminGames.filter((game) =>
      `${game.title} ${game.category || ""}`.toLowerCase().includes(query)
    );
  }, [adminGames, managerSearch]);

  const loadAdminGames = async () => {
    setIsLoadingGames(true);
    try {
      const response = await fetch("/api/admin/games");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setAdminGames(data);
      else if (!response.ok) setMessage(`✗ ${data.error || "Failed to load games"}`);
    } catch (error) {
      setMessage("Failed to load games from Supabase");
      console.error("[v0] Load games error:", error);
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
      console.error("[v0] Load categories error:", error);
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
      console.error("[v0] Request count error:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminGames();
      loadCategories();
      loadOpenRequestsCount();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const params = new URLSearchParams(window.location.search);
    const requestedTitle = params.get("title");
    const requestedUrl = params.get("url");
    const requestId = params.get("requestId");

    if (requestedTitle) setNewGameTitle(requestedTitle);
    if (requestedUrl) setNewGameUrl(requestedUrl);
    if (requestId) setSourceRequestId(requestId);

    if (requestedTitle || requestedUrl || requestId) {
      window.history.replaceState(null, "", "/admin");
    }
  }, [isAdmin]);

  const replaceGameInList = (updatedGame: AdminGame) => {
    setAdminGames((currentGames) =>
      currentGames
        .map((currentGame) => (currentGame.id === updatedGame.id ? updatedGame : currentGame))
        .sort((a, b) => a.title.localeCompare(b.title))
    );
  };

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
    setMessage("");
    readFilePreview(file, setPreview);
  };

  const setNewGameCover = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }
    setNewGameCoverFile(file);
    setMessage("");
    readFilePreview(file, setNewGameCoverPreview);
  };

  const uploadCoverForGame = async (gameId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("gameId", gameId);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Cover upload failed");
    }

    return data;
  };

  const markRequestCompleted = async (requestId: string) => {
    await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, status: "completed" }),
    });
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
        setMessage(`✗ ${data.error}`);
        return;
      }

      let messageText = `✓ ${data.message}`;

      if (data.game) {
        if (newGameCoverFile) {
          await uploadCoverForGame(data.game.id, newGameCoverFile);
          messageText += " and uploaded cover";
        }

        if (sourceRequestId) {
          await markRequestCompleted(sourceRequestId);
          setSourceRequestId(null);
          loadOpenRequestsCount();
          messageText += " and completed request";
        }

        setAdminGames((currentGames) =>
          [...currentGames, data.game].sort((a, b) => a.title.localeCompare(b.title))
        );
      } else {
        loadAdminGames();
      }

      setMessage(messageText);
      setNewGameTitle("");
      setNewGameUrl("");
      setNewGameCategory("");
      setNewGameCoverFile(null);
      setNewGameCoverPreview("");
    } catch (error) {
      setMessage(error instanceof Error ? `✗ ${error.message}` : "Failed to add game");
      console.error("[v0] Add game error:", error);
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
      setMessage(`✓ ${data.message}`);
      setSelectedFile(null);
      setPreview("");
      setSelectedGameId("");
    } catch (error) {
      setMessage(error instanceof Error ? `✗ ${error.message}` : "Upload failed");
      console.error("[v0] Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const startEditingGame = (game: AdminGame) => {
    setEditingGameId(game.id);
    setEditTitle(game.title);
    setEditUrl(game.url);
    setEditCategory(game.category || "");
    setMessage("");
  };

  const cancelEditingGame = () => {
    setEditingGameId(null);
    setEditTitle("");
    setEditUrl("");
    setEditCategory("");
  };

  const handleUpdateGame = async (game: AdminGame) => {
    if (!editTitle || !editUrl) {
      setMessage("Please enter a title and URL");
      return;
    }
    setSavingGameId(game.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: game.id, title: editTitle, url: editUrl, category: editCategory }),
      });
      const data = await response.json();
      if (response.ok && data.game) {
        setMessage(`✓ ${data.message}`);
        replaceGameInList(data.game);
        cancelEditingGame();
      } else {
        setMessage(`✗ ${data.error || "Failed to update game"}`);
      }
    } catch (error) {
      setMessage("Failed to update game");
      console.error("[v0] Update game error:", error);
    } finally {
      setSavingGameId(null);
    }
  };

  const handleToggleGameStatus = async (game: AdminGame, updates: { featured?: boolean; hidden?: boolean }) => {
    setTogglingGameId(game.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/game-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: game.id, ...updates }),
      });
      const data = await response.json();
      if (response.ok && data.game) {
        setMessage(`✓ ${data.message}`);
        replaceGameInList(data.game);
      } else {
        setMessage(`✗ ${data.error || "Failed to update game"}`);
      }
    } catch (error) {
      setMessage("Failed to update game");
      console.error("[v0] Toggle game status error:", error);
    } finally {
      setTogglingGameId(null);
    }
  };

  const handleToggleDesktopOnly = async (game: AdminGame) => {
    setTogglingGameId(game.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/desktop-only", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: game.id, desktop_only: !game.desktop_only }),
      });
      const data = await response.json();
      if (response.ok && data.game) {
        setMessage(`✓ ${data.message}`);
        replaceGameInList(data.game);
      } else {
        setMessage(`✗ ${data.error || "Failed to update desktop-only setting"}`);
      }
    } catch (error) {
      setMessage("Failed to update desktop-only setting");
      console.error("[v0] Toggle desktop-only error:", error);
    } finally {
      setTogglingGameId(null);
    }
  };

  const handleDeleteGame = async (game: AdminGame) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${game.title}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingGameId(game.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/games", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: game.id }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`✓ Deleted ${game.title}`);
        setAdminGames((currentGames) => currentGames.filter((currentGame) => currentGame.id !== game.id));
        if (selectedGameId === game.id) setSelectedGameId("");
        if (editingGameId === game.id) cancelEditingGame();
      } else {
        setMessage(`✗ ${data.error || "Failed to delete game"}`);
      }
    } catch (error) {
      setMessage("Failed to delete game");
      console.error("[v0] Delete game error:", error);
    } finally {
      setDeletingGameId(null);
    }
  };

  const categorySelect = (
    value: string,
    onChange: (value: string) => void,
    label = "Category"
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
        >
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.emoji || "🎮"} {category.name}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={() => (window.location.href = "/admin/categories")}>
          New
        </Button>
      </div>
      {categories.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No categories yet. Use Category Manager to create one.
        </p>
      )}
    </div>
  );

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Admin Login</CardTitle>
            <CardDescription>Sign in with GitHub to access admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignInButton mode="modal"><Button className="w-full">Sign in</Button></SignInButton>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>You are signed in, but this account does not have admin access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserButton />
            <SignOutButton redirectUrl="/"><Button variant="outline" className="w-full">Sign out</Button></SignOutButton>
            <Button className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
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
              <SignOutButton redirectUrl="/"><Button variant="outline" size="sm">Logout</Button></SignOutButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a href="/admin/utilities" className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Wrench className="h-4 w-4" />Utilities</div>
            <p className="text-xs text-muted-foreground mt-1">Maintenance, backups & tools</p>
          </a>
          <a href="/admin/bulk" className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Package className="h-4 w-4" />Bulk Actions</div>
            <p className="text-xs text-muted-foreground mt-1">Update multiple games</p>
          </a>
          <a href="/admin/descriptions" className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><FileText className="h-4 w-4" />Descriptions</div>
            <p className="text-xs text-muted-foreground mt-1">Hidden description editor</p>
          </a>
          <a href="/admin/categories" className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Folder className="h-4 w-4" />Categories</div>
            <p className="text-xs text-muted-foreground mt-1">Manage category emojis</p>
          </a>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5" />Game Requests</CardTitle>
            <CardDescription>{openRequestsCount} open requests awaiting review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => (window.location.href = "/admin/requests")}>Open Requests</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add Game</CardTitle><CardDescription>Add a game to Supabase. Cover image is optional and can still be uploaded separately later.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {sourceRequestId && <div className="p-3 rounded-md text-sm bg-primary/10 text-primary">Adding from a request. Saving this game will mark the request as completed.</div>}
            <input type="text" placeholder="Game title" value={newGameTitle} onChange={(e) => setNewGameTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
            <input type="url" placeholder="Game URL" value={newGameUrl} onChange={(e) => setNewGameUrl(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
            {categorySelect(newGameCategory, setNewGameCategory, "Category, optional")}

            <div className="rounded-md border border-border p-3 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Optional Cover Image</p>
                <p className="text-xs text-muted-foreground">You can add a cover now, or leave this empty and use Assign Cover Art later.</p>
              </div>
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setNewGameCover(file); }} className="w-full px-3 py-2 border border-border rounded-md" />
              {newGameCoverFile && <p className="text-xs text-muted-foreground">Selected: {newGameCoverFile.name}</p>}
              {newGameCoverPreview && <img src={newGameCoverPreview} alt="New game cover preview" className="w-full max-w-xs h-auto rounded-md border border-border" />}
              {newGameCoverFile && <Button type="button" variant="outline" size="sm" onClick={() => { setNewGameCoverFile(null); setNewGameCoverPreview(""); }}>Remove Cover</Button>}
            </div>

            <Button onClick={handleAddGame} disabled={isAddingGame || !newGameTitle || !newGameUrl} className="w-full">{isAddingGame ? "Adding..." : "Add Game"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assign Cover Art</CardTitle><CardDescription>Select a game and upload or replace its cover image.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select Game</label>
              <select value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                <option value="">-- Choose a game --</option>
                {adminGames.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Upload Image</label>
              <div
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) setCoverFile(file); }}
                onClick={() => document.getElementById("cover-upload")?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${isDragging ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"}`}
              >
                <UploadCloud className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Drag cover image here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to choose a JPG, PNG, or WebP file</p>
                {selectedFile && <p className="text-xs text-muted-foreground mt-3">Selected: {selectedFile.name}</p>}
                <input id="cover-upload" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setCoverFile(file); }} className="hidden" />
              </div>
            </div>
            {preview && <div><label className="block text-sm font-medium text-foreground mb-2">Preview</label><img src={preview} alt="Preview" className="w-full max-w-xs h-auto rounded-md border border-border" /></div>}
            <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !selectedGameId} className="w-full">{isUploading ? "Uploading..." : "Upload & Assign"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Game Manager</CardTitle><CardDescription>Search by title or category, edit, feature, hide, mark desktop-only, or delete games.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Search Games</label>
              <input type="text" placeholder="Search by title or category..." value={managerSearch} onChange={(e) => setManagerSearch(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>Showing {filteredManagerGames.length} of {adminGames.length} games</span>
              <Button type="button" variant="outline" size="sm" onClick={() => { loadAdminGames(); loadCategories(); }} disabled={isLoadingGames}>{isLoadingGames ? "Refreshing..." : "Refresh"}</Button>
            </div>
            <div className="space-y-3">
              {filteredManagerGames.map((game) => {
                const isEditing = editingGameId === game.id;
                return (
                  <div key={game.id} className="rounded-md border border-border p-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" placeholder="Game title" />
                        <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" placeholder="Game URL" />
                        {categorySelect(editCategory, setEditCategory, "Category, optional")}
                        <p className="text-xs text-muted-foreground truncate">ID: {game.id}</p>
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" size="sm" onClick={cancelEditingGame} disabled={savingGameId === game.id}><X className="h-4 w-4 mr-1" />Cancel</Button>
                          <Button type="button" size="sm" onClick={() => handleUpdateGame(game)} disabled={savingGameId === game.id || !editTitle || !editUrl}><Check className="h-4 w-4 mr-1" />{savingGameId === game.id ? "Saving..." : "Save"}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <p className="font-medium text-foreground truncate">{game.title}</p>
                            {game.featured && <span className="text-xs rounded px-2 py-0.5 bg-yellow-500/20 text-yellow-700">Featured</span>}
                            {game.hidden && <span className="text-xs rounded px-2 py-0.5 bg-muted text-muted-foreground">Hidden</span>}
                            {game.desktop_only && <span className="text-xs rounded px-2 py-0.5 bg-blue-500/20 text-blue-700">Desktop Only</span>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{game.id}</p>
                          {game.category && <p className="text-xs text-muted-foreground truncate">Category: {game.category}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <Button type="button" variant={game.featured ? "secondary" : "outline"} size="icon" onClick={() => handleToggleGameStatus(game, { featured: !game.featured })} disabled={togglingGameId === game.id} className="h-8 w-8" title={game.featured ? "Remove featured" : "Feature game"}><Star className="h-4 w-4" /></Button>
                          <Button type="button" variant={game.hidden ? "secondary" : "outline"} size="icon" onClick={() => handleToggleGameStatus(game, { hidden: !game.hidden })} disabled={togglingGameId === game.id} className="h-8 w-8" title={game.hidden ? "Show game" : "Hide game"}>{game.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                          <Button type="button" variant={game.desktop_only ? "secondary" : "outline"} size="sm" onClick={() => handleToggleDesktopOnly(game)} disabled={togglingGameId === game.id} className="h-8 px-2" title={game.desktop_only ? "Allow mobile play" : "Mark desktop only"}><Smartphone className="h-4 w-4 mr-1" />Hide</Button>
                          <Button type="button" variant="outline" size="icon" onClick={() => startEditingGame(game)} className="h-8 w-8" title="Edit game"><Pencil className="h-4 w-4" /></Button>
                          <Button type="button" variant="destructive" size="icon" onClick={() => handleDeleteGame(game)} disabled={deletingGameId === game.id} className="h-8 w-8" title={deletingGameId === game.id ? "Deleting game" : "Delete game"}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredManagerGames.length === 0 && <div className="rounded-md border border-border p-4 text-sm text-muted-foreground text-center">No games found.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

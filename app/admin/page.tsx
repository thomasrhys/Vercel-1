"use client";

import { useState } from "react";
import {
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { games } from "@/lib/games";
import { Lock, UploadCloud } from "lucide-react";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

export default function AdminPage() {
  const { isSignedIn, user } = useUser();

  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const [newGameTitle, setNewGameTitle] = useState("");
  const [newGameUrl, setNewGameUrl] = useState("");
  const [newGameCategory, setNewGameCategory] = useState("");
  const [isAddingGame, setIsAddingGame] = useState(false);

  const isAdmin = !!user?.id && ADMIN_USER_IDS.includes(user.id);

  const setCoverFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }

    setSelectedFile(file);
    setMessage("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setCoverFile(file);
    }
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newGameTitle,
          url: newGameUrl,
          category: newGameCategory,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        setNewGameTitle("");
        setNewGameUrl("");
        setNewGameCategory("");
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage("Failed to add game");
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

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("gameId", selectedGameId);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        setSelectedFile(null);
        setPreview("");
        setSelectedGameId("");
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage("Upload failed");
      console.error("[v0] Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Login
            </CardTitle>
            <CardDescription>
              Sign in with GitHub to access admin
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <SignInButton mode="modal">
              <Button className="w-full">Sign in</Button>
            </SignInButton>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Back to Games
            </Button>
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
            <CardDescription>
              You are signed in, but this account does not have admin access.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <UserButton />

            <SignOutButton redirectUrl="/">
              <Button variant="outline" className="w-full">
                Sign out
              </Button>
            </SignOutButton>

            <Button
              className="w-full"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Back to Games
            </Button>
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
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload covers and manage games
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              <UserButton />
              <div className="px-3 py-1 rounded-md text-sm font-medium bg-green-500/20 text-green-700">
                ✓ Admin
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                Back to Games
              </Button>

              <SignOutButton redirectUrl="/">
                <Button variant="outline" size="sm">
                  Logout
                </Button>
              </SignOutButton>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Game</CardTitle>
            <CardDescription>
              Add a new game to Supabase without editing games.ts
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Game title"
              value={newGameTitle}
              onChange={(e) => setNewGameTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />

            <input
              type="url"
              placeholder="Game URL"
              value={newGameUrl}
              onChange={(e) => setNewGameUrl(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />

            <input
              type="text"
              placeholder="Category, optional"
              value={newGameCategory}
              onChange={(e) => setNewGameCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />

            <Button
              onClick={handleAddGame}
              disabled={isAddingGame || !newGameTitle || !newGameUrl}
              className="w-full"
            >
              {isAddingGame ? "Adding..." : "Add Game"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Cover Art</CardTitle>
            <CardDescription>
              Select a game and upload a cover image
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Game
              </label>

              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">-- Choose a game --</option>
                {games.map((game: typeof games[0]) => (
                  <option key={game.id} value={game.id}>
                    {game.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload Image
              </label>

              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);

                  const file = e.dataTransfer.files?.[0];

                  if (file) {
                    setCoverFile(file);
                  }
                }}
                onClick={() => {
                  document.getElementById("cover-upload")?.click();
                }}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <UploadCloud className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />

                <p className="text-sm font-medium text-foreground">
                  Drag cover image here
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  or click to choose a JPG, PNG, or WebP file
                </p>

                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Selected: {selectedFile.name}
                  </p>
                )}

                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {preview && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Preview
                </label>

                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-w-xs h-auto rounded-md border border-border"
                />
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !selectedGameId}
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Upload & Assign"}
            </Button>

            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.startsWith("✓")
                    ? "bg-green-500/20 text-green-700"
                    : "bg-red-500/20 text-red-700"
                }`}
              >
                {message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

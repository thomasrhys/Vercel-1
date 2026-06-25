"use client";

import { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { games } from "@/lib/games";
import { Lock } from "lucide-react";

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [preview, setPreview] = useState<string>("")

  useEffect(() => {
    const loggedIn = localStorage.getItem("adminLoggedIn")

    if (loggedIn === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    if (password === "trystan") {
      localStorage.setItem("adminLoggedIn", "true");
      setIsAuthenticated(true);
      setPassword("");
      setMessage("Authenticated!");
      window.location.href = "/";
    } else {
      setMessage("Incorrect password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("adminLoggedIn")
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedGameId) {
      setMessage("Please select a game and file");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("gameId", selectedGameId);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password}`,
        },
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Login
            </CardTitle>
            <CardDescription>Enter admin password to access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full">
              Login
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
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Upload and assign cover art to games</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className={`px-3 py-1 rounded-md text-sm font-medium ${
              isAuthenticated
                ? "bg-green-500/20 text-green-700"
                : "bg-red-500/20 text-red-700"
            }`}>
              {isAuthenticated ? "✓ Authenticated" : "✗ Not Authenticated"}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/"}
              >
                Back to Games
              </Button>
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assign Cover Art</CardTitle>
            <CardDescription>Select a game and upload a cover image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Game Selection */}
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

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            </div>

            {/* Preview */}
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

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !selectedGameId}
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Upload & Assign"}
            </Button>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.startsWith("✓")
                  ? "bg-green-500/20 text-green-700"
                  : "bg-red-500/20 text-red-700"
              }`}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { SignInButton, SignOutButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { games } from "@/lib/games";
import { Lock } from "lucide-react";

export default function AdminPage() {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string>("");

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

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Admin Login
              </CardTitle>
              <CardDescription>Sign in with GitHub to access admin</CardDescription>
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
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-background p-4 sm:p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                  Upload and assign cover art to games
                </p>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="flex items-center gap-2">
                  <UserButton />
                  <div className="px-3 py-1 rounded-md text-sm font-medium bg-green-500/20 text-green-700">
                    ✓ Signed in
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

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-border rounded-md"
                  />
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
      </SignedIn>
    </>
  );
}

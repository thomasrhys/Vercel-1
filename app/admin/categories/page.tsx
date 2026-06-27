"use client";

import { useEffect, useState } from "react";
import { SignInButton, SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Lock, Pencil, Trash2, X, Check } from "lucide-react";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

type Category = {
  id: string;
  name: string;
  emoji: string;
  game_count: number;
};

export default function AdminCategoriesPage() {
  const { isSignedIn, user } = useUser();
  const isAdmin = !!user?.id && ADMIN_USER_IDS.includes(user.id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎮");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("🎮");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setCategories(data);
      } else {
        setMessage(`✗ ${data.error || "Failed to load categories"}`);
      }
    } catch (error) {
      setMessage("Failed to load categories");
      console.error("[categories] load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadCategories();
  }, [isAdmin]);

  const addCategory = async () => {
    if (!newName.trim()) {
      setMessage("Category name is required");
      return;
    }

    setMessage("");
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, emoji: newEmoji }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        setNewName("");
        setNewEmoji("🎮");
        loadCategories();
      } else {
        setMessage(`✗ ${data.error || "Failed to add category"}`);
      }
    } catch (error) {
      setMessage("Failed to add category");
      console.error("[categories] add error:", error);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditEmoji(category.emoji || "🎮");
    setMessage("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditEmoji("🎮");
  };

  const saveCategory = async (category: Category) => {
    if (!editName.trim()) {
      setMessage("Category name is required");
      return;
    }

    setWorkingId(category.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, name: editName, emoji: editEmoji }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        cancelEditing();
        loadCategories();
      } else {
        setMessage(`✗ ${data.error || "Failed to update category"}`);
      }
    } catch (error) {
      setMessage("Failed to update category");
      console.error("[categories] update error:", error);
    } finally {
      setWorkingId(null);
    }
  };

  const deleteCategory = async (category: Category) => {
    const otherCategories = categories.filter((item) => item.id !== category.id);
    const moveTo = category.game_count > 0
      ? window.prompt(
          `Delete "${category.name}"? Type another category name to move its games there, or leave blank to make those games uncategorized.`,
          otherCategories[0]?.name || ""
        )
      : "";

    if (moveTo === null) return;

    const confirmed = window.confirm(`Delete category "${category.name}"?`);
    if (!confirmed) return;

    setWorkingId(category.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, moveTo }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        loadCategories();
      } else {
        setMessage(`✗ ${data.error || "Failed to delete category"}`);
      }
    } catch (error) {
      setMessage("Failed to delete category");
      console.error("[categories] delete error:", error);
    } finally {
      setWorkingId(null);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Category Manager Login
            </CardTitle>
            <CardDescription>Sign in with GitHub to manage categories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignInButton mode="modal">
              <Button className="w-full">Sign in</Button>
            </SignInButton>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/admin")}>
              Back to Admin
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
            <CardDescription>You are signed in, but this account does not have admin access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserButton />
            <SignOutButton redirectUrl="/">
              <Button variant="outline" className="w-full">Sign out</Button>
            </SignOutButton>
            <Button className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Folder className="h-7 w-7" />
              Category Manager
            </h1>
            <p className="text-muted-foreground mt-2">Create, rename, and delete game categories.</p>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = "/admin")}>Back to Admin</Button>
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Add Category</CardTitle>
            <CardDescription>Add a category with an emoji that appears on the homepage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                maxLength={4}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-center"
              />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
            <Button className="w-full" onClick={addCategory}>Add Category</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>{categories.length} categories configured.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" size="sm" onClick={loadCategories} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>

            {categories.map((category) => {
              const isEditing = editingId === category.id;

              return (
                <div key={category.id} className="rounded-md border border-border p-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-[80px_1fr] gap-2">
                        <input
                          value={editEmoji}
                          onChange={(e) => setEditEmoji(e.target.value)}
                          maxLength={4}
                          className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-center"
                        />
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={cancelEditing} disabled={workingId === category.id}>
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={() => saveCategory(category)} disabled={workingId === category.id}>
                          <Check className="h-4 w-4 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          <span className="mr-2">{category.emoji || "🎮"}</span>
                          {category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {category.game_count} {category.game_count === 1 ? "game" : "games"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => startEditing(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteCategory(category)} disabled={workingId === category.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {categories.length === 0 && (
              <div className="rounded-md border border-border p-4 text-sm text-muted-foreground text-center">
                No categories yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

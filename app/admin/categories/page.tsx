"use client";

import { useEffect, useState } from "react";
import { UserButton, useSupabaseAuth } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Check, Folder, Lock, Pencil, Trash2, X } from "lucide-react";

const EMOJI_OPTIONS = ["🎮", "🕹️", "🏎️", "⚽", "🧩", "🧠", "👻", "⚔️", "🎯", "🎵", "🤖", "🚀", "🐾", "🏰", "🔥", "⭐"];

type Category = {
  id: string;
  name: string;
  emoji: string;
  game_count: number;
};

function EmojiSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="px-3 py-2 border border-border rounded-md bg-background text-foreground">
      {EMOJI_OPTIONS.map((emoji) => <option key={emoji} value={emoji}>{emoji}</option>)}
    </select>
  );
}

export default function AdminCategoriesPage() {
  const { isLoaded, isSignedIn, isAdmin, signOut } = useSupabaseAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎮");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("🎮");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [moveTo, setMoveTo] = useState("");

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setCategories(data);
      else setMessage(`✗ ${data.error || "Failed to load categories"}`);
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
    if (!newName.trim()) return setMessage("Category name is required");
    setMessage("");
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
    } else setMessage(`✗ ${data.error || "Failed to add category"}`);
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
    if (!editName.trim()) return setMessage("Category name is required");
    setWorkingId(category.id);
    setMessage("");
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
    } else setMessage(`✗ ${data.error || "Failed to update category"}`);
    setWorkingId(null);
  };

  const deleteCategory = async () => {
    if (!categoryToDelete) return;
    setWorkingId(categoryToDelete.id);
    setMessage("");
    const response = await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: categoryToDelete.id, moveTo }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage(`✓ ${data.message}`);
      setCategoryToDelete(null);
      setMoveTo("");
      loadCategories();
    } else setMessage(`✗ ${data.error || "Failed to delete category"}`);
    setWorkingId(null);
  };

  if (!isLoaded) return <main className="min-h-screen bg-background flex items-center justify-center p-4">Loading...</main>;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Category Manager Login</CardTitle><CardDescription>Sign in to manage categories.</CardDescription></CardHeader>
          <CardContent className="space-y-4"><Button className="w-full" onClick={() => (window.location.href = "/login?redirect_url=/admin/categories")}>Sign in</Button><Button variant="outline" className="w-full" onClick={() => (window.location.href = "/admin")}>Back to Admin</Button></CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Access denied</CardTitle><CardDescription>You are signed in, but this account does not have admin access.</CardDescription></CardHeader>
          <CardContent className="space-y-4"><UserButton /><Button variant="outline" className="w-full" onClick={signOut}>Sign out</Button><Button className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button></CardContent>
        </Card>
      </div>
    );
  }

  const otherCategories = categories.filter((category) => category.id !== categoryToDelete?.id);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div><h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Folder className="h-7 w-7" />Category Manager</h1><p className="text-muted-foreground mt-2">Create, rename, and delete game categories.</p></div>
          <Button variant="outline" onClick={() => (window.location.href = "/admin")}>Back to Admin</Button>
        </div>

        {message && <div className={`p-3 rounded-md text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>{message}</div>}

        <Card>
          <CardHeader><CardTitle>Add Category</CardTitle><CardDescription>Add a category with an emoji.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[100px_1fr] gap-2"><EmojiSelect value={newEmoji} onChange={setNewEmoji} /><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Category name" className="px-3 py-2 border border-border rounded-md bg-background text-foreground" /></div>
            <Button className="w-full" onClick={addCategory}>Add Category</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Categories</CardTitle><CardDescription>{categories.length} categories configured.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" size="sm" onClick={loadCategories} disabled={isLoading}>{isLoading ? "Refreshing..." : "Refresh"}</Button>
            {categories.map((category) => {
              const isEditing = editingId === category.id;
              return (
                <div key={category.id} className="rounded-md border border-border p-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-[100px_1fr] gap-2"><EmojiSelect value={editEmoji} onChange={setEditEmoji} /><input value={editName} onChange={(event) => setEditName(event.target.value)} className="px-3 py-2 border border-border rounded-md bg-background text-foreground" /></div>
                      <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={cancelEditing} disabled={workingId === category.id}><X className="h-4 w-4 mr-1" />Cancel</Button><Button size="sm" onClick={() => saveCategory(category)} disabled={workingId === category.id}><Check className="h-4 w-4 mr-1" />Save</Button></div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3"><div><p className="font-medium text-foreground"><span className="mr-2">{category.emoji || "🎮"}</span>{category.name}</p><p className="text-xs text-muted-foreground">{category.game_count} {category.game_count === 1 ? "game" : "games"}</p></div><div className="flex gap-2"><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => startEditing(category)}><Pencil className="h-4 w-4" /></Button><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setCategoryToDelete(category)} disabled={workingId === category.id}><Trash2 className="h-4 w-4" /></Button></div></div>
                  )}
                </div>
              );
            })}
            {categories.length === 0 && <div className="rounded-md border border-border p-4 text-sm text-muted-foreground text-center">No categories yet.</div>}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog open={!!categoryToDelete} title={`Delete ${categoryToDelete?.name || "category"}?`} description={categoryToDelete?.game_count ? `This category has ${categoryToDelete.game_count} games. Choose where to move them, or leave them uncategorized.` : "This category has no games. This action cannot be undone."} confirmLabel="Delete" destructive isWorking={!!workingId} onCancel={() => { setCategoryToDelete(null); setMoveTo(""); }} onConfirm={deleteCategory}>
        {categoryToDelete?.game_count ? <div className="space-y-2"><label className="block text-sm font-medium text-foreground">Move games to</label><select value={moveTo} onChange={(event) => setMoveTo(event.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"><option value="">Uncategorized</option>{otherCategories.map((category) => <option key={category.id} value={category.name}>{category.emoji || "🎮"} {category.name}</option>)}</select></div> : null}
      </ConfirmDialog>
    </main>
  );
}

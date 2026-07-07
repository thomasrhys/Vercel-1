"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabaseAuthClient } from "@/lib/supabase-auth";

function splitGames(value: string) {
  return value.split(",").map((game) => game.trim()).filter(Boolean).slice(0, 12);
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error) return String((error as { message?: unknown }).message);
  return "Something went wrong.";
}

export default function ProfileExtrasCard({ userId }: { userId: string }) {
  const [country, setCountry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [favouriteGames, setFavouriteGames] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabaseAuthClient
      .from("user_profiles")
      .select("country, website_url, favourite_games")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setCountry(data?.country || "");
        setWebsiteUrl(data?.website_url || "");
        setFavouriteGames(Array.isArray(data?.favourite_games) ? data.favourite_games.join(", ") : "");
      });
  }, [userId]);

  const saveExtras = async () => {
    setMessage("");
    setSaving(true);

    try {
      const { error } = await supabaseAuthClient.from("user_profiles").upsert({
        user_id: userId,
        country: country.trim() || null,
        website_url: websiteUrl.trim() || null,
        favourite_games: splitGames(favouriteGames),
        updated_at: new Date().toISOString(),
      });

      if (error) return setMessage(errorMessage(error));
      setMessage("Profile extras saved.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile extras</CardTitle>
        <CardDescription>Add optional public profile details. Recently played games are not tracked.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Country" />
        <Input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="Website URL" />
        <textarea value={favouriteGames} onChange={(event) => setFavouriteGames(event.target.value)} placeholder="Favourite games, separated by commas" className="w-full min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
        {message && <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</div>}
        <Button className="w-full" onClick={saveExtras} disabled={saving}>{saving ? "Saving..." : "Save profile extras"}</Button>
      </CardContent>
    </Card>
  );
}

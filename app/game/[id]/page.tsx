import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import GamePageClient from "./GamePageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://requests.fnfaw.es";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type GameMetadataRow = {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
};

function titleFromId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function getGameForMetadata(id: string): Promise<GameMetadataRow | null> {
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from("games")
    .select("id,title,description,image")
    .eq("id", id)
    .eq("hidden", false)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameForMetadata(id);
  const fallbackTitle = titleFromId(id) || "Game";
  const gameTitle = game?.title || fallbackTitle;
  const title = `${gameTitle} | Game Portal`;
  const description = game?.description?.trim() || `Play ${gameTitle} online for free on Game Portal.`;
  const url = `${siteUrl}/game/${id}`;
  const images = game?.image ? [{ url: game.image, alt: gameTitle }] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Game Portal",
      type: "website",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: game?.image ? [game.image] : undefined,
    },
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GamePageClient id={id} />;
}

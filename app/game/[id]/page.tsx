import type { Metadata } from "next";
import GamePageClient from "./GamePageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://requests.fnfaw.es";

type GameMetadataRow = {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
};

async function getGameForMetadata(id: string): Promise<GameMetadataRow | null> {
  try {
    const response = await fetch(`${siteUrl}/api/games`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const games = await response.json();
    if (!Array.isArray(games)) return null;

    return games.find((game) => game.id === id) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameForMetadata(id);

  if (!game) {
    return {
      title: "Game Not Found | Game Portal",
      description: "This game could not be found on Game Portal.",
    };
  }

  const title = `${game.title} | Game Portal`;
  const description = game.description?.trim() || `Play ${game.title} online for free on Game Portal.`;
  const url = `${siteUrl}/game/${game.id}`;
  const images = game.image ? [{ url: game.image, alt: game.title }] : undefined;

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
      images: game.image ? [game.image] : undefined,
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

import type { Metadata } from "next";
import GamePageClient from "./GamePageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://requests.fnfaw.es";

function titleFromId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fallbackTitle = titleFromId(id) || "Game";
  const title = `${fallbackTitle} | Game Portal`;
  const description = `Play ${fallbackTitle} online for free on Game Portal.`;
  const url = `${siteUrl}/game/${id}`;

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
    },
    twitter: {
      card: "summary",
      title,
      description,
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

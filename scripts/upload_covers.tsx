// scripts/upload-covers.tsx
//
// Run with: npx tsx scripts/upload-covers.tsx

import { supabaseAuthClient } from "@/lib/supabase-auth";
import { uploadCoverImage, listCoverImages } from "@/lib/r2-client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID!;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
  console.error("Missing one or more required env vars. Check NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type GameRow = {
  id: string;
  title: string;
};

type IGDBGame = {
  id: number;
  name: string;
  cover?: { id: number; image_id: string };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "cover";
}

async function getIgdbToken(): Promise<string> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );

  if (!res.ok) {
    throw new Error(`Failed to get IGDB token: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function searchIgdbGame(title: string, token: string): Promise<IGDBGame | null> {
  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: `search "${title.replace(/"/g, '\\"')}"; fields name,cover.image_id; limit 1;`,
  });

  if (!res.ok) {
    console.error(`  IGDB search failed for "${title}": ${res.status} ${await res.text()}`);
    return null;
  }

  const results: IGDBGame[] = await res.json();
  return results[0] ?? null;
}

function igdbCoverUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

async function run() {
  console.log("Fetching games from Supabase...");
  const { data: games, error } = await supabase
    .from("games")
    .select("id, title")
    .returns<GameRow[]>();

  if (error) throw error;
  if (!games) throw new Error("No games returned from Supabase.");

  console.log(`Found ${games.length} games.`);

  console.log("Checking R2 for existing covers...");
  const existingObjects = await listCoverImages("covers/");

  // Keys look like: covers/{id}_{timestamp}_{originalfilename}.{ext}
  // Extract just the {id} portion (everything before the first underscore)
  const existingIds = new Set(
    existingObjects
      .map((obj) => obj.Key)
      .filter(Boolean)
      .map((key) => {
        const fileName = key!.split("/").pop()!; // strip "covers/"
        return fileName.split("_")[0]; // everything before first "_"
      })
  );

  const missing = games.filter((game) => !existingIds.has(String(game.id)));
  console.log(`${games.length - missing.length} games already have covers. ${missing.length} need art.`);

  if (missing.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  console.log("Getting IGDB access token...");
  const token = await getIgdbToken();

  const unmatched: string[] = [];
  const failed: string[] = [];
  let uploaded = 0;

  for (let i = 0; i < missing.length; i++) {
    const game = missing[i];
    console.log(`[${i + 1}/${missing.length}] Searching IGDB for "${game.title}"...`);

    try {
      const match = await searchIgdbGame(game.title, token);

      if (!match || !match.cover?.image_id) {
        console.log(`  No IGDB match/cover found for "${game.title}".`);
        unmatched.push(game.title);
        await sleep(260);
        continue;
      }

      const imageUrl = igdbCoverUrl(match.cover.image_id);
      const imageRes = await fetch(imageUrl);

      if (!imageRes.ok) {
        console.log(`  Failed to download cover image for "${game.title}": ${imageRes.status}`);
        failed.push(game.title);
        await sleep(260);
        continue;
      }

      const blob = await imageRes.blob();
      const timestamp = Date.now();
      const safeTitle = sanitizeFilename(game.title);
      const key = `covers/${game.id}_${timestamp}_${safeTitle}.jpg`;
      const file = new File([blob], `${safeTitle}.jpg`, { type: "image/jpeg" });

      const publicUrl = await uploadCoverImage(key, file);
      console.log(`  Uploaded: ${publicUrl}`);
      uploaded++;
    } catch (err) {
      console.error(`  Error processing "${game.title}":`, err);
      failed.push(game.title);
    }

    await sleep(260);
  }

  console.log("\n--- Done ---");
  console.log(`Uploaded: ${uploaded}`);
  console.log(`No IGDB match: ${unmatched.length}`);
  console.log(`Failed (network/upload errors): ${failed.length}`);

  if (unmatched.length > 0) {
    console.log("\nTitles with no IGDB match (source these manually):");
    unmatched.forEach((title) => console.log(`  - ${title}`));
  }

  if (failed.length > 0) {
    console.log("\nTitles that errored out (worth re-running):");
    failed.forEach((title) => console.log(`  - ${title}`));
  }
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});

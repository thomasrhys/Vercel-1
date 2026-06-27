import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireAdmin() {
  const { userId } = await auth();
  return !!userId && ADMIN_USER_IDS.includes(userId);
}

async function checkGame(game: { id: string; title: string; url: string }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(game.url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });

    return {
      id: game.id,
      title: game.title,
      url: game.url,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    return {
      id: game.id,
      title: game.title,
      url: game.url,
      ok: false,
      status: 0,
      statusText: error instanceof Error ? error.message : "Failed to check",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: games, error } = await supabase
    .from("games")
    .select("id,title,url")
    .order("title", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const game of games || []) {
    results.push(await checkGame(game));
  }

  await supabase.from("activity_log").insert({
    action: "games_checked",
    details: `Checked ${results.length} games`,
  });

  return Response.json({ success: true, results });
}

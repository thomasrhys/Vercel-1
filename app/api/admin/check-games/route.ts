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

async function fetchWithTimeout(url: string, method: "HEAD" | "GET") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    return await fetch(url, {
      method,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "GamePortal-LinkChecker/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkGame(game: { id: string; title: string; url: string }) {
  try {
    let response = await fetchWithTimeout(game.url, "HEAD");
    let checkedWith: "HEAD" | "GET" = "HEAD";

    if ([405, 403, 404, 0].includes(response.status)) {
      response = await fetchWithTimeout(game.url, "GET");
      checkedWith = "GET";
    }

    const xFrameOptions = response.headers.get("x-frame-options");
    const contentSecurityPolicy = response.headers.get("content-security-policy");
    const blocksIframe =
      !!xFrameOptions ||
      !!contentSecurityPolicy?.toLowerCase().includes("frame-ancestors 'none'");

    return {
      id: game.id,
      title: game.title,
      url: game.url,
      ok: response.ok && !blocksIframe,
      status: response.status,
      statusText: blocksIframe
        ? "May block iframe embedding"
        : response.statusText || `Checked with ${checkedWith}`,
      checkedWith,
      blocksIframe,
    };
  } catch (error) {
    return {
      id: game.id,
      title: game.title,
      url: game.url,
      ok: false,
      status: 0,
      statusText: error instanceof Error ? error.message : "Failed to check",
      checkedWith: "GET",
      blocksIframe: false,
    };
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
    details: `Checked ${results.length} games; ${results.filter((result) => !result.ok).length} possible issues`,
  });

  return Response.json({ success: true, results });
}

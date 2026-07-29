import { createClient } from "@supabase/supabase-js";
import { getSupabaseUserId } from "@/lib/supabase-server-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function GET(request: Request) {
  const userId = await getSupabaseUserId(request);

  if (!userId) {
    return Response.json({ recent: [] });
  }

  const { data, error } = await supabase
    .from("recently_played")
    .select("game_id, play_count, last_played")
    .eq("user_id", userId)
    .order("last_played", { ascending: false })
    .limit(12);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ recent: data || [] });
}

export async function POST(request: Request) {
  const userId = await getSupabaseUserId(request);

  if (!userId) {
    return Response.json({ ok: true });
  }

  const { gameId } = await request.json();

  if (!gameId || typeof gameId !== "string") {
    return Response.json({ error: "gameId is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("recently_played")
    .select("play_count")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .maybeSingle();

  const { error } = await supabase
    .from("recently_played")
    .upsert(
      {
        user_id: userId,
        game_id: gameId,
        play_count: (existing?.play_count || 0) + 1,
        last_played: new Date().toISOString(),
      },
      { onConflict: "user_id,game_id" }
    );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

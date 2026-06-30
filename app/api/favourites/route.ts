import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

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

async function getUserId() {
  const authResult = await auth();
  return authResult.userId;
}

export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return Response.json({ favourites: [] });
  }

  const { data, error } = await supabase
    .from("player_favourites")
    .select("game_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ favourites: data.map((item) => item.game_id) });
}

export async function POST(request: Request) {
  const userId = await getUserId();

  if (!userId) {
    return Response.json({ error: "Sign in to favourite games" }, { status: 401 });
  }

  const { gameId } = await request.json();

  if (!gameId || typeof gameId !== "string") {
    return Response.json({ error: "gameId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("player_favourites")
    .upsert({ user_id: userId, game_id: gameId }, { onConflict: "user_id,game_id" });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ message: "Added to favourites", gameId });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();

  if (!userId) {
    return Response.json({ error: "Sign in to manage favourites" }, { status: 401 });
  }

  const { gameId } = await request.json();

  if (!gameId || typeof gameId !== "string") {
    return Response.json({ error: "gameId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("player_favourites")
    .delete()
    .eq("user_id", userId)
    .eq("game_id", gameId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ message: "Removed from favourites", gameId });
}

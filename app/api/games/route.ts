import { createClient } from "@supabase/supabase-js";
import { normalizeGameUrl } from "@/lib/game-url";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("hidden", false)
    .order("featured", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(
    (data || []).map((game) => ({
      ...game,
      url: normalizeGameUrl(game.url),
    }))
  );
}

// app/api/admin/import-games/route.ts
// Auth migration: Clerk → Supabase role-based (via requireSupabaseAdmin)

import { requireSupabaseAdmin } from "@/lib/supabase-server-auth";
import { createClient } from "@supabase/supabase-js";
import { games } from "@/lib/games";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  if (!(await requireSupabaseAdmin(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = games.map((game) => ({
    id: game.id,
    title: game.title,
    url: game.url,
    image: game.image ?? null,
    category: null,
    featured: false,
    hidden: false,
  }));

  const { error } = await supabase.from("games").upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    action: "games_imported",
    details: `Imported ${rows.length} games`,
  });

  return Response.json({
    success: true,
    imported: rows.length,
    message: `Imported ${rows.length} games`,
  });
}

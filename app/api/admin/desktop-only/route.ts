// app/api/admin/desktop-only/route.ts
// Auth migration: Clerk → Supabase role-based (via requireSupabaseAdmin)

import { requireSupabaseAdmin } from "@/lib/supabase-server-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: Request) {
  if (!(await requireSupabaseAdmin(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id || "").trim();

  if (!id) {
    return Response.json({ error: "Game ID is required" }, { status: 400 });
  }

  const desktopOnly = body.desktop_only === true;

  const { data, error } = await supabase
    .from("games")
    .update({ desktop_only: desktopOnly })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    action: "desktop_only_updated",
    details: desktopOnly
      ? `${data.title} marked desktop only`
      : `${data.title} allowed on mobile`,
  });

  return Response.json({
    success: true,
    game: data,
    message: `Updated ${data.title}`,
  });
}

import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdmin } from "@/lib/supabase-server-auth";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Missing Supabase environment variables");
  return createClient(url, key);
}

export async function GET(request: Request) {
  if (!(await requireSupabaseAdmin(request))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await getSupabase()
    .from("game_requests")
    .select("*")
    .order("status", { ascending: true })
    .order("request_count", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PATCH(request: Request) {
  if (!(await requireSupabaseAdmin(request))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const id = String(body.id || "").trim();
  const status = String(body.status || "").trim();

  if (!id) return Response.json({ error: "Request ID is required" }, { status: 400 });
  if (!status || !["open", "completed"].includes(status)) return Response.json({ error: "Valid status is required" }, { status: 400 });

  const { data, error } = await getSupabase().from("game_requests").update({ status }).eq("id", id).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, request: data });
}

export async function DELETE(request: Request) {
  if (!(await requireSupabaseAdmin(request))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const id = String(body.id || "").trim();

  if (!id) return Response.json({ error: "Request ID is required" }, { status: 400 });

  const { error } = await getSupabase().from("game_requests").delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

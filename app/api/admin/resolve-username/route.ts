import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdmin } from "@/lib/supabase-server-auth";

function cleanUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

export async function POST(request: Request) {
  if (!(await requireSupabaseAdmin(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const username = cleanUsername(String(body.username || ""));

  if (!username) {
    return Response.json({ error: "Username is required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !key) {
    return Response.json({ error: "Supabase server env vars are missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const profile = await supabase
    .from("user_profiles")
    .select("user_id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (profile.error) {
    return Response.json({ error: profile.error.message || "Could not look up username" }, { status: 500 });
  }

  if (!profile.data?.user_id) {
    return Response.json({ error: `No user found for ${username}` }, { status: 404 });
  }

  return Response.json({
    success: true,
    userId: profile.data.user_id,
    username: profile.data.username,
    displayName: profile.data.display_name || null,
  });
}

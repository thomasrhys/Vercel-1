import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdmin } from "@/lib/supabase-server-auth";

export async function POST(request: Request) {
  if (!(await requireSupabaseAdmin(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return Response.json({ error: "A valid email address is required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !key) {
    return Response.json({ error: "Supabase server env vars are missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
  });

  if (error) {
    return Response.json({ error: error.message || "Could not generate verification link" }, { status: 500 });
  }

  return Response.json({
    success: true,
    message: `Verification link generated for ${email}`,
    link: data.properties?.action_link || null,
  });
}

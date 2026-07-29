import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdmin } from "@/lib/supabase-server-auth";

export async function POST(request: Request) {
  if (!(await requireSupabaseAdmin(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const userId = String(body.userId || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!userId) return Response.json({ error: "User ID is required" }, { status: 400 });
  if (!password || password.length < 6) return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !key) {
    return Response.json({ error: "Supabase server env vars are missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const user = await supabase.auth.admin.getUserById(userId);
  if (user.error || !user.data.user) {
    return Response.json({ error: user.error?.message || "User not found" }, { status: 404 });
  }

  const existingEmail = user.data.user.email || "";

  if (existingEmail) {
    const update = await supabase.auth.admin.updateUserById(userId, { password });
    if (update.error) {
      return Response.json({ error: update.error.message || "Could not update password" }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: `Password updated for ${existingEmail}`,
      link: null,
    });
  }

  if (!email || !email.includes("@")) {
    return Response.json({ error: "This user has no email. Enter a valid email address to add one." }, { status: 400 });
  }

  const update = await supabase.auth.admin.updateUserById(userId, {
    email,
    password,
    email_confirm: false,
  });

  if (update.error) {
    return Response.json({ error: update.error.message || "Could not add email/password" }, { status: 500 });
  }

  const link = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
  });

  if (link.error) {
    return Response.json({ error: link.error.message || "Email/password added, but could not generate verification link" }, { status: 500 });
  }

  return Response.json({
    success: true,
    message: `Email/password added for ${email}`,
    link: link.data.properties?.action_link || null,
  });
}

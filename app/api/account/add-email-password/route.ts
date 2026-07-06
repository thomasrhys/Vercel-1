import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function readableError(error: unknown) {
  if (error instanceof Error && error.message && error.message !== "{}") return error.message;
  if (typeof error === "string" && error && error !== "{}") return error;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; error_description?: unknown; error?: unknown; code?: unknown; status?: unknown; name?: unknown };
    if (typeof value.message === "string" && value.message && value.message !== "{}") return value.message;
    if (typeof value.error_description === "string" && value.error_description) return value.error_description;
    if (typeof value.error === "string" && value.error) return value.error;
    if (typeof value.code === "string" && value.code) return value.code;
    if (typeof value.name === "string" && value.name) return value.name;
    if (value.status) return `Request failed with status ${String(value.status)}`;
  }
  return "Supabase returned an empty error.";
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase server environment variables are missing." }, { status: 500 });
  }

  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ error: "Missing signed-in session." }, { status: 401 });

  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!password || password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: current, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !current.user) return NextResponse.json({ error: readableError(userError) }, { status: 401 });

  if (current.user.email) return NextResponse.json({ error: "This account already has an email address." }, { status: 400 });

  const { error: updateError } = await adminClient.auth.admin.updateUserById(current.user.id, {
    email,
    password,
    email_confirm: false,
  });

  if (updateError) return NextResponse.json({ error: readableError(updateError) }, { status: 400 });

  return NextResponse.json({ message: "Email/password added. Verification email sending is temporarily disabled while this flow is being tested." });
}

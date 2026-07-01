import { createClient, type User } from "@supabase/supabase-js";

const DEFAULT_ADMIN_EMAILS = "pitstopyt1@gmail.com,thomasrhyshughes29@gmail.com";

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

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getSupabaseUser(request: Request): Promise<User | null> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user || null;
}

export async function getSupabaseUserId(request: Request) {
  const user = await getSupabaseUser(request);
  return user?.id || null;
}

export async function requireSupabaseAdmin(request: Request) {
  const user = await getSupabaseUser(request);
  const email = user?.email?.toLowerCase() || "";
  return !!user && !!email && getAdminEmails().includes(email);
}

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const LEGACY_ADMIN_USER_ID = "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR";
const DEFAULT_ADMIN_EMAILS = "pitstopyt1@gmail.com,thomasrhyshughes29@gmail.com";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function isAdminEmail(email?: string) {
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return !!email && adminEmails.includes(email.toLowerCase());
}

export async function auth() {
  const store = await headers();
  const value = store.get("authorization") || "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : "";

  if (!token) return { userId: null };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { userId: null };

  return { userId: isAdminEmail(data.user.email) ? LEGACY_ADMIN_USER_ID : data.user.id };
}

export const clerkMiddleware = () => undefined;
export const createRouteMatcher = () => () => false;

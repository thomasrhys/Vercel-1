import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function auth() {
  const store = await headers();
  const value = store.get("authorization") || "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : "";

  if (!token) return { userId: null };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { userId: null };

  return { userId: data.user.id };
}

export const clerkMiddleware = () => undefined;
export const createRouteMatcher = () => () => false;

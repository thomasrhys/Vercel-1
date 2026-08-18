// lib/supabase-server-auth.ts
// Updated: Now checks user_profiles.role instead of hardcoded emails

import { createClient, type User } from "@supabase/supabase-js";

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
  
  if (!user?.id) return false;

  // Check role from user_profiles table (consistent with client components)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return profile?.role === "owner" || profile?.role === "admin";
}

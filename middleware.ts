// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const RESERVED = new Set([
  "login",
  "account",
  "api",
  "_next",
  "favicon.ico",
]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Ignore non-profile routes
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length !== 1) {
    return NextResponse.next();
  }

  const username = parts[0].toLowerCase();

  if (RESERVED.has(username)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("sb-access-token")?.value;

  if (!accessToken) {
    return NextResponse.next();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.next();
  }

  // Find profile owner
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id")
    .ilike("username", username)
    .maybeSingle();

  if (!profile) {
    return NextResponse.next();
  }

  // Don't block yourself
  if (profile.user_id === user.id) {
    return NextResponse.next();
  }

  // Check blocks
  const { data: block } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", profile.user_id)
    .eq("blocked_id", user.id)
    .maybeSingle();

  if (block) {
    const url = request.nextUrl.clone();
    url.pathname = "/500";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};

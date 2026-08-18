// app/[username]/page.tsx
import { notFound } from "next/navigation";
import { createServerSupabase } from '@/lib/supabase-server';  // ← Add this import
import FriendSection from "@/components/FriendSection";
import FriendsList from "@/components/FriendsList";
import BlockSection from "@/components/BlockSection";

export const dynamic = "force-dynamic";

// REMOVE the old getServerSupabase function

function normalizeWebsite(value?: string | null) {
  if (!value) return "";
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const handle = username.trim().toLowerCase().replace(/^@+/, "");

  if (!/^[a-z0-9_]{3,20}$/.test(handle)) notFound();

  const supabase = await createServerSupabase();  // ← Use SSR client

  const full = await supabase
    .from("user_profiles")
    .select("user_id, display_name, username, avatar_url, bio, role, is_public, country, website_url, favourite_games, friends_visible")
    .ilike("username", handle)
    .maybeSingle();

  const fallback = full.error
    ? await supabase
        .from("user_profiles")
        .select("user_id, display_name, username, avatar_url, bio, role, is_public")
        .ilike("username", handle)
        .maybeSingle()
    : full;

  const profile = fallback.data;

  if (!profile?.username || profile.is_public === false) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

  console.log('[Profile Page] Current User ID:', currentUserId);
  console.log('[Profile Page] Profile User ID:', profile.user_id);
  console.log('[Profile Page] Full user data:', user);

  // CHECK IF PROFILE OWNER BLOCKED CURRENT USER
  if (currentUserId && currentUserId !== profile.user_id) {
    console.log('[Profile Page] Checking if profile owner blocked current user...');
    
    const blockCheck = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', profile.user_id)
      .eq('blocked_id', currentUserId)
      .maybeSingle();
    
    console.log('[Profile Page] Block check result:', blockCheck);
    
    if (blockCheck.data) {
      console.log('[Profile Page] USER IS BLOCKED - Throwing error');
      throw new Error('BLOCKED_FROM_VIEWING');
    }
    
    console.log('[Profile Page] User is NOT blocked');
  }
  // ... rest of your component stays the same

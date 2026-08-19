// app/[username]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from '@/lib/supabase-server';
import FriendSection from "@/components/FriendSection";
import FriendsList from "@/components/FriendsList";
import BlockSection from "@/components/BlockSection";

export const dynamic = "force-dynamic";

function getDataClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { 
      auth: { 
        persistSession: false, 
        autoRefreshToken: false 
      } 
    }
  );
}

async function getAuthClient() {
  return await createServerSupabase();
}

function normalizeWebsite(value?: string | null) {
  if (!value) return "";
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const handle = username.trim().toLowerCase().replace(/^@+/, "");

  if (!/^[a-z0-9_]{3,20}$/.test(handle)) notFound();

  const dataClient = getDataClient();
  const authClient = await getAuthClient();

  const full = await dataClient
    .from("user_profiles")
    .select("user_id, display_name, username, avatar_url, bio, role, is_public, country, website_url, favourite_games, friends_visible, accent_colour")
    .ilike("username", handle)
    .maybeSingle();

  const fallback = full.error
    ? await dataClient
        .from("user_profiles")
        .select("user_id, display_name, username, avatar_url, bio, role, is_public, accent_colour")
        .ilike("username", handle)
        .maybeSingle()
    : full;

  const profile = fallback.data;

  if (!profile?.username || profile.is_public === false) notFound();

  const { data: { user } } = await authClient.auth.getUser();
  const currentUserId = user?.id || null;

  if (currentUserId && currentUserId !== profile.user_id) {
    const blockCheck = await dataClient
      .from('blocks')
      .select('id')
      .eq('blocker_id', profile.user_id)
      .eq('blocked_id', currentUserId)
      .maybeSingle();
    
    if (blockCheck.data) {
      throw new Error('BLOCKED_FROM_VIEWING');
    }
  }

  const displayName = profile.display_name || "Unnamed player";
  const country = "country" in profile ? profile.country : "";
  const websiteUrl = "website_url" in profile ? profile.website_url : "";
  const favouriteGames = "favourite_games" in profile && Array.isArray(profile.favourite_games) ? profile.favourite_games.filter(Boolean).slice(0, 12) : [];
  const website = normalizeWebsite(websiteUrl);

  const accentColourMap: Record<string, string> = {
    purple: '#6d4aff',
    blue: '#3b82f6',
    green: '#22c55e',
    pink: '#ec4899',
    orange: '#f97316',
    red: '#ef4444',
    white: '#ffffff',
    black: '#000000',
  };

  const accentHex = profile.accent_colour === 'system' || !profile.accent_colour
    ? null
    : accentColourMap[profile.accent_colour] || null;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      {profile.accent_colour && (
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var colourMap = {
                purple: '#6d4aff',
                blue: '#3b82f6',
                green: '#22c55e',
                pink: '#ec4899',
                orange: '#f97316',
                red: '#ef4444',
                white: '#ffffff',
                black: '#000000'
              };
              var accent = '${profile.accent_colour}';
              var hex = colourMap[accent];
              if (accent === 'system') {
                hex = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000';
              }
              if (hex) document.documentElement.style.setProperty('--accent', hex);
            })();
          `
        }} />
      )}
      <div className="max-w-xl mx-auto rounded-lg border border-border bg-card p-6 text-center space-y-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="Profile avatar" className="h-24 w-24 rounded-full object-cover mx-auto border-2" style={accentHex ? { borderColor: accentHex } : undefined} />
        ) : (
          <div className="h-24 w-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white" style={accentHex ? { backgroundColor: accentHex } : { backgroundColor: 'var(--primary)' }}>
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={accentHex ? { color: accentHex } : undefined}>{displayName}</h1>
          <p className="text-muted-foreground">/{profile.username}</p>
          {profile.role === "owner" && <p className="mt-2 text-sm font-medium text-purple-700">Owner</p>}
        </div>

        <div className="flex justify-center gap-4 py-4">
          <FriendSection targetUserId={profile.user_id} />
        </div>

        <p className="rounded-md bg-muted p-4 text-sm text-foreground">{profile.bio || "This player has not added a bio yet."}</p>

        <FriendsList userId={profile.user_id} currentUserId={currentUserId} friendsVisible={profile.friends_visible ?? false} />

        <BlockSection 
          targetUserId={profile.user_id} 
          targetUsername={profile.username} 
        />

        {(country || website) && (
          <div className="rounded-md border border-border p-4 text-sm space-y-2">
            {country && <p><span className="font-medium">Country:</span> {country}</p>}
            {website && <p><span className="font-medium">Website:</span> <a className="underline" href={website} rel="noreferrer" target="_blank">{websiteUrl}</a></p>}
          </div>
        )}

        {favouriteGames.length > 0 && (
          <div className="rounded-md border border-border p-4 text-left space-y-3">
            <h2 className="font-semibold text-foreground text-center">Favourite games</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {favouriteGames.map((game) => <span key={game} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">{game}</span>)}
            </div>
          </div>
        )}

        <a href="/" className="inline-block rounded-md border border-border px-4 py-2 text-sm">Back to Games</a>
      </div>
    </main>
  );
}

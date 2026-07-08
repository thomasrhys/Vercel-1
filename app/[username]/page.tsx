import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function normalizeWebsite(value?: string | null) {
  if (!value) return "";
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const handle = username.trim().toLowerCase().replace(/^@+/, "");

  if (!/^[a-z0-9_]{3,20}$/.test(handle)) notFound();

  const full = await supabase
    .from("user_profiles")
    .select("display_name, username, avatar_url, bio, role, is_public, country, website_url, favourite_games")
    .ilike("username", handle)
    .maybeSingle();

  const fallback = full.error
    ? await supabase
        .from("user_profiles")
        .select("display_name, username, avatar_url, bio, role, is_public")
        .ilike("username", handle)
        .maybeSingle()
    : full;

  const profile = fallback.data;

  if (!profile?.username || profile.is_public === false) notFound();

  const displayName = profile.display_name || "Unnamed player";
  const country = "country" in profile ? profile.country : "";
  const websiteUrl = "website_url" in profile ? profile.website_url : "";
  const favouriteGames = "favourite_games" in profile && Array.isArray(profile.favourite_games) ? profile.favourite_games.filter(Boolean).slice(0, 12) : [];
  const website = normalizeWebsite(websiteUrl);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-xl mx-auto rounded-lg border border-border bg-card p-6 text-center space-y-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="Profile avatar" className="h-24 w-24 rounded-full object-cover mx-auto border border-border" />
        ) : (
          <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center text-3xl font-bold">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
          <p className="text-muted-foreground">/{profile.username}</p>
          {profile.role === "owner" && <p className="mt-2 text-sm font-medium text-purple-700">Owner</p>}
        </div>
        <p className="rounded-md bg-muted p-4 text-sm text-foreground">{profile.bio || "This player has not added a bio yet."}</p>
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

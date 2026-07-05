import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const handle = username.trim().toLowerCase().replace(/^@+/, "");

  if (!/^[a-z0-9_]{3,20}$/.test(handle)) notFound();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, username, avatar_url, bio, role")
    .ilike("username", handle)
    .maybeSingle();

  if (!profile?.username) notFound();

  const displayName = profile.display_name || "Unnamed player";

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
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.role === "owner" && <p className="mt-2 text-sm font-medium text-purple-700">Owner</p>}
        </div>
        <p className="rounded-md bg-muted p-4 text-sm text-foreground">{profile.bio || "This player has not added a bio yet."}</p>
        <a href="/" className="inline-block rounded-md border border-border px-4 py-2 text-sm">Back to Games</a>
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

type Profile = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  created_at: string | null;
};

function cleanUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

function formatJoined(value: string | null) {
  if (!value) return "Joined recently";
  return `Joined ${new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(value))}`;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const handle = cleanUsername(username);

  const { data } = await supabase
    .from("user_profiles")
    .select("display_name, username, role")
    .ilike("username", handle)
    .maybeSingle<Pick<Profile, "display_name" | "username" | "role">>();

  if (!data?.username) return { title: "Profile not found | Games Portal" };

  return {
    title: `${data.display_name || `@${data.username}`} | Games Portal`,
    description: data.role === "owner" ? "Owner profile on Games Portal." : `View @${data.username} on Games Portal.`,
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const handle = cleanUsername(username);

  if (!/^[a-z0-9_]{3,20}$/.test(handle)) notFound();

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, username, avatar_url, bio, role, created_at")
    .ilike("username", handle)
    .maybeSingle<Profile>();

  if (error || !profile?.username) notFound();

  const displayName = profile.display_name || "Unnamed player";
  const isOwner = profile.role === "owner";

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-primary/30 via-primary/10 to-background" />
          <CardHeader className="-mt-12 flex flex-col items-center text-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${displayName} avatar`}
                className="h-24 w-24 rounded-full border-4 border-background object-cover bg-muted"
              />
            ) : (
              <div className="h-24 w-24 rounded-full border-4 border-background bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="space-y-2">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                {displayName}
                {isOwner && <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-700">Owner</span>}
              </CardTitle>
              <CardDescription className="text-base">@{profile.username}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 text-center">
            <p className="text-sm text-muted-foreground">{formatJoined(profile.created_at)}</p>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground min-h-16 flex items-center justify-center">
              {profile.bio?.trim() || "This player has not added a bio yet."}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild>
                <a href="/">Back to Games</a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/account`}>Manage my account</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

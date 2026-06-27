import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireAdmin() {
  const { userId } = await auth();
  return !!userId && ADMIN_USER_IDS.includes(userId);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("site_backups")
    .select("id,created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}

export async function POST() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [gamesResult, requestsResult, settingsResult] = await Promise.all([
    supabase.from("games").select("*"),
    supabase.from("game_requests").select("*"),
    supabase.from("site_settings").select("*"),
  ]);

  const firstError = gamesResult.error || requestsResult.error || settingsResult.error;

  if (firstError) {
    return Response.json({ error: firstError.message }, { status: 500 });
  }

  const backupData = {
    created_at: new Date().toISOString(),
    games: gamesResult.data || [],
    game_requests: requestsResult.data || [],
    site_settings: settingsResult.data || [],
  };

  const { data, error } = await supabase
    .from("site_backups")
    .insert({ backup_data: backupData })
    .select("id,created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    action: "backup_created",
    details: "Created manual backup",
  });

  return Response.json({ success: true, backup: data, message: "Backup created" });
}

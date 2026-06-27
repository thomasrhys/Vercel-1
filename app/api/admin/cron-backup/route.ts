import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
    type: "scheduled",
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
    action: "scheduled_backup_created",
    details: "Created scheduled backup",
  });

  return Response.json({ success: true, backup: data });
}

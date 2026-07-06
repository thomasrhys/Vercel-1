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
    .from("site_settings")
    .select("key,value")
    .order("key", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const settings = Object.fromEntries((data || []).map((item) => [item.key, item.value]));
  return Response.json(settings);
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowedKeys = [
    "site_name",
    "footer_text",
    "general_email",
    "copyright_email",
    "maintenance_mode",
  ];

  const updates = allowedKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(body, key))
    .map((key) => ({ key, value: String(body[key] ?? ""), updated_at: new Date().toISOString() }));

  if (updates.length === 0) {
    return Response.json({ error: "No valid settings supplied" }, { status: 400 });
  }

  const { error } = await supabase.from("site_settings").upsert(updates, { onConflict: "key" });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    action: "settings_updated",
    details: "Updated site settings",
  });

  return Response.json({ success: true, message: "Settings saved" });
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value")
    .in("key", ["site_name", "footer_text", "maintenance_mode"]);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const settings = Object.fromEntries((data || []).map((item) => [item.key, item.value]));

  return Response.json({
    site_name: settings.site_name || "Game Portal",
    footer_text: settings.footer_text || "© 2026 Game Portal",
    maintenance_mode: settings.maintenance_mode === "true",
  });
}

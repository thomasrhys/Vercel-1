import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const gameName = String(body.gameName || "").trim();
    const gameId = String(body.gameId || "").trim();
    const currentUrl = String(body.currentUrl || "").trim();
    const updateType = String(body.updateType || "").trim();
    const details = String(body.details || "").trim();
    const newUrl = String(body.newUrl || "").trim();
    const email = String(body.email || "").trim();

    if (!gameName) return Response.json({ error: "Game name is required" }, { status: 400 });
    if (!updateType) return Response.json({ error: "Update type is required" }, { status: 400 });

    if (gameName.length > 120 || updateType.length > 80 || gameId.length > 120) {
      return Response.json({ error: "Update request details are too long" }, { status: 400 });
    }

    if (currentUrl.length > 500 || newUrl.length > 500 || details.length > 1500 || email.length > 250) {
      return Response.json({ error: "Update request details are too long" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("update_requests")
      .insert({
        game_id: gameId || null,
        game_name: gameName,
        current_url: currentUrl || null,
        update_type: updateType,
        details: details || null,
        new_url: newUrl || null,
        email: email || null,
      })
      .select("*")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, message: "Update request submitted. Thanks!", request: data });
  } catch (error) {
    console.error("[request-update] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Update request failed" },
      { status: 500 }
    );
  }
}

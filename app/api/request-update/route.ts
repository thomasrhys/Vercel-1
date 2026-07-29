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

async function notifyUpdateRequest(request: Record<string, string | null>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REQUEST_EMAIL_FROM;
  const to = process.env.UPDATE_REQUEST_EMAIL_TO || "gameupdates@requests.fnfaw.es";

  if (!apiKey || !from) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Game update request: ${request.game_name}`,
      text: [
        "New game update request",
        "",
        `Reference: ${request.id}`,
        `Game: ${request.game_name}`,
        `Game ID: ${request.game_id || "not provided"}`,
        `Current URL: ${request.current_url || "not provided"}`,
        `Update type: ${request.update_type}`,
        `Suggested URL: ${request.new_url || "not provided"}`,
        `Details: ${request.details || "not provided"}`,
        `User email: ${request.email || "not provided"}`,
      ].join("\n"),
    }),
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

    await notifyUpdateRequest(data).catch((emailError) => {
      console.error("[request-update] Email failed:", emailError);
    });

    return Response.json({ success: true, message: "Update request submitted. Thanks!", request: data });
  } catch (error) {
    console.error("[request-update] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Update request failed" },
      { status: 500 }
    );
  }
}

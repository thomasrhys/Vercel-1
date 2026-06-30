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
    const gameUrl = String(body.gameUrl || "").trim();
    const problemType = String(body.problemType || "").trim();
    const details = String(body.details || "").trim();
    const device = String(body.device || "").trim();
    const email = String(body.email || "").trim();

    if (!gameName) return Response.json({ error: "Game name is required" }, { status: 400 });
    if (!problemType) return Response.json({ error: "Problem type is required" }, { status: 400 });

    if (gameName.length > 120 || problemType.length > 80 || gameId.length > 120) {
      return Response.json({ error: "Report details are too long" }, { status: 400 });
    }

    if (gameUrl.length > 500 || details.length > 1500 || device.length > 250 || email.length > 250) {
      return Response.json({ error: "Report details are too long" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("problem_reports")
      .insert({
        game_id: gameId || null,
        game_name: gameName,
        game_url: gameUrl || null,
        problem_type: problemType,
        details: details || null,
        device: device || null,
        email: email || null,
      })
      .select("*")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, message: "Problem report submitted. Thanks!", report: data });
  } catch (error) {
    console.error("[report-problem] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Problem report failed" },
      { status: 500 }
    );
  }
}

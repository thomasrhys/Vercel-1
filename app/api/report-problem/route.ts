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

async function notifyProblemReport(report: Record<string, string | null>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REQUEST_EMAIL_FROM;
  const to = process.env.PROBLEM_REPORT_EMAIL_TO || "reportproblems@requests.fnfaw.es";

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
      subject: `Problem report: ${report.game_name}`,
      text: [
        "New problem report",
        "",
        `Reference: ${report.id}`,
        `Game: ${report.game_name}`,
        `Game ID: ${report.game_id || "not provided"}`,
        `Game URL: ${report.game_url || "not provided"}`,
        `Problem type: ${report.problem_type}`,
        `Details: ${report.details || "not provided"}`,
        `Device/browser: ${report.device || "not provided"}`,
        `User email: ${report.email || "not provided"}`,
      ].join("\n"),
    }),
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

    await notifyProblemReport(data).catch((emailError) => {
      console.error("[report-problem] Email failed:", emailError);
    });

    return Response.json({ success: true, message: "Problem report submitted. Thanks!", report: data });
  } catch (error) {
    console.error("[report-problem] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Problem report failed" },
      { status: 500 }
    );
  }
}

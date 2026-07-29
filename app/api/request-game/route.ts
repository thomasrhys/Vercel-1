import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key);
}

async function sendRequestEmail({
  gameName,
  gameLink,
  comments,
  requestCount,
}: {
  gameName: string;
  gameLink: string;
  comments: string;
  requestCount: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REQUEST_EMAIL_TO;
  const from = process.env.REQUEST_EMAIL_FROM;

  if (!apiKey || !to || !from) {
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New game request: ${gameName}`,
      text: [
        "New game request",
        "",
        `Game: ${gameName}`,
        `Request count: ${requestCount}`,
        gameLink ? `Link: ${gameLink}` : "Link: not provided",
        comments ? `Comments: ${comments}` : "Comments: not provided",
      ].join("\n"),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const gameName = String(body.gameName || "").trim();
    const gameLink = String(body.gameLink || "").trim();
    const comments = String(body.comments || "").trim();

    if (!gameName) {
      return Response.json({ error: "Game name is required" }, { status: 400 });
    }

    if (gameName.length > 120) {
      return Response.json({ error: "Game name is too long" }, { status: 400 });
    }

    if (gameLink.length > 500 || comments.length > 1000) {
      return Response.json({ error: "Request details are too long" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase.rpc("submit_game_request", {
      p_game_name: gameName,
      p_game_link: gameLink || null,
      p_comments: comments || null,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const savedRequest = Array.isArray(data) ? data[0] : data;

    await sendRequestEmail({
      gameName,
      gameLink,
      comments,
      requestCount: savedRequest?.request_count || 1,
    }).catch((emailError) => {
      console.error("[request-game] Email failed:", emailError);
    });

    return Response.json({
      success: true,
      message: "Request sent. Thanks!",
      request: savedRequest,
    });
  } catch (error) {
    console.error("[request-game] Error:", error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 }
    );
  }
}

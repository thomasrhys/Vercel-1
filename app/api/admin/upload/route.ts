import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { del, list, put } from "@vercel/blob";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ADMIN_USER_IDS.includes(userId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const gameId = formData.get("gameId") as string | null;

    if (!file || !gameId) {
      return Response.json(
        { error: "Missing file or gameId" },
        { status: 400 }
      );
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");

    const existing = await list({
      prefix: `covers/${gameId}__`,
    });

    if (existing.blobs.length > 0) {
      await del(existing.blobs.map((blob) => blob.url));
    }

    const blob = await put(
      `covers/${gameId}__${Date.now()}__${safeFileName}`,
      file,
      {
        access: "public",
      }
    );

    await supabase.from("activity_log").insert({
      action: "cover_uploaded",
      details: `Replaced cover for ${gameId}`,
    });

    return Response.json({
      success: true,
      imageUrl: blob.url,
      message: `Replaced cover for ${gameId}`,
    });
  } catch (error) {
    console.error("[v0] Upload error:", error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

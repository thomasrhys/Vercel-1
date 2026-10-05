// app/api/admin/upload/route.ts
// Auth migration: Clerk → Supabase role-based (via requireSupabaseAdmin)
// Storage migration: Vercel Blob → Cloudflare R2

import { requireSupabaseAdmin } from "@/lib/supabase-server-auth";
import { createClient } from "@supabase/supabase-js";
import {
  deleteCoverImage,
  listCoverImages,
  uploadCoverImage,
} from "@/lib/r2-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    if (!(await requireSupabaseAdmin(request))) {
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

    // List and delete existing covers for this game
    const existing = await listCoverImages(`covers/${gameId}__`);
    for (const obj of existing) {
      if (obj.Key) {
        await deleteCoverImage(obj.Key);
      }
    }

    // Upload new cover
    const key = `covers/${gameId}__${Date.now()}__${safeFileName}`;
    const imageUrl = await uploadCoverImage(key, file);

    await supabase.from("activity_log").insert({
      action: "cover_uploaded",
      details: `Replaced cover for ${gameId}`,
    });

    return Response.json({
      success: true,
      imageUrl,
      message: `Replaced cover for ${gameId}`,
    });
  } catch (error) {
    console.error("[R2] Upload error:", error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

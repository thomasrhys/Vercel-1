import { put } from "@vercel/blob";

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authHeader = request.headers.get("authorization");

    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const gameId = formData.get("gameId") as string | null;

    if (!file || !gameId) {
      return Response.json({ error: "Missing file or gameId" }, { status: 400 });
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");

    const blob = await put(
      `covers/${gameId}__${Date.now()}__${safeFileName}`,
      file,
      {
        access: "public",
      }
    );

    return Response.json({
      success: true,
      imageUrl: blob.url,
      message: `Uploaded cover for ${gameId}`,
    });
  } catch (error) {
    console.error("[v0] Upload error:", error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

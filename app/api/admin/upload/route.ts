import { put, head } from "@vercel/blob";

type CoverMap = Record<string, string>;

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

    const imageBlob = await put(
      `covers/${gameId}-${Date.now()}-${safeFileName}`,
      file,
      {
        access: "public",
      }
    );

    let mappings: CoverMap = {};

    try {
      const mappingBlob = await head("game-images.json");
      const mappingResponse = await fetch(mappingBlob.url);

      if (mappingResponse.ok) {
        mappings = await mappingResponse.json();
      }
    } catch {
      mappings = {};
    }

    mappings[gameId] = imageBlob.url;

    await put("game-images.json", JSON.stringify(mappings, null, 2), {
      access: "public",
      allowOverwrite: true,
      contentType: "application/json",
    });

    return Response.json({
      success: true,
      imageUrl: imageBlob.url,
      message: `Assigned ${file.name} to game ${gameId}`,
    });
  } catch (error) {
    console.error("[v0] Upload error:", error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

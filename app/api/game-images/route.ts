import { list } from "@vercel/blob";

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "covers/" });

    const images: Record<string, string> = {};

    for (const blob of blobs) {
      const filename = blob.pathname.replace("covers/", "");
      const gameId = filename.split("-").slice(0, -2).join("-");
      images[gameId] = blob.url;
    }

    return Response.json(images);
  } catch (error) {
    console.error("[v0] Game images error:", error);
    return Response.json({});
  }
}

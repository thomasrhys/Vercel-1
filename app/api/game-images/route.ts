// app/api/game-images/route.ts
import { listCoverImages } from "@/lib/r2-client";

export async function GET() {
  try {
    const objects = await listCoverImages("covers/");

    const images: Record<string, string> = {};

    for (const obj of objects) {
      if (!obj.Key) continue;

      const filename = obj.Key.replace("covers/", "");
      const gameId = filename.split("__")[0];
      images[gameId] = `${process.env.CLOUDFLARE_BUCKET_URL}/${obj.Key}`;
    }

    return Response.json(images);
  } catch (error) {
    console.error(error);
    return Response.json({});
  }
}

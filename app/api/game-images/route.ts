import { list } from "@vercel/blob";

export async function GET() {
  try {
    const { blobs } = await list({
      prefix: "covers/",
    });

    const images: Record<string, string> = {};

    for (const blob of blobs) {
      const filename = blob.pathname.replace("covers/", "");
      const gameId = filename.split("__")[0];
      images[gameId] = blob.url;
    }

    return Response.json(images);
  } catch (error) {
    console.error(error);
    return Response.json({});
  }
}

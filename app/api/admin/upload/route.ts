import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const gameId = formData.get("gameId") as string;

    if (!file || !gameId) {
      return Response.json({ error: "Missing file or gameId" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const imagesDir = join(process.cwd(), "public", "images");
    
    if (!existsSync(imagesDir)) {
      mkdirSync(imagesDir, { recursive: true });
    }

    const filename = `${gameId}-${Date.now()}${file.name.slice(file.name.lastIndexOf("."))}`;
    const filepath = join(imagesDir, filename);
    
    await writeFile(filepath, Buffer.from(bytes));

    // Update game-images.json
    const mappingsPath = join(process.cwd(), "lib", "game-images.json");
    const mappings = JSON.parse(await readFile(mappingsPath, "utf-8"));
    mappings[gameId] = `/images/${filename}`;
    await writeFile(mappingsPath, JSON.stringify(mappings, null, 2));

    return Response.json({ 
      success: true, 
      imageUrl: `/images/${filename}`,
      message: `Assigned ${file.name} to game ${gameId}`
    });
  } catch (error) {
console.error("[v0] Upload error:", error);
return Response.json(
  { error: error instanceof Error ? error.message : "Upload failed" },
  { status: 500 }
);
  }
}

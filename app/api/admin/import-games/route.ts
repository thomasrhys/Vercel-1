import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { games } from "@/lib/games";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const { userId } = await auth();

  if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = games.map((game) => ({
    id: game.id,
    title: game.title,
    url: game.url,
    image: game.image ?? null,
    category: null,
    featured: false,
    hidden: false,
  }));

  const { error } = await supabase.from("games").upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    imported: rows.length,
    message: `Imported ${rows.length} games`,
  });
}
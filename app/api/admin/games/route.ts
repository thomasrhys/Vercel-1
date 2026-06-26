import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function makeId(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();
  const category = String(body.category || "").trim() || null;
  const id = String(body.id || makeId(title)).trim();

  if (!title || !url || !id) {
    return Response.json(
      { error: "Title, URL, and ID are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("games")
    .insert({
      id,
      title,
      url,
      image: null,
      category,
      featured: false,
      hidden: false,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    game: data,
    message: `Added ${title}`,
  });
}

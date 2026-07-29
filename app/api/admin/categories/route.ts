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

async function requireAdmin() {
  const { userId } = await auth();
  return !!userId && ADMIN_USER_IDS.includes(userId);
}

async function logActivity(action: string, details: string) {
  await supabase.from("activity_log").insert({ action, details });
}

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("category");

  if (gamesError) {
    return Response.json({ error: gamesError.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const game of games || []) {
    const category = String(game.category || "").trim();
    if (category) counts.set(category, (counts.get(category) || 0) + 1);
  }

  return Response.json(
    (categories || []).map((category) => ({
      ...category,
      game_count: counts.get(category.name) || 0,
    }))
  );
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const emoji = String(body.emoji || "🎮").trim() || "🎮";

  if (!name) {
    return Response.json({ error: "Category name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, emoji })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await logActivity("category_added", `Added category ${name}`);

  return Response.json({ success: true, category: data, message: `Added ${name}` });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim();
  const emoji = String(body.emoji || "🎮").trim() || "🎮";

  if (!id || !name) {
    return Response.json({ error: "Category ID and name are required" }, { status: 400 });
  }

  const { data: oldCategory, error: oldError } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .single();

  if (oldError) {
    return Response.json({ error: oldError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("categories")
    .update({ name, emoji, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (oldCategory.name !== name) {
    await supabase
      .from("games")
      .update({ category: name })
      .eq("category", oldCategory.name);
  }

  await logActivity("category_updated", `Updated category ${oldCategory.name} to ${name}`);

  return Response.json({ success: true, category: data, message: `Updated ${name}` });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id || "").trim();
  const moveTo = String(body.moveTo || "").trim() || null;

  if (!id) {
    return Response.json({ error: "Category ID is required" }, { status: 400 });
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .single();

  if (categoryError) {
    return Response.json({ error: categoryError.message }, { status: 500 });
  }

  await supabase
    .from("games")
    .update({ category: moveTo })
    .eq("category", category.name);

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await logActivity(
    "category_deleted",
    moveTo ? `Deleted category ${category.name}; moved games to ${moveTo}` : `Deleted category ${category.name}; uncategorized games`
  );

  return Response.json({ success: true, message: `Deleted ${category.name}` });
}

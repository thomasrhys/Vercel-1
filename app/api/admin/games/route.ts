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

async function requireAdmin() {
  const { userId } = await auth();

  if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    return false;
  }

  return true;
}

async function logActivity(action: string, details: string) {
  await supabase.from("activity_log").insert({ action, details });
}

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();
  const category = String(body.category || "").trim() || null;
  const description = String(body.description || "").trim() || null;
  const id = String(body.id || makeId(title)).trim();

  if (!title || !url || !id) {
    return Response.json(
      { error: "Title, URL, and ID are required" },
      { status: 400 }
    );
  }

  const { data: existingGame, error: duplicateError } = await supabase
    .from("games")
    .select("id,title")
    .or(`id.eq.${id},title.ilike.${title}`)
    .maybeSingle();

  if (duplicateError) {
    return Response.json({ error: duplicateError.message }, { status: 500 });
  }

  if (existingGame) {
    return Response.json(
      { error: `A game called "${existingGame.title}" already exists.` },
      { status: 409 }
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
      description,
      featured: false,
      hidden: false,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await logActivity("game_added", `Added ${title}`);

  return Response.json({
    success: true,
    game: data,
    message: `Added ${title}`,
  });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    const ids = body.ids.map((id: unknown) => String(id).trim()).filter(Boolean);
    const updates: Record<string, boolean> = {};

    if (body.featured !== undefined) updates.featured = body.featured === true;
    if (body.hidden !== undefined) updates.hidden = body.hidden === true;
    if (body.desktop_only !== undefined) updates.desktop_only = body.desktop_only === true;

    if (ids.length === 0 || Object.keys(updates).length === 0) {
      return Response.json({ error: "Selected games and updates are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("games")
      .update(updates)
      .in("id", ids)
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await logActivity("bulk_games_updated", `Updated ${ids.length} selected games`);

    return Response.json({
      success: true,
      games: data || [],
      message: `Updated ${ids.length} selected games`,
    });
  }

  const id = String(body.id || "").trim();
  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();
  const category = String(body.category || "").trim() || null;
  const description = String(body.description || "").trim() || null;

  if (!id || !title || !url) {
    return Response.json(
      { error: "Game ID, title, and URL are required" },
      { status: 400 }
    );
  }

  const { data: duplicateGame, error: duplicateError } = await supabase
    .from("games")
    .select("id,title")
    .ilike("title", title)
    .neq("id", id)
    .maybeSingle();

  if (duplicateError) {
    return Response.json({ error: duplicateError.message }, { status: 500 });
  }

  if (duplicateGame) {
    return Response.json(
      { error: `A game called "${duplicateGame.title}" already exists.` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("games")
    .update({
      title,
      url,
      category,
      description,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await logActivity("game_updated", `Updated ${title}`);

  return Response.json({
    success: true,
    game: data,
    message: `Updated ${title}`,
  });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    const ids = body.ids.map((id: unknown) => String(id).trim()).filter(Boolean);

    if (ids.length === 0) {
      return Response.json({ error: "Selected games are required" }, { status: 400 });
    }

    const { error } = await supabase.from("games").delete().in("id", ids);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await logActivity("bulk_games_deleted", `Deleted ${ids.length} selected games`);

    return Response.json({
      success: true,
      message: `Deleted ${ids.length} selected games`,
    });
  }

  const id = String(body.id || "").trim();

  if (!id) {
    return Response.json({ error: "Game ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("games").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await logActivity("game_deleted", `Deleted ${id}`);

  return Response.json({
    success: true,
    message: `Deleted ${id}`,
  });
}

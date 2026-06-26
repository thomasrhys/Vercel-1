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

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id || "").trim();

  if (!id) {
    return Response.json({ error: "Game ID is required" }, { status: 400 });
  }

  const updates: Record<string, boolean> = {};

  if (body.featured !== undefined) {
    updates.featured = body.featured === true;
  }

  if (body.hidden !== undefined) {
    updates.hidden = body.hidden === true;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No status updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("games")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    game: data,
    message: `Updated ${data.title}`,
  });
}

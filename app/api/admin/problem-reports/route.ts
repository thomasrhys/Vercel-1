import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function requireAdmin() {
  const { userId } = await auth();
  return !!userId && ADMIN_USER_IDS.includes(userId);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("problem_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || []);
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id || "").trim();
  const status = String(body.status || "").trim();

  if (!id || !["open", "completed"].includes(status)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("problem_reports")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

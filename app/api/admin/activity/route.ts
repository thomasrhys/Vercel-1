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

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}

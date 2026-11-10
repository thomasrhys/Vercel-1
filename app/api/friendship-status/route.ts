// app/api/friendship-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  const authToken = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!authToken) {
    return NextResponse.json(
      { error: 'You must be logged in' },
      { status: 401 }
    );
  }

  const authenticatedSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${authToken}` } },
    }
  );

  const { data: { user }, error: userError } =
    await authenticatedSupabase.auth.getUser(authToken);

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Invalid authentication token' },
      { status: 401 }
    );
  }

  const userId = req.nextUrl.searchParams.get('userId');
  const targetId = req.nextUrl.searchParams.get('targetId');

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !userId ||
    !targetId ||
    userId !== user.id ||
    !uuidPattern.test(userId) ||
    !uuidPattern.test(targetId)
  ) {
    return NextResponse.json(
      { error: 'Invalid friendship query' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('status')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Friendship query error:', error);
    return NextResponse.json({ status: 'none' });
  }
  
  const status = data?.status || 'none';
  return NextResponse.json({ status });
}

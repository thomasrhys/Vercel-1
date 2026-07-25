// app/api/friendship-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const targetId = req.nextUrl.searchParams.get('targetId');
  
  if (!userId || !targetId) {
    return NextResponse.json({ status: 'none' });
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

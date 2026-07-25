// app/api/friendship-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  
  const userId = req.nextUrl.searchParams.get('userId');
  const targetId = req.nextUrl.searchParams.get('targetId');
  
  if (!userId || !targetId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('friendships')
    .select('status')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const status = data?.status || 'none';
  return NextResponse.json({ status });
}

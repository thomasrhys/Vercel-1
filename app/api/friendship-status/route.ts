// app/api/friendship-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Browser client for basic queries
import { getSupabaseUserId } from '@/lib/supabase-server-auth';

export async function GET(req: NextRequest) {
  const userId = await getSupabaseUserId(req);
  
  if (!userId) {
    return NextResponse.json({ status: 'none' });
  }
  
  const targetId = req.nextUrl.searchParams.get('targetId');
  
  if (!targetId) {
    return NextResponse.json({ error: 'Missing targetId param' }, { status: 400 });
  }
  
  // Query the friendships table
  const { data, error } = await supabase
    .from('friendships')
    .select('status')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Friendship query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const status = data?.status || 'none';
  return NextResponse.json({ status });
}

// app/api/friend/am-i-blocked/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    console.log('[am-i-blocked] === REQUEST START ===');
    console.log('[am-i-blocked] Method:', req.method);
    console.log('[am-i-blocked] URL:', req.url);
    
    const authorization = req.headers.get('authorization');
    console.log('[am-i-blocked] Authorization header exists:', !!authorization);
    
    const authToken = authorization?.startsWith('Bearer ') 
      ? authorization.slice(7) 
      : null;
    
    console.log('[am-i-blocked] Token (first 20 chars):', authToken?.substring(0, 20));
    
    if (!authToken) {
      console.log('[am-i-blocked] No token - returning not blocked');
      return NextResponse.json({ is_blocked: false });
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authToken);
    
    console.log('[am-i-blocked] Current user ID:', user?.id);
    console.log('[am-i-blocked] User error:', userError);
    
    if (userError || !user) {
      console.log('[am-i-blocked] Invalid user - returning not blocked');
      return NextResponse.json({ is_blocked: false });
    }
    
    const targetUserId = req.nextUrl.searchParams.get('targetUserId');
    
    console.log('[am-i-blocked] Target user (profile owner):', targetUserId);
    
    if (!targetUserId) {
      console.log('[am-i-blocked] No targetUserId - returning not blocked');
      return NextResponse.json({ is_blocked: false });
    }
    
    // Check if TARGET USER (profile owner) blocked CURRENT USER (viewer)
    console.log('[am-i-blocked] === QUERYING BLOCKS TABLE ===');
    console.log('[am-i-blocked] Looking for: blocker_id =', targetUserId);
    console.log('[am-i-blocked] Looking for: blocked_id =', user.id);
    
    // Try ALL blocks for the current user first
    const allBlocks = await supabase
      .from('blocks')
      .select('*')
      .eq('blocked_id', user.id);
    
    console.log('[am-i-blocked] All blocks where I am blocked:', allBlocks.data);
    console.log('[am-i-blocked] All blocks error:', allBlocks.error);
    
    // Now check the specific one
    const { data, error } = await supabase
      .from('blocks')
      .select('id, blocker_id, blocked_id')
      .eq('blocker_id', targetUserId)
      .eq('blocked_id', user.id)
      .maybeSingle();
    
    console.log('[am-i-blocked] Specific query result:', data);
    console.log('[am-i-blocked] Specific query error:', error);
    
    const isBlocked = !!data;
    console.log('[am-i-blocked] === FINAL RESULT ===');
    console.log('[am-i-blocked] is_blocked:', isBlocked);
    
    return NextResponse.json({ is_blocked });
  } catch (err: any) {
    console.error('[am-i-blocked] ERROR:', err.message);
    console.error('[am-i-blocked] Stack:', err.stack);
    return NextResponse.json({ is_blocked: false });
  }
}

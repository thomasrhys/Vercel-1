// app/api/friend/am-i-blocked/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    console.log('[am-i-blocked] Request received');
    
    const authorization = req.headers.get('authorization');
    const authToken = authorization?.startsWith('Bearer ') 
      ? authorization.slice(7) 
      : null;
    
    console.log('[am-i-blocked] Token exists:', !!authToken);
    
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
    
    console.log('[am-i-blocked] Current user:', user?.id);
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
    console.log('[am-i-blocked] Checking blocks table...');
    console.log('[am-i-blocked] blocker_id (should be targetUserId):', targetUserId);
    console.log('[am-i-blocked] blocked_id (should be current user):', user.id);
    
    const { data } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', targetUserId)   // Profile owner did the blocking
      .eq('blocked_id', user.id)        // Current user got blocked
      .maybeSingle();
    
    console.log('[am-i-blocked] Block record found:', !!data);
    console.log('[am-i-blocked] Block record:', data);
    
    return NextResponse.json({ is_blocked: !!data });
  } catch (err: any) {
    console.error('[am-i-blocked] Error:', err.message);
    return NextResponse.json({ is_blocked: false });
  }
}

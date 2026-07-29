// app/api/friend/is-blocked/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization');
    const authToken = authorization?.startsWith('Bearer ') 
      ? authorization.slice(7) 
      : null;
    
    if (!authToken) {
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
    
    if (userError || !user) {
      return NextResponse.json({ is_blocked: false });
    }
    
    const targetUserId = req.nextUrl.searchParams.get('targetUserId');
    
    if (!targetUserId) {
      return NextResponse.json({ is_blocked: false });
    }
    
    // FIXED: Check if CURRENT USER (viewer) blocked the TARGET USER (profile owner)
    const { data } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)        // Who did the blocking (current user/viewer)
      .eq('blocked_id', targetUserId)   // Who got blocked (profile owner/target)
      .maybeSingle();
    
    return NextResponse.json({ is_blocked: !!data });
  } catch (err: any) {
    console.error('[Is Blocked Catch]:', err.message);
    return NextResponse.json({ is_blocked: false });
  }
}

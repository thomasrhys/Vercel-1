// app/api/friend/block-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    const { targetUserId, action } = await req.json();
    
    if (!targetUserId || !['block', 'unblock'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing targetUserId or invalid action' },
        { status: 400 }
      );
    }
    
    if (user.id === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      );
    }
    
    if (action === 'block') {
      // Remove any existing friendships first
      await supabase
        .from('friendships')
        .delete()
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      
      // Create the block
      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: user.id, blocked_id: targetUserId });
      
      if (error) {
        console.error('[Block User Error]:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    } else {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId);
      
      if (error) {
        console.error('[Unblock User Error]:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true, action });
  } catch (err: any) {
    console.error('[Block User Catch]:', err.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

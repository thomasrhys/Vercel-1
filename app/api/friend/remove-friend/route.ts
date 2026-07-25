// app/api/friend/remove-friend/route.ts
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
    
    const { friendshipId } = await req.json();
    
    if (!friendshipId) {
      return NextResponse.json(
        { error: 'Missing friendshipId' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .and(supabase.or(`requester_id.eq.${user.id}`, `addressee_id.eq.${user.id}`));
    
    if (error) {
      console.error('[Remove Friend Error]:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Remove Friend Catch]:', err.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

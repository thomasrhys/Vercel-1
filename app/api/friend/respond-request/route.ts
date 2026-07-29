// app/api/friend/respond-request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Get auth token from request header
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
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(authToken);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { friendshipId, action } = await req.json();
    
    if (!friendshipId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing friendshipId or invalid action' },
        { status: 400 }
      );
    }
    
    if (action === 'accept') {
      const { data, error } = await supabase
        .from('friendships')
        .update({ 
          status: 'accepted', 
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', friendshipId)
        .eq('addressee_id', user.id)
        .select();
      
      if (error) {
        console.error('[Accept Error]:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, action: 'accepted', data });
    } else {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
        .eq('addressee_id', user.id);
      
      if (error) {
        console.error('[Decline Error]:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, action: 'declined' });
    }
  } catch (err: any) {
    console.error('[Respond Catch]:', err.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

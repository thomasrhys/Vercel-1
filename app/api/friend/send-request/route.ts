// app/api/friend/send-request/route.ts
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
        { error: 'You must be logged in to send friend requests' },
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
    const { addresseeId } = await req.json();
    
    if (!addresseeId) {
      return NextResponse.json(
        { error: 'Missing addressee_id' },
        { status: 400 }
      );
    }
    
    if (user.id === addresseeId) {
      return NextResponse.json(
        { error: 'Cannot add yourself as a friend' },
        { status: 400 }
      );
    }
    
    // Check if target blocked you
    const { data: blockedByTarget } = await supabase
      .from('blocks')
      .select('*')
      .eq('blocker_id', addresseeId)
      .eq('blocked_id', user.id)
      .maybeSingle();
    
    if (blockedByTarget) {
      return NextResponse.json(
        { error: 'This user has blocked you' },
        { status: 403 }
      );
    }
    
    // Check for existing relationship
    const { data: existing, error: existingError } = await supabase
      .from('friendships')
      .select('status')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }
    
    if (existing && existing.status === 'accepted') {
      return NextResponse.json(
        { success: false, message: 'Already friends' },
        { status: 409 }
      );
    }
    
    // Insert new friendship
    const { data, error: insertError } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: addresseeId, status: 'pending' })
      .select();
    
    if (insertError) {
      console.error('[Friend Request Error]:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Friend Request Catch]:', err.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

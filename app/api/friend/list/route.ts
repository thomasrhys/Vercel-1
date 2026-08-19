import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
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
    
    const { data: blockedData } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    
    const blockedIds = blockedData?.map(b => b.blocked_id) || [];
    
    // Added accent_colour to both requester and addressee
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        accepted_at,
        requester:user_profile(requester_id, username, display_name, avatar_url, accent_colour, is_public),
        addressee:user_profile(addressee_id, username, display_name, avatar_url, accent_colour, is_public)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    
    if (error) {
      console.error('[Friends List Error]:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    const friends = data?.map((friendship) => {
      const otherUserId = friendship.requester_id === user.id 
        ? friendship.addressee_id 
        : friendship.requester_id;
      
      const otherUserProfile = friendship.requester_id === user.id
        ? friendship.addressee
        : friendship.requester;
      
      return {
        id: friendship.id,
        user_id: otherUserId,
        username: otherUserProfile?.username,
        display_name: otherUserProfile?.display_name,
        avatar_url: otherUserProfile?.avatar_url,
        accent_colour: otherUserProfile?.accent_colour,
        accepted_at: friendship.accepted_at,
        is_public: otherUserProfile?.is_public,
      };
    }).filter(f => f.user_id) || [];
    
    const filteredFriends = friends.filter(friend => {
      if (blockedIds.includes(friend.user_id)) {
        return false;
      }
      if (friend.is_public === false) {
        return false;
      }
      return true;
    });
    
    const finalResponse = filteredFriends.map(({ is_public, ...rest }) => rest);
    
    return NextResponse.json({ success: true, data: finalResponse });
  } catch (err: any) {
    console.error('[Friends List Catch]:', err.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

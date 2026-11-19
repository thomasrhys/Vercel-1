// app/api/friend/pending-requests/route.ts
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
    
    // Get pending requests where current user is the recipient
    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, created_at')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');
    
    if (error) {
      console.error('[Pending Requests Error]:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    const requesterIds = (data || []).map((request) => request.requester_id);
    const { data: profiles, error: profilesError } = requesterIds.length > 0
      ? await supabase
          .from('user_profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', requesterIds)
      : { data: [], error: null };

    if (profilesError) {
      console.error('[Pending Request Profiles Error]:', profilesError);
    }

    const profilesById = new Map(
      (profiles || []).map((profile) => [profile.user_id, profile])
    );

    const requestsWithProfile = (data || []).map((request) => {
      const profile = profilesById.get(request.requester_id);

      return {
        id: request.id,
        requester_id: request.requester_id,
        created_at: request.created_at,
        requester: profile
          ? {
              username: profile.username || `user-${request.requester_id.slice(0, 8)}`,
              display_name: profile.display_name || profile.username || 'Unknown user',
              avatar_url: profile.avatar_url,
            }
          : {
              username: `user-${request.requester_id.slice(0, 8)}`,
              display_name: 'Unknown user',
              avatar_url: null,
            },
      };
    });
    
    return NextResponse.json({ success: true, data: requestsWithProfile });
  } catch (err: any) {
    console.error('[Pending Requests Catch]:', err.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

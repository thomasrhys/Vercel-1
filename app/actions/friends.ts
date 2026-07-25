// app/actions/friends.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Create Supabase client for server actions
async function createServerSupabase() {
  const cookieStore = await cookies();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
    }
  );
  
  return supabase;
}

// Safe wrapper for all server actions
async function withAuth(fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (error: any) {
    console.error('[Friends Action Error]:', error.message);
    
    // Check if it's an auth error
    if (error.message?.includes('jwt malformed') || 
        error.message?.includes('Invalid token') ||
        error.message?.includes('Not authenticated')) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    // Check if it's a database error
    if (error.code) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Generic error
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export async function sendFriendRequest(addresseeId: string) {
  return withAuth(async () => {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('You must be logged in to send friend requests');
    }
    
    if (user.id === addresseeId) {
      throw new Error('Cannot add yourself as a friend');
    }
    
    // Check if target blocked you
    const { data: blockedByTarget } = await supabase
      .from('blocks')
      .select('*')
      .eq('blocker_id', addresseeId)
      .eq('blocked_id', user.id)
      .maybeSingle();
    
    if (blockedByTarget) {
      throw new Error('This user has blocked you');
    }
    
    // Check for existing relationship
    const { data: existing, error: existingError } = await supabase
      .from('friendships')
      .select('status')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }
    
    if (existing && existing.status === 'accepted') {
      return { success: false, message: 'Already friends' };
    }
    
    // Insert new friendship
    const { error: insertError } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: addresseeId, status: 'pending' });
    
    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(insertError.message);
    }
    
    return { success: true };
  });
}

export async function acceptFriendRequest(friendshipId: string) {
  return withAuth(async () => {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('You must be logged in');
    }
    
    const { error } = await supabase
      .from('friendships')
      .update({ 
        status: 'accepted', 
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', friendshipId)
      .eq('addressee_id', user.id);
    
    if (error) throw new Error(error.message);
    
    revalidatePath('/dashboard');
    return { success: true };
  });
}

export async function declineFriendRequest(friendshipId: string) {
  return withAuth(async () => {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('You must be logged in');
    }
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .eq('addressee_id', user.id);
    
    if (error) throw new Error(error.message);
    
    revalidatePath('/dashboard');
    return { success: true };
  });
}

export async function removeFriend(friendshipId: string) {
  return withAuth(async () => {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('You must be logged in');
    }
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    
    if (error) throw new Error(error.message);
    
    revalidatePath('/dashboard');
    return { success: true };
  });
}

export async function blockUser(targetUserId: string) {
  return withAuth(async () => {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('You must be logged in');
    }
    
    if (user.id === targetUserId) {
      throw new Error('Cannot block yourself');
    }
    
    // Remove any existing friendships
    await supabase
      .from('friendships')
      .delete()
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    
    // Create the block
    const { error } = await supabase
      .from('blocks')
      .insert({ blocker_id: user.id, blocked_id: targetUserId });
    
    if (error) throw new Error(error.message);
    
    revalidatePath('/dashboard');
    return { success: true };
  });
}

export async function unblockUser(targetUserId: string) {
  return withAuth(async () => {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('You must be logged in');
    }
    
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetUserId);
    
    if (error) throw new Error(error.message);
    
    revalidatePath('/dashboard');
    return { success: true };
  });
}

export async function getFriends() {
  return withAuth(async () => {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return [];
    }
    
    const { data } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        accepted_at,
        requester:user_profile(requester_id, username, display_name, avatar_url),
        addressee:user_profile(addressee_id, username, display_name, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    
    return data || [];
  });
}

export async function getPendingRequests() {
  return withAuth(async () => {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return [];
    }
    
    const { data } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        created_at,
        requester:user_profile(requester_id, username, display_name, avatar_url)
      `)
      .eq('addressee_id', user.id)
      .eq('status', 'pending');
    
    return data || [];
  });
}

export async function getBlockedUsers() {
  return withAuth(async () => {
    const supabase = await createServerSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return [];
    }
    
    const { data } = await supabase
      .from('blocks')
      .select(`
        id,
        blocked_id,
        blocked_user:user_profile(blocked_id, username, display_name, avatar_url)
      `)
      .eq('blocker_id', user.id);
    
    return data || [];
  });
}

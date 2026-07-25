// app/actions/friends.ts
'use server';

import { createClient as createBasicClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Create Supabase client with cookies for auth
async function createServerClient() {
  const cookieStore = await cookies();
  
  const supabase = createBasicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for server actions
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

// ============ FRIEND REQUESTS ============

export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  if (user.id === addresseeId) throw new Error('Cannot add yourself');
  
  // Check if target blocked you
  const { data: blockedByTarget } = await supabase
    .from('blocks')
    .select('*')
    .eq('blocker_id', addresseeId)
    .eq('blocked_id', user.id)
    .single();
  
  if (blockedByTarget) throw new Error('Cannot send request to blocked user');
  
  // Check for existing relationship
  const { data: existing } = await supabase
    .from('friendships')
    .select('status')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .maybeSingle();
  
  if (existing && existing.status === 'accepted') {
    return { success: false, message: 'Already friends' };
  }
  
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: addresseeId, status: 'pending' });
  
  if (error) throw error;
  return { success: true };
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('friendships')
    .update({ 
      status: 'accepted', 
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', friendshipId)
    .eq('addressee_id', user!.id);
  
  if (error) throw error;
  revalidatePath('/dashboard');
  return { success: true };
}

export async function declineFriendRequest(friendshipId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('addressee_id', user!.id);
  
  if (error) throw error;
  revalidatePath('/dashboard');
  return { success: true };
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  
  if (error) throw error;
  revalidatePath('/dashboard');
  return { success: true };
}

// ============ BLOCKING ============

export async function blockUser(targetUserId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  if (user.id === targetUserId) throw new Error('Cannot block yourself');
  
  // Remove any existing friendships first
  await supabase
    .from('friendships')
    .delete()
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id: user.id, blocked_id: targetUserId });
  
  if (error) throw error;
  
  revalidatePath('/dashboard');
  return { success: true };
}

export async function unblockUser(targetUserId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', user!.id)
    .eq('blocked_id', targetUserId);
  
  if (error) throw error;
  revalidatePath('/dashboard');
  return { success: true };
}

// ============ QUERY HELPERS ============

export async function getFriends() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
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
    .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);
  
  return data || [];
}

export async function getPendingRequests() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data } = await supabase
    .from('friendships')
    .select(`
      id,
      requester_id,
      created_at,
      requester:user_profile(requester_id, username, display_name, avatar_url)
    `)
    .eq('addressee_id', user!.id)
    .eq('status', 'pending');
  
  return data || [];
}

export async function getBlockedUsers() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data } = await supabase
    .from('blocks')
    .select(`
      id,
      blocked_id,
      blocked_user:user_profile(blocked_id, username, display_name, avatar_url)
    `)
    .eq('blocker_id', user!.id);
  
  return data || [];
}

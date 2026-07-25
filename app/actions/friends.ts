// app/actions/friends.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

async function createServerSupabaseWithToken(authToken: string | null) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      },
    }
  );
  
  return supabase;
}

export async function sendFriendRequest(addresseeId: string, authToken: string | null = null) {
  if (!authToken) {
    throw new Error('You must be logged in to send friend requests');
  }
  
  const supabase = await createServerSupabaseWithToken(authToken);
  const { data: { user }, error: userError } = await supabase.auth.getUser(authToken);
  
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
  
  revalidatePath('/dashboard');
  return { success: true };
}

// ... keep the rest of your server actions (acceptFriendRequest, declineFriendRequest, etc.)
// but add authToken parameter to each and use createServerSupabaseWithToken(authToken)

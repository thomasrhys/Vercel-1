import { supabaseAuthClient } from '@/lib/supabase-auth'

export async function isBlocked(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabaseAuthClient.auth.getUser()
  if (!user) return false
  
  const { data } = await supabaseAuthClient
    .from('blocks')
    .select('*')
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId)
    .single()
  
  return !!data
}

export async function getBlockedUsers() {
  const { data: { user } } = await supabaseAuthClient.auth.getUser()
  if (!user) return []
  
  const { data } = await supabaseAuthClient
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id)
  
  return data?.map(b => b.blocked_id) || []
}

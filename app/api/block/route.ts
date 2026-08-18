import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { blockedId } = await request.json()
    
    if (!blockedId || blockedId === user.id) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }
    
    // Check if already blocked
    const { data: existing } = await supabase
      .from('blocks')
      .select('*')
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedId)
      .single()
    
    if (existing) {
      return NextResponse.json({ error: 'Already blocked' }, { status: 400 })
    }
    
    // Create block
    const { error } = await supabase.from('blocks').insert({
      blocker_id: user.id,
      blocked_id: blockedId
    })
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    return NextResponse.json({ success: true, message: 'User blocked' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { blockedId } = await request.json()
    
    // Delete block
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedId)
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    return NextResponse.json({ success: true, message: 'User unblocked' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

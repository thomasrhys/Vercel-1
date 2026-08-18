import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request header
    const authorization = request.headers.get('authorization')
    const authToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : null

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    )

    const { data: { user } } = await supabase.auth.getUser(authToken)

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const { targetUserId, action } = await request.json()

    if (!targetUserId || targetUserId === user.id) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    if (action === 'block') {
      // Check if already blocked
      const { data: existing } = await supabase
        .from('blocks')
        .select('*')
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'Already blocked' }, { status: 400 })
      }

      // Create block
      const { error } = await supabase.from('blocks').insert({
        blocker_id: user.id,
        blocked_id: targetUserId,
      })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: 'User blocked' })
    } else if (action === 'unblock') {
      // Delete block
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: 'User unblocked' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Block API Error]:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

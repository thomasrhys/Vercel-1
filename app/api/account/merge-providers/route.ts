import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { provider, email } = await request.json()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.email !== email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 400 })
    }
    
    // TODO: This requires manual linking enabled OR admin intervention
    // For now, log that linking would happen here
    console.log(`Would link ${provider} to user ${user.id}`)
    
    return NextResponse.json({ success: true, message: 'Logged linking attempt' })
  } catch (error) {
    console.error('Merge failed:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

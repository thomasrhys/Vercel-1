import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization');
    const authToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${authToken}` } },
      }
    );

    const { data: { user } } = await supabase.auth.getUser(authToken);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('game_saves')
      .select('save_data')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .maybeSingle();

    if (error) {
      console.error('[Cloud Load Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      hasSave: !!data, 
      saveData: data?.save_data || null 
    });
  } catch (err: any) {
    console.error('[Cloud Load Catch]:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

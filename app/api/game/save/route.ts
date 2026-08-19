import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
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

    const { gameId, saveData } = await req.json();

    if (!gameId || !saveData) {
      return NextResponse.json({ error: 'Missing gameId or saveData' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('game_saves')
      .upsert({
        user_id: user.id,
        game_id: gameId,
        save_data: saveData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Cloud Save Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Cloud Save Catch]:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

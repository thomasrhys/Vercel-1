// app/login/urdd/route.ts
import { createServerSupabase } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. Initialize your custom server client (handles cookies internally)
    const supabase = await createServerSupabase();

    // 2. Perform the server-side login for your test account
    const { error } = await supabase.auth.signInWithPassword({
      email: 'urdd2027@urdd.cymru',
      password: process.env.URDD_PASSWORD!, 
    });

    // If the credentials fail or environment variables are missing, catch it here
    if (error) {
      return NextResponse.json(
        { error: 'Auto login failed', details: error.message }, 
        { status: 400 }
      );
    }

    // 3. Resolve the host domain dynamically to safely handle redirects
    const requestUrl = new URL(request.url);
    const redirectUrl = new URL('/', requestUrl.origin);
    
    // 4. Force browser redirection to the profile page
    return NextResponse.redirect(redirectUrl);
    
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Server error during auto-login', details: err.message }, 
      { status: 500 }
    );
  }
}

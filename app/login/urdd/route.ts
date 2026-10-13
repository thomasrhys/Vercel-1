// app/login/urdd/route.ts
import { createServerClient } from '@/lib/supabase-server'; 
// Note: If your file is named supabase-server-auth, change the line above to:
// import { createServerClient } from '@/lib/supabase-server-auth';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = cookies();
  
  // 1. Initialize your specific thomasrhys/vercel-1 server client
  const supabase = await createServerClient(cookieStore);

  // 2. Perform the server-side login for your test account
  const { error } = await supabase.auth.signInWithPassword({
    email: 'urdd2027@urdd.cymru',
    password: process.env.URDD_PASSWORD!, 
  });

  // If the credentials fail or aren't set in Vercel, return an error
  if (error) {
    return NextResponse.json(
      { error: 'Auto login failed', details: error.message }, 
      { status: 400 }
    );
  }

  // 3. Resolve the host domain dynamically to safely handle redirects
  const requestUrl = new URL(request.url);
  const redirectUrl = new URL('/profile', requestUrl.origin);
  
  // 4. Force browser redirection to the profile page
  return NextResponse.redirect(redirectUrl);
}

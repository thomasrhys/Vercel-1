import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // 1. Extract the secure authentication code sent back by Twitch/Discord/Microsoft
  const code = requestUrl.searchParams.get('code');
  
  // 2. See if there was a specific page the user was trying to return to (defaults to login)
  const next = requestUrl.searchParams.get('next') ?? '/login';

  if (code) {
    const cookieStore = await cookies();
    // 3. Initialize a server client that has permission to write secure browser cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    
    // 4. Trade the temporary code for a permanent, secure logged-in user session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 5. Send the authenticated user right back to your login or account page safely
  return NextResponse.redirect(new URL(next, request.url));
}

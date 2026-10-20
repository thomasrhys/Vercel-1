// app/login/urdd/route.ts
import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a), B = Buffer.from(b)
  return A.length === B.length && timingSafeEqual(A, B)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const key = url.searchParams.get('key') ?? ''
  const expected = process.env.URDD_LOGIN_KEY
  if (!expected || !safeEqual(key, expected)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword({
    email: 'urdd2027@urdd.cymru',
    password: process.env.URDD_PASSWORD!,
  })
  if (error) {
    console.error('urdd login failed', error.message)
    return new NextResponse('Unavailable', { status: 503 })
  }

  const res = NextResponse.redirect(new URL('/', url.origin))
  res.cookies.set('lang', 'cy', { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })
  return res
}
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client'; 

export default function NativeAuthProxyPage() {
  const router = useRouter();

  useEffect(() => {
    async function triggerNativeGoogle() {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        try {
          const { GoogleAuth } = require('@codetrix-studio/capacitor-google-auth');
          
          // 1. Fire the official native Android account picker bottom sheet panel
          const googleUser = await GoogleAuth.signIn();
          
          // 2. Authenticate silently using your exact imported instance
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: googleUser.authentication.idToken,
          });

          if (error) throw error;
        } catch (err) {
          console.error('Native Google auth error or cancellation:', err);
        }
      }
      
      // 3. Drop them straight back onto your main home dashboard logged in
      router.push('/');
    }

    triggerNativeGoogle();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <p className="text-sm text-muted-foreground animate-pulse">Connecting securely to Google...</p>
      </div>
    </main>
  );
}

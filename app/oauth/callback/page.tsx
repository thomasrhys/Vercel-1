"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseAuthClient } from '@/lib/supabase-auth';

export default function ConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleConsent() {
      const code = searchParams.get('code');
      
      if (!code) {
        setError('No authorization code provided');
        setLoading(false);
        return;
      }

      // This is redundant since /auth/callback already handles this
      // Delete this page entirely if you already have app/auth/callback/route.ts
      router.push('/account');
    }

    handleConsent();
  }, [searchParams, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <p>Processing authorization...</p>
    </div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-bold text-red-600 mb-4">Authorization Failed</h1>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => router.push('/account')}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Return to Account
        </button>
      </div>
    </div>;
  }

  return null;
}

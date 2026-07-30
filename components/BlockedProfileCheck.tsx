// components/BlockedProfileCheck.tsx - TEMPORARY HARDTEST VERSION
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface BlockedProfileCheckProps {
  profileUserId: string;
  children: React.ReactNode;
}

// HARDCODED: Tom Hughes' ID blocked test user's ID
const TOM_HUGHES_ID = 'b58281d3-0f0c-4326-9f5a-5f6ec93f0881';
const TEST_USER_ID = 'ea1dbd3e-42bb-4bf5-a869-715e3fe90294';

export default function BlockedProfileCheck({ profileUserId, children }: BlockedProfileCheckProps) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        console.log('[BlockedProfileCheck] profileUserId:', profileUserId);
        console.log('[BlockedProfileCheck] currentUserId:', user?.id);
        
        // HARDCODED TEST: Check if viewing Tom's profile while logged in as test
        if (profileUserId === TOM_HUGHES_ID && user?.id === TEST_USER_ID) {
          console.log('[BlockedProfileCheck] HARDCODED: User IS BLOCKED!');
          setIsBlocked(true);
          setLoading(false);
          return;
        }
        
        if (!user || user.id === profileUserId) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from('blocks')
          .select('id')
          .eq('blocker_id', profileUserId)
          .eq('blocked_id', user.id)
          .maybeSingle();
        
        console.log('[BlockedProfileCheck] Block check result:', data);
        
        if (data) {
          setIsBlocked(true);
        }
      } catch (error) {
        console.error('[BlockedProfileCheck] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkBlockStatus();
  }, [profileUserId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isBlocked) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-6xl font-bold text-foreground">500</h1>
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground">An unexpected error occurred while loading this page.</p>
          <a href="/" className="inline-block px-4 py-2 rounded-md border border-border text-sm hover:bg-muted transition-colors">Go Home</a>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

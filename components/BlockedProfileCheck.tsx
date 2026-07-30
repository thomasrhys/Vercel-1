// components/BlockedProfileCheck.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface BlockedProfileCheckProps {
  profileUserId: string;
  children: React.ReactNode;
}

export default function BlockedProfileCheck({ profileUserId, children }: BlockedProfileCheckProps) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        console.log('[BlockedProfileCheck] Starting check');
        console.log('[BlockedProfileCheck] profileUserId:', profileUserId);
        
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[BlockedProfileCheck] Current user:', user?.id);
        
        if (!user) {
          console.log('[BlockedProfileCheck] Not logged in - no block check needed');
          setDebugInfo(prev => ({ ...prev, user: null, result: 'not logged in' }));
          setLoading(false);
          return;
        }

        if (user.id === profileUserId) {
          console.log('[BlockedProfileCheck] Viewing own profile - no block check needed');
          setDebugInfo(prev => ({ ...prev, user: user.id, result: 'own profile' }));
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        console.log('[BlockedProfileCheck] Session token:', session?.access_token ? 'EXISTS' : 'MISSING');
        
        if (!session?.access_token) {
          console.log('[BlockedProfileCheck] No session token - cannot check blocks');
          setDebugInfo(prev => ({ ...prev, user: user.id, result: 'no session' }));
          setLoading(false);
          return;
        }

        // Check if profile owner blocked current user
        console.log('[BlockedProfileCheck] Fetching am-i-blocked...');
        const res = await fetch(`/api/friend/am-i-blocked?targetUserId=${profileUserId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        console.log('[BlockedProfileCheck] Response status:', res.status);
        
        const result = await res.json();
        console.log('[BlockedProfileCheck] API result:', result);
        
        if (result.is_blocked) {
          console.log('[BlockedProfileCheck] USER IS BLOCKED!');
          setIsBlocked(true);
        } else {
          console.log('[BlockedProfileCheck] User is NOT blocked');
        }
        
        setDebugInfo(prev => ({ ...prev, user: user.id, apiResult: result }));
      } catch (error) {
        console.error('[BlockedProfileCheck] Error:', error);
        setDebugInfo(prev => ({ ...prev, error: String(error) }));
      } finally {
        setLoading(false);
      }
    };

    checkBlockStatus();
  }, [profileUserId]);

  // DEBUG: Show debug info on page during development
  if (process.env.NODE_ENV === 'development') {
    return (
      <>
        <div className="bg-yellow-100 text-black p-4 text-xs fixed top-0 left-0 right-0 z-50">
          <strong>DEBUG:</strong>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
        <BlockedProfileCheckContent 
          isBlocked={isBlocked} 
          loading={loading} 
          profileUserId={profileUserId}
        >
          {children}
        </BlockedProfileCheckContent>
      </>
    );
  }

  return (
    <BlockedProfileCheckContent 
      isBlocked={isBlocked} 
      loading={loading} 
      profileUserId={profileUserId}
    >
      {children}
    </BlockedProfileCheckContent>
  );
}

function BlockedProfileCheckContent({ isBlocked, loading, children }: any) {
  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (isBlocked) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-6xl font-bold text-foreground">500</h1>
          <h2 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-muted-foreground">
            An unexpected error occurred while loading this page.
          </p>
          <a 
            href="/" 
            className="inline-block px-4 py-2 rounded-md border border-border text-sm hover:bg-muted transition-colors"
          >
            Go Home
          </a>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

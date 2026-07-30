// components/BlockedProfileCheck.tsx - FINAL VERSION
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

  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        console.log('=== BLOCK CHECK START ===');
        console.log('profileUserId (owner):', profileUserId);
        
        const { data: { user } } = await supabase.auth.getUser();
        console.log('currentUserId (me):', user?.id);
        
        if (!user || user.id === profileUserId) {
          console.log('No block check needed');
          setLoading(false);
          return;
        }

        // QUERY 1: All blocks where I am the blocked user
        console.log('Query 1: Getting all blocks where I am blocked...');
        const allMyBlocks = await supabase
          .from('blocks')
          .select('*')
          .eq('blocked_id', user.id);
        
        console.log('All blocks where I am blocked:', allMyBlocks.data);
        console.log('Query error:', allMyBlocks.error);
        
        // QUERY 2: Check if THIS specific person blocked me
        console.log('Query 2: Checking if owner blocked me...');
        const { data, error } = await supabase
          .from('blocks')
          .select('id, blocker_id, blocked_id')
          .eq('blocker_id', profileUserId)
          .eq('blocked_id', user.id)
          .maybeSingle();
        
        console.log('Specific block check:', data);
        console.log('Specific block error:', error);
        
        if (data) {
          console.log('USER IS BLOCKED BY PROFILE OWNER!');
          setIsBlocked(true);
        }
        
        console.log('=== BLOCK CHECK END ===');
      } catch (error) {
        console.error('Block check error:', error);
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

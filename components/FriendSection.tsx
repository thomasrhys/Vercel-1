// components/FriendSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import FriendButton from './FriendButton';

interface FriendSectionProps {
  targetUserId: string;
}

export default function FriendSection({ targetUserId }: FriendSectionProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setCurrentUserId(session?.user?.id || null);
        setSessionToken(session?.access_token || null);
      } catch (error) {
        console.log('Auth check failed');
        setCurrentUserId(null);
        setSessionToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (loading) return <div className="h-10" />;
  if (!currentUserId) return <a href="/login" className="text-sm underline">Log in to add friends</a>;

  return (
    <FriendButton 
      targetUserId={targetUserId} 
      currentUserId={currentUserId}
      authToken={sessionToken}
    />
  );
}

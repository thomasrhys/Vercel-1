// components/FriendSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import FriendButton from './FriendButton';

export default function FriendSection({ targetUserId }: { targetUserId: string }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUserId(session?.user?.id || null);
      } catch (error) {
        setCurrentUserId(null);
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
    />
  );
}

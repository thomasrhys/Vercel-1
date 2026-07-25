// components/FriendSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import FriendButton from './FriendButton';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FriendSectionProps {
  targetUserId: string;
}

export default function FriendSection({ targetUserId }: FriendSectionProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
      } catch (error) {
        console.log('Not logged in or auth check failed');
        setCurrentUserId(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  if (loading) {
    return <div className="h-10" />; // Placeholder while loading
  }

  if (!currentUserId) {
    return (
      <a href="/login" className="inline-block rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
        Log in to add friends
      </a>
    );
  }

  return (
    <FriendButton 
      targetUserId={targetUserId}
      currentUserId={currentUserId}
    />
  );
}

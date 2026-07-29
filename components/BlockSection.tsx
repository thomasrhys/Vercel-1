// components/BlockSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import BlockUserButton from './BlockUserButton';

interface BlockSectionProps {
  targetUserId: string;
  targetUsername: string;
}

export default function BlockSection({ targetUserId, targetUsername }: BlockSectionProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sameUser, setSameUser] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
        setSameUser(user?.id === targetUserId);
      } catch (error) {
        console.log('Auth check failed');
        setCurrentUserId(null);
      }
    };

    getCurrentUser();
  }, [targetUserId]);

  // Don't render anything if not loaded yet
  if (currentUserId === null) {
    return <div className="h-[64px]" />; // Placeholder to prevent layout shift
  }

  if (!currentUserId) {
    return (
      <div className="rounded-md border border-border p-4">
        <h3 className="font-semibold text-foreground mb-2">Actions</h3>
        <p className="text-sm text-muted-foreground text-center">Log in to block users</p>
      </div>
    );
  }

  if (sameUser) {
    return (
      <div className="rounded-md border border-border p-4">
        <h3 className="font-semibold text-foreground mb-2">Actions</h3>
        <p className="text-sm text-muted-foreground text-center">You can't block yourself</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border p-4">
      <h3 className="font-semibold text-foreground mb-2">Actions</h3>
      <div className="flex gap-2 justify-center">
        <BlockUserButton 
          targetUserId={targetUserId} 
          targetUsername={targetUsername} 
        />
      </div>
    </div>
  );
}

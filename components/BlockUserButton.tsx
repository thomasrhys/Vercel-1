// components/BlockUserButton.tsx
'use client';

import { useState } from 'react';

interface BlockUserButtonProps {
  targetUserId: string;
  targetUsername: string;
}

export default function BlockUserButton({ targetUserId, targetUsername }: BlockUserButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const handleBlock = async () => {
    const confirmed = confirm(`Block ${targetUsername}? They won't be able to interact with you.`);
    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch('/api/friend/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId, action: 'block' }),
      });

      const result = await res.json();

      if (result.success) {
        alert('User blocked successfully');
        window.location.reload();
      } else {
        alert(result.error || 'Failed to block user');
      }
    } catch (error) {
      console.error('Block error:', error);
      alert('Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  if (isBlocked) {
    return (
      <div className="text-sm text-muted-foreground">
        You have blocked this user
      </div>
    );
  }

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className="px-4 py-2 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
    >
      {loading ? 'Blocking...' : 'Block User'}
    </button>
  );
}

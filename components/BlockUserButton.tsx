// components/BlockUserButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/confirm-dialog';

interface BlockUserButtonProps {
  targetUserId: string;
  targetUsername: string;
}

export default function BlockUserButton({ targetUserId, targetUsername }: BlockUserButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleBlock = async () => {
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
        setIsOpen(false);
        // Reload to reflect changes
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

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {loading ? 'Blocking...' : 'Block User'}
      </Button>

      <ConfirmDialog
        open={isOpen}
        title="Block User"
        description={`Are you sure you want to block ${targetUsername}? They won't be able to interact with you anymore.`}
        confirmLabel="Block"
        destructive
        isWorking={loading}
        onCancel={() => setIsOpen(false)}
        onConfirm={handleBlock}
      />
    </>
  );
}

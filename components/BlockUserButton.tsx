// components/BlockUserButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface BlockUserButtonProps {
  targetUserId: string;
  targetUsername: string;
}

export default function BlockUserButton({ targetUserId, targetUsername }: BlockUserButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Check if this user is already blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch(`/api/friend/is-blocked?targetUserId=${targetUserId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const result = await res.json();
        if (result.is_blocked) {
          setIsBlocked(true);
        }
      } catch (error) {
        console.error('Check block status error:', error);
      }
    };

    checkBlockStatus();
  }, [targetUserId]);

  const handleAction = async (action: 'block' | 'unblock') => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setIsOpen(false);
        window.location.href = '/login?redirect_url=' + encodeURIComponent(window.location.pathname);
        return;
      }

      const res = await fetch('/api/friend/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ targetUserId, action }),
      });

      const result = await res.json();

      if (result.success) {
        setIsOpen(false);
        setIsBlocked(action === 'block');
        // Reload to reflect changes (especially profile hiding)
        window.location.reload();
      } else {
        setIsOpen(false);
        console.error(`${action} user error:`, result.error);
      }
    } catch (error) {
      console.error(`${action} error:`, error);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (action: 'block' | 'unblock') => {
    setIsOpen(true);
    // Store action in state or just handle based on button clicked
  };

  const getDialogText = () => {
    if (isBlocked) {
      return {
        title: 'Unblock User',
        description: `Are you sure you want to unblock ${targetUsername}? They will be able to interact with you again.`,
        confirmLabel: 'Unblock',
        destructive: false,
      };
    } else {
      return {
        title: 'Block User',
        description: `Are you sure you want to block ${targetUsername}? They won't be able to interact with you anymore.`,
        confirmLabel: 'Block',
        destructive: true,
      };
    }
  };

  const dialogText = getDialogText();

  return (
    <>
      <Button
        onClick={() => openDialog(isBlocked ? 'unblock' : 'block')}
        disabled={loading}
        className={`${isBlocked ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
      >
        {loading ? '...' : isBlocked ? 'Unblock User' : 'Block User'}
      </Button>

      <ConfirmDialog
        open={isOpen}
        title={dialogText.title}
        description={dialogText.description}
        confirmLabel={dialogText.confirmLabel}
        destructive={dialogText.destructive}
        isWorking={loading}
        onCancel={() => setIsOpen(false)}
        onConfirm={() => handleAction(isBlocked ? 'unblock' : 'block')}
      />
    </>
  );
}

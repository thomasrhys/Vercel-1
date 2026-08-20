// components/FriendButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabaseAuthClient } from '@/lib/supabase-auth';

interface FriendButtonProps {
  targetUserId: string;
  currentUserId: string | null;
}

export default function FriendButton({ targetUserId, currentUserId }: FriendButtonProps) {
  const [relationship, setRelationship] = useState<'none' | 'pending' | 'friends'>('none');
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkRelationshipAndBlockStatus = async () => {
    if (!currentUserId) {
      setRelationship('none');
      setIsBlocked(false);
      return;
    }

    try {
      const { data: { session } } = await supabaseAuthClient.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/friendship-status?userId=${currentUserId}&targetId=${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      setRelationship(data.status || 'none');

      const blockedRes = await fetch(`/api/friend/is-blocked?targetUserId=${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const blockedData = await blockedRes.json();
      setIsBlocked(blockedData.is_blocked || false);
    } catch (error) {
      console.error('Check status error:', error);
    }
  };

  useEffect(() => {
    checkRelationshipAndBlockStatus();
    const interval = setInterval(checkRelationshipAndBlockStatus, 30000);
    return () => clearInterval(interval);
  }, [targetUserId, currentUserId]);

  const handleClick = async () => {
    if (!currentUserId) {
      alert('Please log in to add friends');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { data: { session } } = await supabaseAuthClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      if (relationship === 'none' || relationship === 'pending') {
        const res = await fetch('/api/friend/send-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ addresseeId: targetUserId }),
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to send friend request');
        }

        if (result.success) {
          setRelationship('pending');
        } else {
          setErrorMessage(result.message || 'Something went wrong');
        }
      }
    } catch (err: any) {
      console.error('Send friend request error:', err);
      setErrorMessage(err.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    const confirmed = confirm('Block this user? They won\'t be able to interact with you.');
    if (!confirmed) return;

    try {
      const { data: { session } } = await supabaseAuthClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/friend/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
    } catch (err: any) {
      console.error('Block user error:', err);
      alert('Failed to block user');
    }
  };

  const handleUnblock = async () => {
    const confirmed = confirm('Unblock this user?');
    if (!confirmed) return;

    try {
      const { data: { session } } = await supabaseAuthClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/friend/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ targetUserId, action: 'unblock' }),
      });

      const result = await res.json();

      if (result.success) {
        setIsBlocked(false);
      } else {
        alert(result.error || 'Failed to unblock user');
      }
    } catch (err: any) {
      console.error('Unblock user error:', err);
      alert('Failed to unblock user');
    }
  };

  if (currentUserId === targetUserId) {
    return null;
  }

  if (isBlocked) {
    return (
      <>
        <button
          onClick={handleUnblock}
          disabled={loading}
          className="px-4 py-2 rounded-md text-sm font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
        >
          {loading ? '...' : 'Unblock User'}
        </button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          You previously blocked this user
        </p>
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading || relationship === 'pending'}
        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          relationship === 'pending'
            ? 'bg-green-600 text-white cursor-default hover:bg-green-600'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        } disabled:opacity-50`}
      >
        {loading ? 'Sending...' : relationship === 'pending' ? 'Request Sent ✓' : 'Add Friend'}
      </button>

      {errorMessage && (
        <p className="text-destructive text-xs mt-2">{errorMessage}</p>
      )}
    </>
  );
}

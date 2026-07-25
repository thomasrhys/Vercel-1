// components/FriendButton.tsx
'use client';

import { useState } from 'react';
import { sendFriendRequest } from '@/app/actions/friends';

interface FriendButtonProps {
  targetUserId: string;
  currentUserId: string | null;
}

export default function FriendButton({ targetUserId, currentUserId }: FriendButtonProps) {
  const [relationship, setRelationship] = useState<'none' | 'pending'>('none');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (!currentUserId) {
      alert('Please log in to add friends');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await sendFriendRequest(targetUserId);
      
      if (result.success) {
        setRelationship('pending');
      } else {
        setErrorMessage(result.message || 'Something went wrong');
      }
    } catch (err: any) {
      // Full error logging - CHECK BROWSER CONSOLE!
      console.error('=== SEND FRIEND REQUEST ERROR ===');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error digest:', err.digest);
      console.error('Stack trace:', err.stack);
      console.error('=== END ERROR ===');
      
      setErrorMessage(err.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  // Don't show button on own profile
  if (currentUserId === targetUserId) {
    return null;
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

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
      console.error('Send friend request error:', err);
      setErrorMessage(err.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  if (currentUserId === targetUserId) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading || relationship === 'pending'}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          relationship === 'pending'
            ? 'bg-green-600 text-white cursor-default'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        } disabled:opacity-50`}
      >
        {loading ? 'Sending...' : relationship === 'pending' ? 'Request Sent ✓' : 'Add Friend'}
      </button>
      
      {errorMessage && (
        <p className="text-red-500 text-xs mt-2">{errorMessage}</p>
      )}
    </>
  );
}

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

  const handleClick = async () => {
    if (!currentUserId) {
      alert('Please log in to add friends');
      return;
    }

    setLoading(true);

    try {
      await sendFriendRequest(targetUserId);
      setRelationship('pending');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (currentUserId === targetUserId) {
    return null;
  }

  const buttonText = {
    none: 'Add Friend',
    pending: 'Request Sent ✓',
  }[relationship];

  return (
    <button
      onClick={handleClick}
      disabled={loading || relationship === 'pending'}
      className={`px-4 py-2 rounded ${
        relationship === 'pending'
          ? 'bg-green-600 cursor-default'
          : 'bg-purple-600 hover:bg-purple-700'
      } text-white disabled:opacity-50 transition-colors`}
    >
      {loading ? 'Loading...' : buttonText}
    </button>
  );
}

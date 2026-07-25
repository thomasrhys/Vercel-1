// components/FriendButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { sendFriendRequest, removeFriend } from '@/app/actions/friends';

interface FriendButtonProps {
  targetUserId: string;
  currentUserId: string | null;
}

export default function FriendButton({ targetUserId, currentUserId }: FriendButtonProps) {
  const [relationship, setRelationship] = useState<'none' | 'pending' | 'friends'>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkRelationship();
  }, [targetUserId, currentUserId]);

  const checkRelationship = async () => {
    if (!currentUserId) {
      setRelationship('none');
      return;
    }

    const res = await fetch(`/api/friendship-status?userId=${currentUserId}&targetId=${targetUserId}`, {
      credentials: 'include', // Send cookies
    });
    const data = await res.json();
    setRelationship(data.status || 'none');
  };

  const handleClick = async () => {
    if (!currentUserId) {
      alert('Please log in to add friends');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (relationship === 'none' || relationship === 'pending') {
        await sendFriendRequest(targetUserId);
        setRelationship('pending');
      } else if (relationship === 'friends') {
        // For unfriending, we'll need to handle friendship ID differently
        // See note below
        const confirmed = confirm('Remove this friend?');
        if (!confirmed) return;
        
        // You'll need to fetch the friendship ID first (see below)
        alert('Unfriend requires friendship ID lookup - coming soon!');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (currentUserId === targetUserId) {
    return null;
  }

  if (error) {
    return <span className="text-red-500 text-sm">{error}</span>;
  }

  const buttonText = {
    none: 'Add Friend',
    pending: 'Request Sent',
    friends: 'Friends ✓',
  }[relationship];

  return (
    <button
      onClick={handleClick}
      disabled={loading || relationship === 'pending' || relationship === 'friends'}
      className={`px-4 py-2 rounded ${
        relationship === 'friends'
          ? 'bg-green-600 hover:bg-green-700 cursor-default'
          : relationship === 'pending'
          ? 'bg-yellow-600 cursor-default'
          : 'bg-purple-600 hover:bg-purple-700'
      } text-white disabled:opacity-50 transition-colors`}
    >
      {loading ? 'Loading...' : buttonText}
    </button>
  );
}

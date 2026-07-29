// components/FriendsList.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Friend {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  accepted_at: string;
}

interface FriendsListProps {
  userId: string;
  currentUserId: string | null;
  friendsVisible: boolean;
}

export default function FriendsList({ userId, currentUserId, friendsVisible }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = currentUserId === userId;
  const canSeeFriends = isOwnProfile || friendsVisible;

  useEffect(() => {
    const fetchFriends = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      if (!canSeeFriends && !isOwnProfile) {
        setFriends([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/friend/list?userId=${userId}`, {
          headers: {},
        });

        const result = await res.json();

        if (result.success && result.data) {
          setFriends(result.data);
        }
      } catch (error) {
        console.error('Fetch friends error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [userId, currentUserId, canSeeFriends, isOwnProfile]);

  const handleRemoveFriend = async (friendshipId: string, friendUsername: string) => {
    const confirmed = confirm(`Remove ${friendUsername} from your friends?`);
    if (!confirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/friend/remove-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ friendshipId }),
      });

      const result = await res.json();

      if (result.success) {
        setFriends(prev => prev.filter(f => f.id !== friendshipId));
      } else {
        alert(result.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Remove friend error:', error);
      alert('Failed to remove friend');
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border border-border p-4">
        <p className="text-center text-muted-foreground">Loading friends...</p>
      </div>
    );
  }

  if (!canSeeFriends && !isOwnProfile) {
    return (
      <div className="rounded-md border border-border p-4">
        <h3 className="font-semibold text-foreground mb-2">Friends</h3>
        <p className="text-center text-muted-foreground py-4">
          This user has hidden their friends list
        </p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="rounded-md border border-border p-4">
        <h3 className="font-semibold text-foreground mb-2">Friends</h3>
        <p className="text-center text-muted-foreground py-4">
          {isOwnProfile 
            ? "You haven't added any friends yet."
            : "This user has no friends yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border p-4">
      <h3 className="font-semibold text-foreground mb-3">
        Friends ({friends.length})
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {friends.map((friend) => (
          <div key={friend.id} className="group flex flex-col items-center p-3 rounded-lg hover:bg-muted transition-colors relative">
            {friend.avatar_url ? (
              <a href={`/${friend.username}`} className="w-16 h-16 rounded-full overflow-hidden mb-2 group-hover:scale-105 transition-transform block">
                <img 
                  src={friend.avatar_url} 
                  alt={friend.display_name}
                  className="w-full h-full object-cover"
                />
              </a>
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
                {(friend.display_name || friend.username).charAt(0).toUpperCase()}
              </div>
            )}

            <a href={`/${friend.username}`} className="font-medium text-sm text-foreground text-center truncate w-full hover:underline">
              {friend.display_name || friend.username}
            </a>
            <p className="text-xs text-muted-foreground text-center truncate w-full">
              @{friend.username}
            </p>

            {isOwnProfile && (
              <button
                onClick={() => handleRemoveFriend(friend.id, friend.display_name || friend.username)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove friend"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

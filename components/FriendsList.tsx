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
  userId: string; // Profile user_id being viewed
  currentUserId: string | null;
}

export default function FriendsList({ userId, currentUserId }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        // Check if viewing own profile
        setIsOwnProfile(currentUserId === userId);
        
        // For now, we'll show everyone's friends list (if you want to restrict, we can add RLS later)
        const res = await fetch(`/api/friend/list?userId=${userId}`, {
          headers: currentUserId ? {} : {},
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

    if (userId) {
      fetchFriends();
    }
  }, [userId, currentUserId]);

  if (loading) {
    return (
      <div className="rounded-md border border-border p-4">
        <p className="text-center text-muted-foreground">Loading friends...</p>
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
            : `${display_name || username} has no friends yet.`}
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
          <a
            key={friend.id}
            href={`/${friend.username}`}
            className="group flex flex-col items-center p-3 rounded-lg hover:bg-muted transition-colors"
          >
            {friend.avatar_url ? (
              <img 
                src={friend.avatar_url} 
                alt={friend.display_name}
                className="w-16 h-16 rounded-full object-cover mb-2 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
                {(friend.display_name || friend.username).charAt(0).toUpperCase()}
              </div>
            )}
            
            <p className="font-medium text-sm text-foreground text-center truncate w-full">
              {friend.display_name || friend.username}
            </p>
            <p className="text-xs text-muted-foreground text-center truncate w-full">
              @{friend.username}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

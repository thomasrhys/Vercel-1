// components/FriendNotificationBell.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabaseAuthClient } from '@/lib/supabase-auth';
import PendingRequestsModal from './PendingRequestsModal';

export default function FriendNotificationBell() {
  const [hasRequests, setHasRequests] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRequestCount = async () => {
    try {
      const { data: { session } } = await supabaseAuthClient.auth.getSession();
      if (!session?.access_token) {
        setHasRequests(false);
        setRequestCount(0);
        return;
      }

      const res = await fetch('/api/friend/pending-requests', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await res.json();
      
      if (result.success && result.data) {
        const count = result.data.length;
        setRequestCount(count);
        setHasRequests(count > 0);
      }
    } catch (error) {
      console.error('Fetch request count error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestCount();
    const interval = setInterval(fetchRequestCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = async () => {
    setIsModalOpen(true);
    setHasRequests(false);
    setRequestCount(0);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setTimeout(fetchRequestCount, 500);
  };

  if (loading) {
    return <div className="w-8 h-8" />;
  }

  return (
    <>
      <button
        onClick={handleBellClick}
        className="relative p-2 hover:bg-muted rounded-full transition-colors"
        aria-label="Friend requests"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-foreground"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        
        {hasRequests && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center min-w-[20px]">
            {requestCount}
          </span>
        )}
      </button>

      <PendingRequestsModal isOpen={isModalOpen} onClose={handleClose} />
    </>
  );
}

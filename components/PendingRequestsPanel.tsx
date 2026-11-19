// components/PendingRequestsPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabaseAuthClient } from '@/lib/supabase-auth';
import { t } from '@/lib/i18n';

interface PendingRequest {
  id: string;
  requester_id: string;
  created_at: string;
  requester: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
}

export default function PendingRequestsPanel() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const { data: { session } } = await supabaseAuthClient.auth.getSession();
      if (!session?.access_token) {
        setRequests([]);
        return;
      }

      const res = await fetch('/api/friend/pending-requests', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        setRequests([]);
        return;
      }

      const result = await res.json().catch(() => null);
      
      if (result?.success && Array.isArray(result.data)) {
        setRequests(result.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Fetch pending requests error:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResponse = async (friendshipId: string, action: 'accept' | 'decline') => {
    setUpdatingId(friendshipId);
    setErrorMessage(null);
    
    try {
      const { data: { session } } = await supabaseAuthClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/friend/respond-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ friendshipId, action }),
      });

      const result = await res.json().catch(() => null);
      
      if (res.ok && result?.success) {
        setRequests(prev => prev.filter(r => r.id !== friendshipId));
      } else {
        setErrorMessage(result?.message || result?.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Handle response error:', error);
      setErrorMessage('Failed to respond');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t("Loading requests...")}</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        {t("No pending friend requests")}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      {errorMessage && (
        <div className="rounded-md bg-red-500/20 text-red-700 p-3 text-sm">
          {errorMessage}
        </div>
      )}
      <h3 className="font-semibold text-foreground flex items-center justify-between">
        {t("Friend Requests")}
        <span className="text-sm font-normal text-muted-foreground">
          {requests.length}
        </span>
      </h3>
      
      <div className="space-y-2">
        {requests.map((request) => (
          <div 
            key={request.id} 
            className="flex items-center justify-between p-3 bg-muted rounded-md"
          >
            <div className="flex items-center gap-3">
              {request.requester?.avatar_url ? (
                <img 
                  src={request.requester.avatar_url}
                  alt={request.requester.display_name || request.requester.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {(request.requester?.display_name || request.requester?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              
              <div>
                <p className="font-medium text-foreground">
                  {request.requester?.display_name || request.requester?.username || 'Unknown user'}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{request.requester?.username || 'unknown'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(request.id, 'accept')}
                disabled={updatingId === request.id}
                className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {updatingId === request.id ? '...' : 'Accept'}
              </button>
              <button
                onClick={() => handleResponse(request.id, 'decline')}
                disabled={updatingId === request.id}
                className="px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 border border-border disabled:opacity-50"
              >
                {updatingId === request.id ? '...' : 'Decline'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

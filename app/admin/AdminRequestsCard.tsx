"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/clerk-compat";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Check, Inbox, Plus, RotateCcw, Trash2 } from "lucide-react";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

type GameRequest = {
  id: string;
  game_name: string;
  game_link: string | null;
  comments: string | null;
  request_count: number;
  status: "open" | "completed";
  created_at: string;
  updated_at: string;
};

export default function AdminRequestsCard() {
  const { isSignedIn, user } = useUser();
  const isAdmin = !!user?.id && ADMIN_USER_IDS.includes(user.id);

  const [requests, setRequests] = useState<GameRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [requestToDelete, setRequestToDelete] = useState<GameRequest | null>(null);

  const openRequests = requests.filter((request) => request.status === "open");
  const completedRequests = requests.filter((request) => request.status === "completed");

  const loadRequests = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/requests");
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setRequests(data);
      } else {
        setMessage(`✗ ${data.error || "Failed to load requests"}`);
      }
    } catch (error) {
      setMessage("Failed to load requests");
      console.error("[requests] Load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadRequests();
    }
  }, [isAdmin]);

  const updateRequestStatus = async (request: GameRequest, status: "open" | "completed") => {
    setWorkingId(request.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, status }),
      });

      const data = await response.json();

      if (response.ok && data.request) {
        setRequests((currentRequests) =>
          currentRequests.map((currentRequest) =>
            currentRequest.id === request.id ? data.request : currentRequest
          )
        );
        setMessage(status === "completed" ? "✓ Request completed" : "✓ Request reopened");
      } else {
        setMessage(`✗ ${data.error || "Failed to update request"}`);
      }
    } catch (error) {
      setMessage("Failed to update request");
      console.error("[requests] Update error:", error);
    } finally {
      setWorkingId(null);
    }
  };

  const deleteRequest = async () => {
    if (!requestToDelete) return;

    setWorkingId(requestToDelete.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestToDelete.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setRequests((currentRequests) =>
          currentRequests.filter((currentRequest) => currentRequest.id !== requestToDelete.id)
        );
        setRequestToDelete(null);
        setMessage("✓ Request deleted");
      } else {
        setMessage(`✗ ${data.error || "Failed to delete request"}`);
      }
    } catch (error) {
      setMessage("Failed to delete request");
      console.error("[requests] Delete error:", error);
    } finally {
      setWorkingId(null);
    }
  };

  const openAddGameForRequest = (request: GameRequest) => {
    const params = new URLSearchParams();
    params.set("title", request.game_name);
    params.set("requestId", request.id);

    if (request.game_link) {
      params.set("url", request.game_link);
    }

    window.location.href = `/admin?${params.toString()}`;
  };

  if (!isSignedIn || !isAdmin) {
    return null;
  }

  const renderRequest = (request: GameRequest) => (
    <div key={request.id} className="rounded-md border border-border p-3 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground truncate">{request.game_name}</p>
            <span className="text-xs rounded px-2 py-0.5 bg-primary/10 text-primary">
              {request.request_count} {request.request_count === 1 ? "request" : "requests"}
            </span>
            {request.status === "completed" && (
              <span className="text-xs rounded px-2 py-0.5 bg-green-500/20 text-green-700">
                Completed
              </span>
            )}
          </div>

          {request.game_link && (
            <a href={request.game_link} target="_blank" rel="noreferrer" className="text-xs text-primary underline break-all">
              {request.game_link}
            </a>
          )}

          {request.comments && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
              {request.comments}
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {request.status === "open" && (
            <Button type="button" variant="outline" size="icon" onClick={() => openAddGameForRequest(request)} disabled={workingId === request.id} className="h-8 w-8" title="Add game from request">
              <Plus className="h-4 w-4" />
            </Button>
          )}

          {request.status === "open" ? (
            <Button type="button" variant="outline" size="icon" onClick={() => updateRequestStatus(request, "completed")} disabled={workingId === request.id} className="h-8 w-8" title="Mark completed">
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" variant="outline" size="icon" onClick={() => updateRequestStatus(request, "open")} disabled={workingId === request.id} className="h-8 w-8" title="Reopen request">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}

          <Button type="button" variant="destructive" size="icon" onClick={() => setRequestToDelete(request)} disabled={workingId === request.id} className="h-8 w-8" title="Delete request">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background p-4 sm:px-8 sm:pt-8 sm:pb-0">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Game Requests
                </CardTitle>
                <CardDescription>Review requests sent from the homepage form.</CardDescription>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={loadRequests} disabled={isLoading}>
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {openRequests.length} open · {completedRequests.length} completed
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>
                {message}
              </div>
            )}

            <div className="space-y-3">
              {openRequests.map(renderRequest)}

              {openRequests.length === 0 && (
                <div className="rounded-md border border-border p-4 text-sm text-muted-foreground text-center">
                  No open requests.
                </div>
              )}
            </div>

            {completedRequests.length > 0 && (
              <details className="space-y-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  Completed requests ({completedRequests.length})
                </summary>
                <div className="space-y-3 pt-3">
                  {completedRequests.map(renderRequest)}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!requestToDelete}
        title="Delete request?"
        description={`Delete the request for "${requestToDelete?.game_name || "this game"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isWorking={!!workingId}
        onCancel={() => setRequestToDelete(null)}
        onConfirm={deleteRequest}
      />
    </div>
  );
}

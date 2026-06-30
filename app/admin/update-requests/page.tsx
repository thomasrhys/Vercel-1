"use client";

import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Lock, RefreshCcw } from "lucide-react";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

type UpdateRequest = {
  id: string;
  game_id: string | null;
  game_name: string;
  current_url: string | null;
  update_type: string;
  details: string | null;
  new_url: string | null;
  email: string | null;
  status: "open" | "completed";
  created_at: string;
};

export default function AdminUpdateRequestsPage() {
  const { isSignedIn, user } = useUser();
  const isAdmin = !!user?.id && ADMIN_USER_IDS.includes(user.id);
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/update-requests");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setRequests(data);
      else setMessage(data.error || "Failed to load update requests");
    } catch (error) {
      console.error("[update-requests] Load error:", error);
      setMessage("Failed to load update requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadRequests();
  }, [isAdmin]);

  const markCompleted = async (id: string) => {
    const response = await fetch("/api/admin/update-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed" }),
    });
    const data = await response.json();
    if (response.ok) {
      setRequests((current) => current.map((item) => (item.id === id ? data : item)));
    } else {
      setMessage(data.error || "Failed to update request");
    }
  };

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><Lock className="h-5 w-5" />Admin Login Required</CardTitle>
            <CardDescription>Sign in to view update requests.</CardDescription>
          </CardHeader>
          <CardContent><SignInButton mode="modal"><Button>Sign In</Button></SignInButton></CardContent>
        </Card>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader><CardTitle>Access denied</CardTitle><CardDescription>Your account is not authorised for admin access.</CardDescription></CardHeader>
          <CardContent><Button onClick={() => (window.location.href = "/")}>Back to Games</Button></CardContent>
        </Card>
      </main>
    );
  }

  const openRequests = requests.filter((item) => item.status === "open");
  const completedRequests = requests.filter((item) => item.status === "completed");

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><RefreshCcw className="h-7 w-7" />Update Requests</h1>
            <p className="text-muted-foreground">{openRequests.length} open update requests.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => (window.location.href = "/admin")}>Admin Dashboard</Button>
            <Button onClick={loadRequests} disabled={isLoading}>{isLoading ? "Refreshing..." : "Refresh"}</Button>
          </div>
        </div>

        {message && <div className="rounded-md bg-red-500/20 text-red-700 p-3 text-sm">✗ {message}</div>}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Open</h2>
          {openRequests.length === 0 && <Card><CardContent className="p-4 text-sm text-muted-foreground">No open update requests.</CardContent></Card>}
          {openRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle>{request.game_name}</CardTitle>
                <CardDescription>{request.update_type} • {new Date(request.created_at).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {request.game_id && <p><strong>Game ID:</strong> {request.game_id}</p>}
                {request.current_url && <p className="break-all"><strong>Current URL:</strong> {request.current_url}</p>}
                {request.new_url && <p className="break-all"><strong>Suggested URL:</strong> {request.new_url}</p>}
                {request.details && <p><strong>Details:</strong> {request.details}</p>}
                {request.email && <p><strong>Email:</strong> {request.email}</p>}
                <Button size="sm" onClick={() => markCompleted(request.id)}><Check className="h-4 w-4 mr-1" />Mark Completed</Button>
              </CardContent>
            </Card>
          ))}
        </section>

        {completedRequests.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Completed</h2>
            {completedRequests.map((request) => (
              <Card key={request.id} className="opacity-75">
                <CardHeader>
                  <CardTitle>{request.game_name}</CardTitle>
                  <CardDescription>{request.update_type} • Completed</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

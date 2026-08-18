// app/admin/problem-reports/page.tsx
// Auth migration: Clerk → Pure Supabase with role-based permissions

"use client";

import { useEffect, useState } from "react";
import { useUser, supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Check, Lock } from "lucide-react";

type ProblemReport = {
  id: string;
  game_id: string | null;
  game_name: string;
  game_url: string | null;
  problem_type: string;
  details: string | null;
  device: string | null;
  email: string | null;
  status: "open" | "completed";
  created_at: string;
};

export default function AdminProblemReportsPage() {
  const { isSignedIn, user, loading, signOut } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check admin role from user_profiles table
  useEffect(() => {
    if (!isSignedIn || !user?.id || loading) return;

    const checkAdminRole = async () => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(profile?.role === 'owner' || profile?.role === 'admin');
    };

    checkAdminRole();
  }, [isSignedIn, user?.id, loading]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/problem-reports");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setReports(data);
      else setMessage(data.error || "Failed to load reports");
    } catch (error) {
      console.error("[problem-reports] Load error:", error);
      setMessage("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && isAdmin) loadReports();
  }, [isAdmin, loading]);

  const markCompleted = async (id: string) => {
    const response = await fetch("/api/admin/problem-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed" }),
    });
    const data = await response.json();
    if (response.ok) {
      setReports((current) => current.map((report) => (report.id === id ? data : report)));
    } else {
      setMessage(data.error || "Failed to update report");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><Lock className="h-5 w-5" />Admin Login Required</CardTitle>
            <CardDescription>Sign in to view problem reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => (window.location.href = "/auth/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>Your account is not authorised for admin access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => signOut()}>Sign Out</Button>
            <Button className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const openReports = reports.filter((report) => report.status === "open");
  const completedReports = reports.filter((report) => report.status === "completed");

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><AlertTriangle className="h-7 w-7" />Problem Reports</h1>
            <p className="text-muted-foreground">{openReports.length} open reports.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => (window.location.href = "/admin")}>Admin Dashboard</Button>
            <Button onClick={loadReports} disabled={isLoading}>{isLoading ? "Refreshing..." : "Refresh"}</Button>
          </div>
        </div>

        {message && <div className="rounded-md bg-red-500/20 text-red-700 p-3 text-sm">✗ {message}</div>}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Open</h2>
          {openReports.length === 0 && <Card><CardContent className="p-4 text-sm text-muted-foreground">No open problem reports.</CardContent></Card>}
          {openReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.game_name}</CardTitle>
                <CardDescription>{report.problem_type} • {new Date(report.created_at).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {report.game_id && <p><strong>Game ID:</strong> {report.game_id}</p>}
                {report.game_url && <p className="break-all"><strong>Game URL:</strong> {report.game_url}</p>}
                {report.details && <p><strong>Details:</strong> {report.details}</p>}
                {report.device && <p><strong>Device:</strong> {report.device}</p>}
                {report.email && <p><strong>Email:</strong> {report.email}</p>}
                <Button size="sm" onClick={() => markCompleted(report.id)}><Check className="h-4 w-4 mr-1" />Mark Completed</Button>
              </CardContent>
            </Card>
          ))}
        </section>

        {completedReports.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Completed</h2>
            {completedReports.map((report) => (
              <Card key={report.id} className="opacity-75">
                <CardHeader>
                  <CardTitle>{report.game_name}</CardTitle>
                  <CardDescription>{report.problem_type} • Completed</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

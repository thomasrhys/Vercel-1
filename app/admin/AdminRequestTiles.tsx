// app/admin/adminrequesttiles.tsx
// Auth migration: Clerk → Pure Supabase with role-based permissions

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/lib/supabase-client";
import { AlertTriangle, Gamepad2, RefreshCcw } from "lucide-react";

type Profile = {
  role: string;
};

type StatusItem = {
  status?: string;
};

export default function AdminRequestTiles() {
  const { isSignedIn, user, loading } = useUser();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [gameRequests, setGameRequests] = useState(0);
  const [problemReports, setProblemReports] = useState(0);
  const [updateRequests, setUpdateRequests] = useState(0);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Check admin role from user_profiles table
  useEffect(() => {
    if (!isSignedIn || !user?.id || loading) return;

    const checkAdminRole = async () => {
      const supabase = (window as any).__supabaseClient; // Or import from @/lib/supabase-client
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(profile?.role === 'owner' || profile?.role === 'admin');
    };

    checkAdminRole();
  }, [isSignedIn, user?.id, loading]);

  useEffect(() => {
    if (!isAdmin) return;

    const insertTarget = () => {
      const heading = Array.from(document.querySelectorAll("h1")).find((item) => item.textContent?.trim() === "Admin Dashboard");
      const headerBlock = heading?.parentElement?.parentElement;
      const dashboardContainer = headerBlock?.parentElement;

      if (!headerBlock || !dashboardContainer) return;

      let target = document.getElementById("admin-request-tiles-slot");
      if (!target) {
        target = document.createElement("div");
        target.id = "admin-request-tiles-slot";
        headerBlock.insertAdjacentElement("afterend", target);
      }

      setPortalTarget(target);
    };

    const timeout = window.setTimeout(insertTarget, 0);
    return () => window.clearTimeout(timeout);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadCounts = async () => {
      const [gameResponse, problemResponse, updateResponse] = await Promise.allSettled([
        fetch("/api/admin/requests").then((response) => response.json()),
        fetch("/api/admin/problem-reports").then((response) => response.json()),
        fetch("/api/admin/update-requests").then((response) => response.json()),
      ]);

      if (gameResponse.status === "fulfilled" && Array.isArray(gameResponse.value)) {
        setGameRequests(gameResponse.value.filter((item: StatusItem) => item.status === "open").length);
      }

      if (problemResponse.status === "fulfilled" && Array.isArray(problemResponse.value)) {
        setProblemReports(problemResponse.value.filter((item: StatusItem) => item.status === "open").length);
      }

      if (updateResponse.status === "fulfilled" && Array.isArray(updateResponse.value)) {
        setUpdateRequests(updateResponse.value.filter((item: StatusItem) => item.status === "open").length);
      }
    };

    loadCounts();
  }, [isAdmin]);

  if (!isAdmin || !portalTarget || loading) return null;

  const tiles = [
    {
      title: "Game Requests",
      href: "/admin/requests",
      count: gameRequests,
      icon: Gamepad2,
      description: "New games to review",
    },
    {
      title: "Problem Reports",
      href: "/admin/problem-reports",
      count: problemReports,
      icon: AlertTriangle,
      description: "Broken games and issues",
    },
    {
      title: "Update Requests",
      href: "/admin/update-requests",
      count: updateRequests,
      icon: RefreshCcw,
      description: "Version and mirror requests",
    },
  ];

  return createPortal(
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <a key={tile.href} href={tile.href} className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Icon className="h-4 w-4" />
              {tile.title}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tile.count} open</p>
            <p className="text-xs text-muted-foreground mt-1">{tile.description}</p>
          </a>
        );
      })}
    </div>,
    portalTarget
  );
}

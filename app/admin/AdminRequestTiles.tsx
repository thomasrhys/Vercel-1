"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AlertTriangle, Gamepad2, RefreshCcw } from "lucide-react";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

type StatusItem = {
  status?: string;
};

export default function AdminRequestTiles() {
  const { isSignedIn, user } = useUser();
  const isAdmin = !!user?.id && ADMIN_USER_IDS.includes(user.id);
  const [gameRequests, setGameRequests] = useState(0);
  const [problemReports, setProblemReports] = useState(0);
  const [updateRequests, setUpdateRequests] = useState(0);

  useEffect(() => {
    if (!isSignedIn || !isAdmin) return;

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
  }, [isSignedIn, isAdmin]);

  if (!isSignedIn || !isAdmin) return null;

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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-4">
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
      </div>
    </div>
  );
}

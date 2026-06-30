"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="border-b border-border bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <a key={tile.href} href={tile.href} className="block">
                <Card className="hover:bg-muted/50 transition h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {tile.count} open
                      </span>
                    </div>
                    <p className="font-semibold text-foreground mt-3">{tile.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tile.description}</p>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

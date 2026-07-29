"use client";

import { useEffect, useState } from "react";
import { SignInButton, SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, DatabaseBackup, Lock, SearchCheck, Settings } from "lucide-react";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

type SiteSettings = {
  site_name?: string;
  footer_text?: string;
  general_email?: string;
  copyright_email?: string;
  maintenance_mode?: string;
};

type ActivityItem = {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
};

type BackupItem = {
  id: string;
  created_at: string;
};

type GameCheckResult = {
  id: string;
  title: string;
  url: string;
  ok: boolean;
  status: number;
  statusText: string;
};

export default function AdminUtilitiesCard() {
  const { isSignedIn, user } = useUser();
  const isAdmin = !!user?.id && ADMIN_USER_IDS.includes(user.id);

  const [settings, setSettings] = useState<SiteSettings>({});
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [checkResults, setCheckResults] = useState<GameCheckResult[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCheckingGames, setIsCheckingGames] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [message, setMessage] = useState("");

  const loadUtilities = async () => {
    try {
      const [settingsRes, activityRes, backupsRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/activity"),
        fetch("/api/admin/backup"),
      ]);

      const [settingsData, activityData, backupsData] = await Promise.all([
        settingsRes.json(),
        activityRes.json(),
        backupsRes.json(),
      ]);

      if (settingsRes.ok) setSettings(settingsData);
      if (activityRes.ok && Array.isArray(activityData)) setActivity(activityData);
      if (backupsRes.ok && Array.isArray(backupsData)) setBackups(backupsData);
    } catch (error) {
      console.error("[admin utilities] load error:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) loadUtilities();
  }, [isAdmin]);

  const saveSettings = async () => {
    setIsSavingSettings(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Settings saved");
        loadUtilities();
      } else {
        setMessage(`✗ ${data.error || "Failed to save settings"}`);
      }
    } catch (error) {
      setMessage("Failed to save settings");
      console.error("[admin utilities] settings error:", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const checkGames = async () => {
    setIsCheckingGames(true);
    setMessage("");
    setCheckResults([]);

    try {
      const response = await fetch("/api/admin/check-games", { method: "POST" });
      const data = await response.json();

      if (response.ok && Array.isArray(data.results)) {
        setCheckResults(data.results);
        setMessage(`✓ Checked ${data.results.length} games`);
        loadUtilities();
      } else {
        setMessage(`✗ ${data.error || "Failed to check games"}`);
      }
    } catch (error) {
      setMessage("Failed to check games");
      console.error("[admin utilities] checker error:", error);
    } finally {
      setIsCheckingGames(false);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/backup", { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Backup created");
        loadUtilities();
      } else {
        setMessage(`✗ ${data.error || "Failed to create backup"}`);
      }
    } catch (error) {
      setMessage("Failed to create backup");
      console.error("[admin utilities] backup error:", error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Utilities Login
            </CardTitle>
            <CardDescription>Sign in with GitHub to access utilities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignInButton mode="modal">
              <Button className="w-full">Sign in</Button>
            </SignInButton>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/admin")}>
              Back to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>You are signed in, but this account does not have admin access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserButton />
            <SignOutButton redirectUrl="/">
              <Button variant="outline" className="w-full">Sign out</Button>
            </SignOutButton>
            <Button className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brokenGames = checkResults.filter((result) => !result.ok);

  return (
    <div className="bg-background p-4 sm:px-8 sm:pt-8 sm:pb-0">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Site Settings
            </CardTitle>
            <CardDescription>
              Change basic site text and maintenance mode without editing code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.startsWith("✓")
                    ? "bg-green-500/20 text-green-700"
                    : "bg-red-500/20 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <input
              value={settings.site_name || ""}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              placeholder="Site name"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />
            <input
              value={settings.footer_text || ""}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              placeholder="Footer text"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />
            <input
              value={settings.general_email || ""}
              onChange={(e) => setSettings({ ...settings, general_email: e.target.value })}
              placeholder="General email"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />
            <input
              value={settings.copyright_email || ""}
              onChange={(e) => setSettings({ ...settings, copyright_email: e.target.value })}
              placeholder="Copyright email"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settings.maintenance_mode === "true"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maintenance_mode: e.target.checked ? "true" : "false",
                  })
                }
              />
              Maintenance mode
            </label>

            <Button className="w-full" onClick={saveSettings} disabled={isSavingSettings}>
              {isSavingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchCheck className="h-5 w-5" />
              Broken Game Checker
            </CardTitle>
            <CardDescription>
              Scan game URLs and flag anything that appears unreachable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={checkGames} disabled={isCheckingGames}>
              {isCheckingGames ? "Checking..." : "Scan Games"}
            </Button>

            {checkResults.length > 0 && (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {brokenGames.length} possible issues found out of {checkResults.length} games.
                </p>

                {brokenGames.slice(0, 10).map((result) => (
                  <div key={result.id} className="rounded-md border border-border p-3">
                    <p className="font-medium text-foreground">{result.title}</p>
                    <p className="text-xs text-muted-foreground break-all">{result.url}</p>
                    <p className="text-xs text-red-700 mt-1">
                      {result.status || "Error"}: {result.statusText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="h-5 w-5" />
              Backups
            </CardTitle>
            <CardDescription>
              Create a manual backup of games, requests, and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={createBackup} disabled={isCreatingBackup}>
              {isCreatingBackup ? "Creating..." : "Create Backup"}
            </Button>

            <div className="space-y-2 text-sm text-muted-foreground">
              {backups.length === 0 && <p>No backups yet.</p>}
              {backups.map((backup) => (
                <p key={backup.id}>Backup created {new Date(backup.created_at).toLocaleString()}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest admin actions and utility events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {activity.length === 0 && (
              <p className="text-muted-foreground">No activity yet.</p>
            )}

            {activity.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-3">
                <p className="font-medium text-foreground">{item.details || item.action}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

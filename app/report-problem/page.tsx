"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";

function ReportProblemContent() {
  const searchParams = useSearchParams();
  const initialGame = useMemo(() => searchParams.get("game") || "", [searchParams]);
  const gameId = useMemo(() => searchParams.get("gameId") || "", [searchParams]);
  const gameUrl = useMemo(() => searchParams.get("url") || "", [searchParams]);

  const [gameName, setGameName] = useState(initialGame);
  const [problemType, setProblemType] = useState("Won't load");
  const [details, setDetails] = useState("");
  const [device, setDevice] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const submitReport = async () => {
    if (!gameName.trim()) {
      setMessage("Please enter the game name.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/report-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName, gameId, gameUrl, problemType, details, device, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setMessage(data.error || "Problem report failed.");
      }
    } catch (error) {
      console.error("[report-problem] Error:", error);
      setMessage("Problem report failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
      <Card className="w-full max-w-xl">
        {submitted ? (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
                Problem Report Submitted
              </CardTitle>
              <CardDescription>Thanks! The problem report has been received.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-green-500/20 text-green-700 p-3 text-sm">✓ Submitted</div>
              <Button className="w-full" onClick={() => (window.location.href = gameId ? `/game/${gameId}` : "/")}>Back to Game</Button>
              <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to All Games</Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                Report a Problem
              </CardTitle>
              <CardDescription>Tell us what is wrong so it can be checked.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Game name</label>
                <input value={gameName} onChange={(event) => setGameName(event.target.value)} maxLength={120} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Problem type</label>
                <select value={problemType} onChange={(event) => setProblemType(event.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                  <option>Won't load</option>
                  <option>Black screen</option>
                  <option>Stuck loading</option>
                  <option>Controls don't work</option>
                  <option>Mobile issue</option>
                  <option>Wrong game</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">What happened?</label>
                <textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Describe the issue..." maxLength={1500} className="w-full min-h-28 px-3 py-2 border border-border rounded-md bg-background text-foreground" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Device/browser, optional</label>
                <input value={device} onChange={(event) => setDevice(event.target.value)} placeholder="Example: Chrome on Android" maxLength={250} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email, optional</label>
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Only if you want us to contact you" maxLength={250} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
              </div>

              {message && <div className="rounded-md bg-red-500/20 text-red-700 p-3 text-sm">✗ {message}</div>}

              <Button className="w-full" onClick={submitReport} disabled={isSubmitting || !gameName.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Problem Report"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => (window.location.href = gameId ? `/game/${gameId}` : "/")}>Cancel</Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ReportProblemPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-4">Loading...</div>}>
      <ReportProblemContent />
    </Suspense>
  );
}

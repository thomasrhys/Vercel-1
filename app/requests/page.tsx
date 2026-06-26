"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gamepad2, Send, CheckCircle2 } from "lucide-react";

export default function RequestsPage() {
  const [gameName, setGameName] = useState("");
  const [gameLink, setGameLink] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const submitRequest = async () => {
    if (!gameName.trim()) {
      setMessage("Please enter a game name.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/request-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameName,
          gameLink,
          comments,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setGameName("");
        setGameLink("");
        setComments("");
      } else {
        setMessage(data.error || "Request failed.");
      }
    } catch (error) {
      setMessage("Request failed.");
      console.error("[request-game] Error:", error);
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
                Request Submitted
              </CardTitle>
              <CardDescription>
                Thanks! Your game request has been received.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-md bg-green-500/20 text-green-700 p-3 text-sm">
                ✓ Submitted
              </div>

              <Button className="w-full" onClick={() => (window.location.href = "/")}>
                Back to Games
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                }}
              >
                Submit Another Request
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-6 w-6" />
                Request a Game
              </CardTitle>
              <CardDescription>
                Tell us what game you would like to see added to the portal.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Game name
                </label>
                <input
                  value={gameName}
                  onChange={(event) => setGameName(event.target.value)}
                  placeholder="Enter game name"
                  maxLength={120}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Optional link
                </label>
                <input
                  value={gameLink}
                  onChange={(event) => setGameLink(event.target.value)}
                  placeholder="Paste a link if you have one"
                  maxLength={500}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Optional comments
                </label>
                <textarea
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                  placeholder="Anything else we should know?"
                  maxLength={1000}
                  className="w-full min-h-28 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>

              {message && (
                <div className="rounded-md bg-red-500/20 text-red-700 p-3 text-sm">
                  ✗ {message}
                </div>
              )}

              <Button
                className="w-full"
                onClick={submitRequest}
                disabled={isSubmitting || !gameName.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => (window.location.href = "/")}
              >
                Back to Games
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

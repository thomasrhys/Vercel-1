"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, RefreshCcw, Send } from "lucide-react";
import { t } from "@/lib/i18n";

function RequestUpdateContent() {
  const searchParams = useSearchParams();
  const initialGame = useMemo(() => searchParams.get("game") || "", [searchParams]);
  const gameId = useMemo(() => searchParams.get("gameId") || "", [searchParams]);
  const currentUrl = useMemo(() => searchParams.get("url") || "", [searchParams]);

  const [gameName, setGameName] = useState(initialGame);
  const [updateType, setUpdateType] = useState("New version");
  const [details, setDetails] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const submitUpdateRequest = async () => {
    if (!gameName.trim()) {
      setMessage("Please enter the game name.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/request-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName, gameId, currentUrl, updateType, details, newUrl, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setMessage(data.error || "Update request failed.");
      }
    } catch (error) {
      console.error("[request-update] Error:", error);
      setMessage("Update request failed.");
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
                {t("Update Request Submitted")}
              </CardTitle>
              <CardDescription>{t("Thanks! The update request has been received.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-green-500/20 text-green-700 p-3 text-sm">{t("✓ Submitted")}</div>
              <Button className="w-full" onClick={() => (window.location.href = gameId ? `/game/${gameId}` : "/")}>{t("Back to Game")}</Button>
              <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>{t("Back to All Games")}</Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCcw className="h-6 w-6" />
                {t("Request an Update")}
              </CardTitle>
              <CardDescription>{t("Suggest a newer version, better mirror, or improvement for this game.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("Game name")}</label>
                <input value={gameName} onChange={(event) => setGameName(event.target.value)} placeholder={t("Game name")} maxLength={120} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("Update type")}</label>
                <select value={updateType} onChange={(event) => setUpdateType(event.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                  <option>{t("New version")}</option>
                  <option>{t("Better quality")}</option>
                  <option>{t("New mirror")}</option>
                  <option>{t("Mobile support")}</option>
                  <option>{t("Fix controls")}</option>
                  <option>{t("Other")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("Suggested link, optional")}</label>
                <input value={newUrl} onChange={(event) => setNewUrl(event.target.value)} placeholder={t("Paste a link if you have one")} maxLength={500} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("Details")}</label>
                <textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder={t("What should be updated?")} maxLength={1500} className="w-full min-h-28 px-3 py-2 border border-border rounded-md bg-background text-foreground" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("Email, optional")}</label>
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("Only if you want us to contact you")} maxLength={250} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground" />
              </div>

              {message && <div className="rounded-md bg-red-500/20 text-red-700 p-3 text-sm">✗ {message}</div>}

              <Button className="w-full" onClick={submitUpdateRequest} disabled={isSubmitting || !gameName.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? t("Submitting...") : t("Submit Update Request")}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => (window.location.href = gameId ? `/game/${gameId}` : "/")}>{t("Cancel")}</Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default function RequestUpdatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-4">{t("Loading...")}</div>}>
      <RequestUpdateContent />
    </Suspense>
  );
}

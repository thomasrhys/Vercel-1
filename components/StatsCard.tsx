// components/StatsCard.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";

type StatsCardProps = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  accentColour: string;
  gamesPlayed: number;
  recentGames: Array<{
    id: string;
    title: string;
    image?: string | null;
  }>;
};

const ACCENT_MAP: Record<string, string> = {
  purple: "#6d4aff",
  blue: "#3b82f6",
  green: "#22c55e",
  pink: "#ec4899",
  orange: "#f97316",
  red: "#ef4444",
  white: "#ffffff",
  black: "#000000",
  system: "#3b82f6",
};

export default function StatsCard({
  userId,
  displayName,
  username,
  avatarUrl,
  accentColour,
  gamesPlayed,
  recentGames,
}: StatsCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const accentHex = ACCENT_MAP[accentColour] || ACCENT_MAP.blue;

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const drawDefaultAvatar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    name: string,
    accent: string
  ) => {
    ctx.fillStyle = accent;
    roundRect(ctx, x, y, size, size, size / 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${size * 0.45}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.slice(0, 1).toUpperCase(), x + size / 2, y + size / 2);
    ctx.textBaseline = "alphabetic";
  };

  const drawGamePlaceholder = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    ctx.fillStyle = "#333333";
    ctx.fillRect(x, y, w, h);
    // Draw a simple gamepad icon
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#555555";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎮", cx, cy);
    ctx.textBaseline = "alphabetic";
  };

  const generate = async () => {
    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const W = 1080;
      const H = 1350;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background — dark gradient
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "#0f0f0f");
      bgGrad.addColorStop(1, "#1a1a1a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle accent glow in top-left
      const glowGrad = ctx.createRadialGradient(120, 120, 0, 120, 120, 400);
      glowGrad.addColorStop(0, accentHex + "22");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, W, H);

      // === TOP LEFT: Avatar ===
      const avatarSize = 140;
      const avatarX = 60;
      const avatarY = 60;

      if (avatarUrl) {
        try {
          const avatarImg = await loadImage(avatarUrl);
          ctx.save();
          roundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 70);
          ctx.clip();
          ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();
        } catch {
          drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, displayName, accentHex);
        }
      } else {
        drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, displayName, accentHex);
      }

      // Avatar border ring in accent colour
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 4;
      roundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 70);
      ctx.stroke();

      // === UNDER AVATAR: Display name + username ===
      ctx.textAlign = "left";
      
      // Display name (larger, bold, accent colour)
      ctx.fillStyle = accentHex;
      ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
      const dnText = displayName.length > 22 ? displayName.slice(0, 22) + "…" : displayName;
      ctx.fillText(dnText, avatarX, avatarY + avatarSize + 50);

      // Username (smaller, muted)
      ctx.fillStyle = "#999999";
      ctx.font = "32px system-ui, -apple-system, sans-serif";
      ctx.fillText(`@${username}`, avatarX, avatarY + avatarSize + 92);

      // === TOP MIDDLE: Games played stat ===
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${gamesPlayed}`, W / 2, 130);

      ctx.fillStyle = "#999999";
      ctx.font = "28px system-ui, -apple-system, sans-serif";
      ctx.fillText("Games Played", W / 2, 168);

      // Divider line under stat
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 80, 185);
      ctx.lineTo(W / 2 + 80, 185);
      ctx.stroke();

      // === MIDDLE: Recently played games (up to 5) ===
      ctx.textAlign = "center";
      ctx.fillStyle = "#cccccc";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("Recently Played", W / 2, 420);

      const gamesToShow = recentGames.slice(0, 5);
      const cardW = 160;
      const cardH = 160;
      const gap = 20;
      const totalWidth = gamesToShow.length * cardW + (gamesToShow.length - 1) * gap;
      const startX = (W - totalWidth) / 2;
      const startY = 460;

      for (let i = 0; i < gamesToShow.length; i++) {
        const game = gamesToShow[i];
        const gx = startX + i * (cardW + gap);
        const gy = startY;

        // Card background
        ctx.fillStyle = "#222222";
        roundRect(ctx, gx, gy, cardW, cardH, 12);
        ctx.fill();

        // Game image
        if (game.image) {
          try {
            const gameImg = await loadImage(game.image);
            ctx.save();
            roundRect(ctx, gx, gy, cardW, cardH, 12);
            ctx.clip();
            ctx.drawImage(gameImg, gx, gy, cardW, cardH);
            ctx.restore();
          } catch {
            drawGamePlaceholder(ctx, gx, gy, cardW, cardH);
          }
        } else {
          drawGamePlaceholder(ctx, gx, gy, cardW, cardH);
        }

        // Card border
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        roundRect(ctx, gx, gy, cardW, cardH, 12);
        ctx.stroke();

        // Title under card
        ctx.fillStyle = "#aaaaaa";
        ctx.font = "20px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        const titleText = game.title.length > 18 ? game.title.slice(0, 18) + "…" : game.title;
        ctx.fillText(titleText, gx + cardW / 2, gy + cardH + 28);
      }

      // === BOTTOM RIGHT: Game Portal branding ===
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      
      // Gamepad icon (simple drawn version)
      const brandX = W - 60;
      const brandY = H - 60;
      const iconSize = 36;

      // Draw a simple gamepad shape
      ctx.strokeStyle = accentHex;
      ctx.fillStyle = accentHex;
      ctx.lineWidth = 2;
      
      // Gamepad body
      const gpX = brandX - 160;
      const gpY = brandY;
      ctx.beginPath();
      ctx.roundRect(gpX - 18, gpY - 14, 36, 28, 8);
      ctx.stroke();
      
      // Left D-pad dot
      ctx.beginPath();
      ctx.arc(gpX - 8, gpY, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Right buttons
      ctx.beginPath();
      ctx.arc(gpX + 8, gpY - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gpX + 8, gpY + 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // "Game Portal" text
      ctx.fillStyle = accentHex;
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("Game Portal", brandX, brandY);

      ctx.textBaseline = "alphabetic";

      // Convert to preview
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error("Stats card generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const download = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.download = `gameportal-stats-${username}.png`;
    link.href = previewUrl;
    link.click();
  };

  const share = async () => {
    if (!previewUrl) return;

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const file = new File([blob], `gameportal-stats-${username}.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "My Game Portal Stats",
          text: `Check out my Game Portal stats!`,
          files: [file],
        });
      } else {
        download();
      }
    } catch (error) {
      console.error("Share failed:", error);
      download();
    }
  };

  const cancel = () => {
    setPreviewUrl(null);
  };

  return (
    <div className="w-full">
      <Button
        onClick={generate}
        disabled={isGenerating}
        variant="outline"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 mr-2" />
            My Stats Card
          </>
        )}
      </Button>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={cancel}
        >
          <div
            className="bg-card rounded-lg p-4 max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-center text-foreground">
              Your Stats Card
            </h3>
            <img
              src={previewUrl}
              alt="Game Portal Stats"
              className="w-full rounded-lg"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={download}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button className="flex-1" onClick={share}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={cancel}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

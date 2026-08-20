// components/StatsCard.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Share2, Loader2 } from "lucide-react";

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
  statsLoading?: boolean;
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

// Lucide Gamepad2 SVG
const GAMEPAD2_SVG = (colour: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="6" y1="11" x2="10" y2="11"/>
  <line x1="8" y1="9" x2="8" y2="13"/>
  <line x1="15" y1="12" x2="15.01" y2="12"/>
  <line x1="18" y1="10" x2="18.01" y2="10"/>
  <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.152A4 4 0 0 0 17.32 5z"/>
</svg>
`;

export default function StatsCard({
  userId,
  displayName,
  username,
  avatarUrl,
  accentColour,
  gamesPlayed,
  recentGames,
  statsLoading = false,
}: StatsCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // On dark canvas, black accent becomes invisible — swap to white
  const rawAccent = ACCENT_MAP[accentColour] || ACCENT_MAP.blue;
  const accentHex = rawAccent === "#000000" ? "#ffffff" : rawAccent;

  const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback: try without crossOrigin
        const img2 = new Image();
        img2.onload = () => resolve(img2);
        img2.onerror = () => resolve(null);
        img2.src = src;
      };
      img.src = src;
    });
  };

  const loadSvgAsImage = (svgString: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  };

  // Draw an image inverted by manipulating pixels manually
  // This is more reliable than ctx.filter which doesn't work in all browsers
  const drawInvertedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) => {
    // Draw to a temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = dw;
    tempCanvas.height = dh;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      // Fallback: just draw normally
      ctx.drawImage(img, dx, dy, dw, dh);
      return;
    }

    tempCtx.drawImage(img, 0, 0, dw, dh);

    try {
      const imageData = tempCtx.getImageData(0, 0, dw, dh);
      const pixels = imageData.data;

      for (let i = 0; i < pixels.length; i += 4) {
        // Only invert non-transparent pixels
        if (pixels[i + 3] > 0) {
          pixels[i] = 255 - pixels[i];     // R
          pixels[i + 1] = 255 - pixels[i + 1]; // G
          pixels[i + 2] = 255 - pixels[i + 2]; // B
          // Alpha stays the same
        }
      }

      tempCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(tempCanvas, dx, dy, dw, dh);
    } catch {
      // If pixel manipulation fails (CORS), fall back to normal draw
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  };

  // Detect if an image should be inverted for visibility on dark canvas
  const shouldInvertAvatar = (img: HTMLImageElement, avatarUrl: string): boolean => {
    try {
      // Method 1: Check URL for known dark icon patterns
      if (avatarUrl) {
        const lowerUrl = avatarUrl.toLowerCase();
        if (lowerUrl.includes('favicon') || lowerUrl.includes('gamepad') || lowerUrl.includes('icon')) {
          return true;
        }
      }

      // Method 2: Pixel-based detection
      const tempCanvas = document.createElement("canvas");
      const size = Math.min(img.width, img.height, 100);
      tempCanvas.width = size;
      tempCanvas.height = size;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return false;

      tempCtx.drawImage(img, 0, 0, size, size);
      const imageData = tempCtx.getImageData(0, 0, size, size);
      const pixels = imageData.data;

      let totalBrightness = 0;
      let opaquePixels = 0;

      for (let j = 0; j < pixels.length; j += 4) {
        if (pixels[j + 3] < 128) continue;
        totalBrightness += (pixels[j] + pixels[j + 1] + pixels[j + 2]) / 3;
        opaquePixels++;
      }

      if (opaquePixels === 0) return false;

      const avgBrightness = totalBrightness / opaquePixels;
      console.log(`[Avatar] Avg brightness: ${avgBrightness.toFixed(1)} — Inverting`);
      return avgBrightness < 80;
    } catch (err) {
      console.warn("[Avatar] Detection failed:", err);
      return false;
    }
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
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${size * 0.4}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.slice(0, 1).toUpperCase(), x + size / 2, y + size / 2 + 2);
    ctx.textBaseline = "alphabetic";
  };

  const drawGamePlaceholder = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, "#2a2a2a");
    grad.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();

    ctx.font = "40px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#555555";
    ctx.fillText("🎮", x + w / 2, y + h / 2);
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

      // === BACKGROUND ===
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "#0a0a0a");
      bgGrad.addColorStop(0.5, "#121212");
      bgGrad.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Accent glow radiating from top-left
      const glowGrad = ctx.createRadialGradient(150, 200, 0, 150, 200, 600);
      glowGrad.addColorStop(0, accentHex + "20");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle accent line at very top
      const topBar = ctx.createLinearGradient(0, 0, W, 0);
      topBar.addColorStop(0, accentHex);
      topBar.addColorStop(1, "transparent");
      ctx.fillStyle = topBar;
      ctx.fillRect(0, 0, W, 6);

      // === HEADER SECTION ===
      const padX = 70;
      const headerY = 70;

      // Avatar (top-left)
      const avatarSize = 120;
      const avatarX = padX;
      const avatarY = headerY;

      if (avatarUrl) {
        const avatarImg = await loadImage(avatarUrl);
        if (avatarImg) {
          const shouldInvert = shouldInvertAvatar(avatarImg, avatarUrl);
          console.log(`[Stats] Avatar invert: ${shouldInvert}`);

          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.clip();

          if (shouldInvert) {
            // Manual pixel inversion — reliable across all browsers
            drawInvertedImage(ctx, avatarImg, avatarX, avatarY, avatarSize, avatarSize);
          } else {
            ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
          }

          ctx.restore();
        } else {
          drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, displayName, accentHex);
        }
      } else {
        drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, displayName, accentHex);
      }

      // Avatar ring
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();

      // Display name (under avatar, accent coloured)
      ctx.textAlign = "left";
      ctx.fillStyle = accentHex;
      ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
      const dnText = displayName.length > 24 ? displayName.slice(0, 24) + "…" : displayName;
      ctx.fillText(dnText, padX, avatarY + avatarSize + 55);

      // Username (under display name, muted)
      ctx.fillStyle = "#888888";
      ctx.font = "32px system-ui, -apple-system, sans-serif";
      ctx.fillText(`@${username}`, padX, avatarY + avatarSize + 95);

      // === GAMES PLAYED STAT (right side of header) ===
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${gamesPlayed}`, W - padX, headerY + 80);

      ctx.fillStyle = "#888888";
      ctx.font = "26px system-ui, -apple-system, sans-serif";
      ctx.fillText("GAMES PLAYED", W - padX, headerY + 115);

      // Underline for stat
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W - padX - 180, headerY + 132);
      ctx.lineTo(W - padX, headerY + 132);
      ctx.stroke();

      // === RECENTLY PLAYED SECTION ===
      const sectionTitleY = avatarY + avatarSize + 180;

      // Section title with accent
      ctx.textAlign = "left";
      ctx.fillStyle = accentHex;
      ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
      ctx.fillText("RECENTLY PLAYED", padX, sectionTitleY - 20);

      // Line after title
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX + 200, sectionTitleY - 25);
      ctx.lineTo(W - padX, sectionTitleY - 25);
      ctx.stroke();

      // Game cards
      const gamesToShow = recentGames.slice(0, 5);
      const cardStartY = sectionTitleY + 10;
      const cardH = 110;
      const cardGap = 18;
      const cardW = W - padX * 2;

      if (gamesToShow.length === 0) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#555555";
        ctx.font = "28px system-ui, -apple-system, sans-serif";
        ctx.fillText("No games played yet!", W / 2, cardStartY + 60);
      }

      for (let i = 0; i < gamesToShow.length; i++) {
        const game = gamesToShow[i];
        const gy = cardStartY + i * (cardH + cardGap);

        // Card background
        ctx.fillStyle = "#1a1a1a";
        roundRect(ctx, padX, gy, cardW, cardH, 14);
        ctx.fill();

        // Accent left border
        ctx.fillStyle = accentHex;
        roundRect(ctx, padX, gy, 5, cardH, 2);
        ctx.fill();

        // Number (rank)
        ctx.fillStyle = "#444444";
        ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${i + 1}`, padX + 45, gy + cardH / 2 + 2);

        // Game thumbnail
        const thumbSize = 76;
        const thumbX = padX + 80;
        const thumbY = gy + (cardH - thumbSize) / 2;

        if (game.image) {
          const gameImg = await loadImage(game.image);
          if (gameImg) {
            ctx.save();
            roundRect(ctx, thumbX, thumbY, thumbSize, thumbSize, 12);
            ctx.clip();
            ctx.drawImage(gameImg, thumbX, thumbY, thumbSize, thumbSize);
            ctx.restore();
          } else {
            drawGamePlaceholder(ctx, thumbX, thumbY, thumbSize, thumbSize);
          }
        } else {
          drawGamePlaceholder(ctx, thumbX, thumbY, thumbSize, thumbSize);
        }

        // Thumbnail border
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
        roundRect(ctx, thumbX, thumbY, thumbSize, thumbSize, 12);
        ctx.stroke();

        // Game title
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const titleText = game.title.length > 30 ? game.title.slice(0, 30) + "…" : game.title;
        ctx.fillText(titleText, thumbX + thumbSize + 25, gy + cardH / 2 + 2);

        ctx.textBaseline = "alphabetic";
      }

      // === BOTTOM BRANDING (bottom-right, Gamepad2 icon + Game Portal) ===
      const brandY = H - 70;

      // Accent line above branding
      const brandLineGrad = ctx.createLinearGradient(padX, 0, W - padX, 0);
      brandLineGrad.addColorStop(0, "transparent");
      brandLineGrad.addColorStop(0.5, accentHex + "44");
      brandLineGrad.addColorStop(1, "transparent");
      ctx.strokeStyle = brandLineGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, brandY - 25);
      ctx.lineTo(W - padX, brandY - 25);
      ctx.stroke();

      // Draw "Game Portal" text (right-aligned)
      ctx.fillStyle = accentHex;
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("Game Portal", W - padX, brandY);

      // Draw Lucide Gamepad2 icon to the left of the text
      const gamepadImg = await loadSvgAsImage(GAMEPAD2_SVG(accentHex));
      if (gamepadImg) {
        const iconSize = 32;
        const textWidth = ctx.measureText("Game Portal").width;
        const iconX = W - padX - textWidth - 44;
        const iconY = brandY - iconSize / 2;
        ctx.drawImage(gamepadImg, iconX, iconY, iconSize, iconSize);
      }

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
        disabled={isGenerating || statsLoading}
        variant="outline"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : statsLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading stats...
          </>
        ) : (
          <>
            <BarChart3 className="h-4 w-4 mr-2" />
            My Stats Card
          </>
        )}
      </Button>

      <canvas ref={canvasRef} style={{ display: "none" }} />

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

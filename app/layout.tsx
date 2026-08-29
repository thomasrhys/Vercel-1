'use client'; // Converted to client component to listen for native link triggers safely

import type { Metadata } from "next";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import V13Enhancer from "./V13Enhancer";
import AuthFetchPatch from "./AuthFetchPatch";
import FriendProvider from "@/components/FriendProvider";
import { AuthProvider } from '@/lib/supabase-client';
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Note: Next.js App Router ignores server metadata exports if 'use client' is active on the file.
// If your metadata stops loading, move this block into a separate layout wrapper file.
export const metadata: Metadata = {
  title: {
    default: "Game Portal",
    template: "%s | Game Portal"
  },
  description: "Play games online. Game Portal",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://fnfaw.es",
    siteName: "Game Portal",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Game Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Game Portal",
    description: "Play games online.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  // === NEW: MOBILE DEEP LINK HANDLER ===
  useEffect(() => {
    const setupDeepLinks = async () => {
      // Listen for links clicked while the app is frozen/minimized in the background
      await App.addListener('appUrlOpen', (event: { url: string }) => {
        const slugArr = event.url.split('://');
        if (slugArr && slugArr[1]) {
          const gameSlug = slugArr[1].trim(); 
          router.push(`/?play=${gameSlug}`); // Navigates to main page grid with parameter
        }
      });

      // Listen for links clicked while the app is completely closed/killed
      const launchUrlObj = await App.getLaunchUrl();
      if (launchUrlObj && launchUrlObj.url) {
        const slugArr = launchUrlObj.url.split('://');
        if (slugArr && slugArr[1]) {
          const gameSlug = slugArr[1].trim();
          router.push(`/?play=${gameSlug}`);
        }
      }
    };

    // Safely execute only inside the mobile wrapper environment context
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setupDeepLinks();
    }

    return () => {
      App.removeAllListeners();
    };
  }, [router]);
  // ======================================

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta id="theme-color-meta" name="theme-color" content="#0a0a0a" />
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <FriendProvider>
              <AuthFetchPatch />
              <V13Enhancer />
              {process.env.NODE_ENV === "production" && <Analytics />}
              {children}
            </FriendProvider>
          </AuthProvider>
        </ThemeProvider>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => undefined);
                });
              }
            `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              function updateThemeColor() {
                const isDark = document.documentElement.classList.contains('dark');
                document.getElementById('theme-color-meta').setAttribute('content', isDark ? '#0a0a0a' : '#ffffff');
              }

              updateThemeColor();

              window.addEventListener('storage', (e) => {
                if (e.key === 'theme') {
                  setTimeout(updateThemeColor, 50);
                }
              });

              const observer = new MutationObserver(updateThemeColor);
              observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            `,
          }}
        />
      </body>
    </html>
  );
}

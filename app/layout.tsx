import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import V13Enhancer from "./V13Enhancer";
import AuthFetchPatch from "./AuthFetchPatch";
import FriendProvider from "@/components/FriendProvider";
import { AuthProvider } from '@/lib/supabase-client';
import { ThemeProvider } from "@/components/theme-provider";
import CapacitorDeepLinkHandler from "./CapacitorDeepLinkHandler"; // 1. Import the new client handler
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Your server metadata remains perfectly intact and valid!
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta id="theme-color-meta" name="theme-color" content="#0a0a0a" />
        {/* MERGED: Added viewport-fit=cover so your phone's status bar calculations work correctly */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
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
              
              {/* 2. Put the hidden link handler inside your providers */}
              <CapacitorDeepLinkHandler /> 
              
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

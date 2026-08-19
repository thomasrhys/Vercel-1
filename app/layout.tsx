import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import V13Enhancer from "./V13Enhancer";
import AuthFetchPatch from "./AuthFetchPatch";
import FriendProvider from "@/components/FriendProvider";
import { AuthProvider } from '@/lib/supabase-client';
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Game Portal",
  description: "Created by thomasrhys on GitHub",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
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
        {/* Dynamic theme color that updates with dark/light mode */}
        <meta id="theme-color-meta" name="theme-color" content="#0a0a0a" />
        <link rel="manifest" href="/manifest.json" />
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-WS27V73W');`}
        </Script>
      </head>

      <body className="font-sans antialiased">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WS27V73W"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

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

        {/* Service Worker Registration */}
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

        {/* Dynamic Theme Color Sync */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Set initial theme color based on current theme
              function updateThemeColor() {
                const isDark = document.documentElement.classList.contains('dark');
                document.getElementById('theme-color-meta').setAttribute('content', isDark ? '#0a0a0a' : '#ffffff');
              }

              // Run on load
              updateThemeColor();

              // Listen for theme changes via localStorage (used by theme-provider)
              window.addEventListener('storage', (e) => {
                if (e.key === 'theme') {
                  setTimeout(updateThemeColor, 50);
                }
              });

              // Also watch for direct class changes on html element
              const observer = new MutationObserver(updateThemeColor);
              observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            `,
          }}
        />
      </body>
    </html>
  );
}

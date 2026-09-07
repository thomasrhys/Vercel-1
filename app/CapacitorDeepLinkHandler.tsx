'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';

export default function CapacitorDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const setupDeepLinks = async () => {
      // 1. Listen for links clicked while the app is running in the background
      await App.addListener('appUrlOpen', (event: { url: string }) => {
        const slugArr = event.url.split('://');
        if (slugArr && slugArr[1]) {
          const gameSlug = slugArr[1].trim(); 
          router.push(`/?play=${gameSlug}`); 
        }
      });

      // 2. Check if the app was opened from a dead close via a link
      const launchUrlObj = await App.getLaunchUrl();
      if (launchUrlObj && launchUrlObj.url) {
        const slugArr = launchUrlObj.url.split('://');
        if (slugArr && slugArr[1]) {
          const gameSlug = slugArr[1].trim();
          router.push(`/?play=${gameSlug}`);
        }
      }
    };

    // Only run if inside the Capacitor native app environment wrapper
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setupDeepLinks();
    }

    return () => {
      App.removeAllListeners();
    };
  }, [router]);

  return null; // This component doesn't render any visible UI
}

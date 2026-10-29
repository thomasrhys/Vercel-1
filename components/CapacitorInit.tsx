'use client';

import { useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function CapacitorInit() {
  useEffect(() => {
    // Only run this if the app is running natively on Android or iOS
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch((e) => {
        console.log('Status bar error:', e);
      });
    }
  }, []);

  return null; // This component doesn't render any visual HTML
}
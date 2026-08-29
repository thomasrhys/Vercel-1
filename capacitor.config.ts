import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fnfaw.gamesportal',
  appName: 'Game Portal',
  webDir: 'out',
  server: {
    // This streams your live Vercel environment directly into the mobile wrapper
    url: 'https://fnfaw.es', 
    cleartext: true
  },
  plugins: {
    DeepLinks: {
      schemes: ['GamesPortal']
    }
  }
};

export default config;

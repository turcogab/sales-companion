import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.preventista.app',
  appName: 'Preventista',
  webDir: 'dist',
  server: {
    url: 'https://6b7a1fe7-9c0e-4320-bf24-de929d986228.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;

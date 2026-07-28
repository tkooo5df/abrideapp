import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abride.app',
  appName: 'أبريد',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1078510951177-0daa3ejgcf40jjkhnqd1hgatl0cq4bf6.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#FACC15',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;

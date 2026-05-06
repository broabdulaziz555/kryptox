import type { CapacitorConfig } from '@capacitor/cli';

// ── Read Railway URL from env (baked in at build time for APK) ────────────────
// For APK builds, set NEXT_PUBLIC_API_URL in frontend/.env.production to your Railway URL.
// For local dev with live reload on device, set CAPACITOR_DEV_SERVER_URL=http://YOUR_IP:3000

const devServer = process.env.CAPACITOR_DEV_SERVER_URL;

const config: CapacitorConfig = {
  // ── App Identity ─────────────────────────────────────────────────────────
  appId:   'com.kryptox.app',
  appName: 'KRYPTOX',

  // ── Web Asset Directory ───────────────────────────────────────────────────
  // Next.js static export outputs to 'out/' when CAPACITOR_BUILD=true
  webDir: 'out',

  // ── Server Config ─────────────────────────────────────────────────────────
  server: {
    // androidScheme: 'https' makes the Android WebView use https://localhost
    // instead of http://localhost — required for some security APIs + cookies
    androidScheme: 'https',

    // allowNavigation: let the WebView open your Railway URL links inline
    allowNavigation: [
      '*.up.railway.app',
      '*.vercel.app',
      'assets.coingecko.com',
    ],

    // ── Live Reload (local dev only) ───────────────────────────────────────
    // Uncomment ONE of these for live reload while developing on a real device.
    // Your phone and computer must be on the same WiFi network.
    //
    //   url: 'http://192.168.1.XXX:3000',   // ← replace with your machine's local IP
    //   cleartext: true,                     // allow HTTP on Android for local dev
    //
    // Or set CAPACITOR_DEV_SERVER_URL env var:
    ...(devServer ? { url: devServer, cleartext: true } : {}),
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration:   2000,
      launchAutoHide:       true,
      backgroundColor:      '#0A0A0F',
      androidSplashResourceName: 'splash',
      androidScaleType:     'CENTER_CROP',
      showSpinner:          false,
      splashFullScreen:     true,
      splashImmersive:      true,
    },

    StatusBar: {
      style:           'DARK',
      backgroundColor: '#0A0A0F',
      overlaysWebView: false,
    },

    Keyboard: {
      resize:            'body',
      style:             'DARK',
      resizeOnFullScreen: true,
    },

    // In-app push notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    LocalNotifications: {
      smallIcon:   'ic_stat_kryptox',
      iconColor:   '#7B5EA7',
      sound:       'beep.wav',
    },

    // Clipboard — used for copying addresses and claim links
    Clipboard: {},

    // Share sheet — share profile links, claim links, invoices
    Share: {},

    // Camera — QR code scanning
    Camera: {},

    // Haptics — tactile feedback on send, receive, etc.
    Haptics: {},
  },

  // ── Android ───────────────────────────────────────────────────────────────
  android: {
    // Minimum SDK 24 (Android 7) covers 99%+ of active devices
    minWebViewVersion: 60,

    // Allow mixed content only if needed for local dev (set cleartext above instead)
    // allowMixedContent: false,

    // Keystore for signed release APK — generate with keytool (see DEPLOY.md)
    buildOptions: {
      keystorePath:     '../kryptox.keystore',
      keystorePassword: process.env.KEYSTORE_PASSWORD || '',
      keystoreAlias:    'kryptox',
      keystoreAliasPassword: process.env.KEYSTORE_PASSWORD || '',
      releaseType:      'APK',        // 'AAB' for Play Store upload
    },
  },

  // ── iOS ───────────────────────────────────────────────────────────────────
  ios: {
    contentInset:  'automatic',
    scrollEnabled: true,
    backgroundColor: '#0A0A0F',
  },
};

export default config;

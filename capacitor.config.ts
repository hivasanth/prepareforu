import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ── Identity ──────────────────────────────────────────────────────────────
  appId:   'com.prepareforu.app',
  appName: 'PrepareForU',
  webDir:  'dist',

  // ── Server ────────────────────────────────────────────────────────────────
  // androidScheme: 'https' makes the WebView load the bundled assets via
  // https://localhost instead of file:// or http://localhost.
  // This gives the app a secure origin context — required by:
  //   • Web Crypto API (used by Supabase JWT handling)
  //   • navigator.credentials (future passkey support)
  //   • Service Workers (if added later)
  server: {
    androidScheme: 'https',
    // Never allow the WebView to fall back to a remote URL.
    // The app must always run from the bundled local assets.
    allowNavigation: [],
  },

  // ── Android-specific ──────────────────────────────────────────────────────
  android: {
    // Disable cleartext (HTTP) traffic at the Capacitor bridge layer.
    // The network_security_config.xml enforces this at the OS level too.
    allowMixedContent: false,

    // Capture console.log / console.error from the WebView in Logcat.
    // Disable in production builds via a Gradle productFlavor if desired.
    loggingBehavior: 'none',

    // Disable long-press context menu (copy/paste/inspect) on production.
    // Users don't need "Inspect Element" in a shipped APK.
    webContentsDebuggingEnabled: false,
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  plugins: {
    // SplashScreen: hide immediately after the React app mounts.
    // Install @capacitor/splash-screen if you want a branded splash.
    SplashScreen: {
      launchShowDuration:   0,
      backgroundColor:      '#ffffff',
      showSpinner:          false,
    },
  },
};

export default config;

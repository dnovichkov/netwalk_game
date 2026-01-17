import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';

/**
 * Initialize Capacitor native features
 */
export async function initCapacitor(): Promise<void> {
  if (!isNative) return;

  try {
    // Hide splash screen
    await SplashScreen.hide();

    // Configure status bar on Android
    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
      await StatusBar.setStyle({ style: Style.Dark });
    }
  } catch {
    // Capacitor plugins not available
  }
}

/**
 * Trigger haptic feedback
 */
export async function vibrate(
  style: 'light' | 'medium' | 'heavy' = 'light'
): Promise<void> {
  if (!isNative) {
    // Fallback for web
    if ('vibrate' in navigator) {
      const duration = style === 'light' ? 10 : style === 'medium' ? 25 : 50;
      navigator.vibrate(duration);
    }
    return;
  }

  try {
    const impactStyle =
      style === 'light'
        ? ImpactStyle.Light
        : style === 'medium'
          ? ImpactStyle.Medium
          : ImpactStyle.Heavy;

    await Haptics.impact({ style: impactStyle });
  } catch {
    // Haptics not available
  }
}

/**
 * Exit the app (Android only)
 */
export function exitApp(): void {
  if (isNative) {
    App.exitApp();
  }
}

/**
 * Setup Android back button handler
 */
export function setupBackButton(onBack: () => void): () => void {
  if (!isNative) return () => {};

  let listenerHandle: Awaited<ReturnType<typeof App.addListener>> | null = null;

  App.addListener('backButton', () => {
    onBack();
  }).then((handle) => {
    listenerHandle = handle;
  });

  return () => {
    listenerHandle?.remove();
  };
}

/**
 * Setup app lifecycle handlers
 */
export function setupLifecycle(
  onPause: () => void,
  onResume: () => void
): () => void {
  if (!isNative) return () => {};

  let pauseHandle: Awaited<ReturnType<typeof App.addListener>> | null = null;
  let resumeHandle: Awaited<ReturnType<typeof App.addListener>> | null = null;

  App.addListener('pause', onPause).then((handle) => {
    pauseHandle = handle;
  });
  App.addListener('resume', onResume).then((handle) => {
    resumeHandle = handle;
  });

  return () => {
    pauseHandle?.remove();
    resumeHandle?.remove();
  };
}

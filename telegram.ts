import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { user?: { first_name?: string } };
  colorScheme?: 'light' | 'dark';
  themeParams?: {
    bg_color?: string;
    text_color?: string;
    secondary_bg_color?: string;
    hint_color?: string;
  };
  safeAreaInset?: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
  ready: () => void;
  expand: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  onEvent: (event: string, callback: () => void) => void;
  offEvent: (event: string, callback: () => void) => void;
  openTelegramLink: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: HapticStyle) => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
  MainButton: {
    text: string;
    setParams: (params: Record<string, unknown>) => void;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegram(): TelegramWebApp | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
  return window.Telegram?.WebApp;
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | undefined>(() => getTelegram());
  const [sdkReady, setSdkReady] = useState(Platform.OS !== 'web');
  const [, setThemeRevision] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    const attach = () => {
      const app = getTelegram();
      if (!app || cancelled) return;
      app.ready();
      app.expand();
      setWebApp(app);
      setSdkReady(true);
    };
    attach();
    const readyTimer = setTimeout(() => setSdkReady(true), 2500);
    if (!getTelegram()) {
      const existing = document.querySelector<HTMLScriptElement>('script[data-telegram-web-app]');
      if (existing) {
        existing.addEventListener('load', attach, { once: true });
      } else {
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;
        script.dataset.telegramWebApp = 'true';
        script.onload = attach;
        script.onerror = () => setSdkReady(true);
        document.head.appendChild(script);
      }
    }
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (viewport && !viewport.content.includes('viewport-fit=cover')) {
      viewport.content += ', viewport-fit=cover';
    }
    return () => {
      cancelled = true;
      clearTimeout(readyTimer);
    };
  }, []);

  useEffect(() => {
    if (!webApp) return;
    const onTheme = () => setThemeRevision((value) => value + 1);
    webApp.onEvent('themeChanged', onTheme);
    return () => webApp.offEvent('themeChanged', onTheme);
  }, [webApp]);

  const haptic = useCallback((style: HapticStyle = 'light') => {
    const app = getTelegram();
    if (app?.HapticFeedback) app.HapticFeedback.impactOccurred(style);
    else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(18);
  }, []);

  const notify = useCallback((type: 'error' | 'success' | 'warning') => {
    const app = getTelegram();
    if (app?.HapticFeedback) app.HapticFeedback.notificationOccurred(type);
    else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(type === 'success' ? [25, 45, 35] : 35);
  }, []);

  return { webApp, isTelegram: Boolean(webApp?.initData), sdkReady, haptic, notify };
}

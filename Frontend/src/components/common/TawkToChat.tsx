import { useEffect, useRef } from 'react';

interface TawkApi {
  onLoad?: () => void;
  showWidget?: () => void;
  hideWidget?: () => void;
}

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

export function TawkToChat() {
  const isMounted = useRef(false);
  const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID?.trim();
  const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID?.trim();

  useEffect(() => {
    if (!propertyId || !widgetId) return;

    isMounted.current = true;
    const tawkApi = window.Tawk_API ?? {};
    const previousOnLoad = tawkApi.onLoad;
    tawkApi.onLoad = () => {
      previousOnLoad?.();
      if (isMounted.current) {
        tawkApi.showWidget?.();
      } else {
        tawkApi.hideWidget?.();
      }
    };
    window.Tawk_API = tawkApi;

    const existingScript = document.getElementById('tawk-to-widget');
    if (existingScript) {
      tawkApi.showWidget?.();
    } else {
      window.Tawk_LoadStart = new Date();
      const script = document.createElement('script');
      script.id = 'tawk-to-widget';
      script.async = true;
      script.src = `https://embed.tawk.to/${encodeURIComponent(propertyId)}/${encodeURIComponent(widgetId)}`;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    }

    return () => {
      isMounted.current = false;
      tawkApi.hideWidget?.();
    };
  }, [propertyId, widgetId]);

  return null;
}

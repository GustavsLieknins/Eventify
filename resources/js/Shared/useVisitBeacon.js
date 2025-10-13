import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

function guessCountry() {
  try {
    const langs = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (const l of langs) {
      if (!l) continue;
      const region = new Intl.Locale(l).maximize().region;
      if (region && region.length === 2) return region.toUpperCase();
    }
  } catch {}
  return null;
}

function send(payload) {
  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: 'application/json' });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/telemetry/visit', blob);
  } else {
    fetch('/api/telemetry/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  }
}

export default function useVisitBeacon() {
  const { url } = usePage();
  useEffect(() => {
    const base = {
      path: window.location.pathname,
      referrer: document.referrer || null,
      country: guessCountry(),
    };
    send(base);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords || {};
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            send({ ...base, lat: latitude, lng: longitude });
          }
        },
        () => {},
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
      );
    }
  }, [url]);
}

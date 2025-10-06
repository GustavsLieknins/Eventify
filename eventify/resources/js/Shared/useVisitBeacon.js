import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export default function useVisitBeacon() {
  const { url } = usePage(); 
  useEffect(() => {
    try {
      const payload = { path: window.location.pathname, referrer: document.referrer || null };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/telemetry/visit', blob);
      } else {
        fetch('/api/telemetry/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
    } catch {}
  }, [url]); 
}

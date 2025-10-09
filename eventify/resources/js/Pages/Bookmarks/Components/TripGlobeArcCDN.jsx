import React, { useEffect, useRef, useState } from 'react';

const GLOBE_CDN = 'https://cdn.jsdelivr.net/npm/globe.gl';
const EARTH_IMG = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg';
const BUMP_IMG  = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png';

function toNum(n) { const x = typeof n === 'string' ? parseFloat(n) : n; return Number.isFinite(x) ? x : null; }
function deg2rad(d){return d*Math.PI/180;}
function greatCircleAlt(a,b){ if(!a||!b) return 2.1; const φ1=deg2rad(a.lat), φ2=deg2rad(b.lat), Δλ=deg2rad(b.lng-a.lng); const cosc=Math.sin(φ1)*Math.sin(φ2)+Math.cos(φ1)*Math.cos(φ2)*Math.cos(Δλ); const central=Math.acos(Math.min(1,Math.max(-1,cosc))); const norm=central/Math.PI; return 1.9+norm*0.7; }

async function loadCDN(){
  if (window.Globe) return;
  await new Promise((resolve, reject) => {
    const tag = document.querySelector('script[data-globe-cdn]');
    if (tag) { tag.addEventListener('load', resolve, { once:true }); tag.addEventListener('error', reject, { once:true }); return; }
    const s = document.createElement('script');
    s.src = GLOBE_CDN; s.async = true; s.defer = true; s.setAttribute('data-globe-cdn','1');
    s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
  });
}

async function fetchIata(iata, apiKey){
  const u = `https://api.api-ninjas.com/v1/airports?iata=${encodeURIComponent(iata)}`;
  const r = await fetch(u, { headers: { 'X-Api-Key': apiKey } });
  if (!r.ok) return null;
  const j = await r.json();
  const item = Array.isArray(j) && j[0] ? j[0] : null;
  if (!item) return null;
  const lat = toNum(item.latitude), lng = toNum(item.longitude);
  return (lat!=null && lng!=null) ? { lat, lng, city: item.city, name: item.name } : null;
}

export default function TripGlobeArc({ trip, ninjasKey = import.meta.env.VITE_NINJAS_KEY, height = 420 }) {
  const hostRef = useRef(null);
  const mountRef = useRef(null);
  const globeRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false, ro;

    (async () => {
      if (!trip) return;

      const flight = trip?.flights?.[0] || null;
      const fromIata = flight?.fromId || flight?.legs?.[0]?.departureAirport?.id || '';
      const toIata   = flight?.toId   || flight?.legs?.slice(-1)?.[0]?.arrivalAirport?.id || '';

      let from = null, to = null;

      if (fromIata && ninjasKey) from = await fetchIata(fromIata, ninjasKey);
      if (!from && flight?.legs?.[0]?.departureAirport?.lat && flight?.legs?.[0]?.departureAirport?.lon) {
        from = { lat: toNum(flight.legs[0].departureAirport.lat), lng: toNum(flight.legs[0].departureAirport.lon) };
      }

      const hotel = trip?.hotels?.[0];
      if (hotel?.gps?.latitude && hotel?.gps?.longitude) {
        to = { lat: toNum(hotel.gps.latitude), lng: toNum(hotel.gps.longitude), name: hotel.title || 'Hotel' };
      } else if (toIata && ninjasKey) {
        to = await fetchIata(toIata, ninjasKey);
      }

      if (disposed) return;
      if (!from || !to) { setReady(false); return; }

      await loadCDN();
      if (disposed) return;

      const inner = document.createElement('div');
      inner.style.cssText = 'width:100%;height:100%;position:relative';
      mountRef.current = inner;
      hostRef.current.appendChild(inner);

      const g = new window.Globe(inner, { waitForGlobeReady: true, animateIn: true })
        .backgroundColor('#00000000')
        .globeImageUrl(EARTH_IMG)
        .bumpImageUrl(BUMP_IMG)
        .showAtmosphere(true)
        .atmosphereColor('#98b8ff')
        .atmosphereAltitude(0.22)
        .arcsData([{ startLat: from.lat, startLng: from.lng, endLat: to.lat, endLng: to.lng }])
        .arcAltitude(0.2)
        .arcStroke(0.25)
        .arcColor(() => ['#7aa7ff', '#e0ecff'])
        .arcDashLength(0.5)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2200)
        .labelsData([
          { lat: from.lat, lng: from.lng, text: fromIata || 'FROM' },
          { lat: to.lat,   lng: to.lng,   text: toIata || hotel?.title || 'TO' }
        ])
        .labelSize(0.9)
        .labelColor(() => '#e6eefc')
        .labelAltitude(0.01)
        .ringsData([{...from, maxR:2.5, color:'#86a9ff'}, {...to, maxR:2.5, color:'#ffd1a8'}])
        .ringMaxRadius(d => d.maxR)
        .ringColor(d => [d.color, 'rgba(255,255,255,0)'])
        .ringRepeatPeriod(900)
        .ringPropagationSpeed(1.3)
        .onGlobeReady(() => setReady(true));

      const controls = g.controls();
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.22;

      const size = () => {
        const w = hostRef.current.clientWidth || 800;
        const h = height;
        g.width(w); g.height(h);
      };
      size();
      ro = new ResizeObserver(size);
      ro.observe(hostRef.current);

      const alt = greatCircleAlt(from, to);
      g.pointOfView({ lat: (from.lat+to.lat)/2, lng: (from.lng+to.lng)/2, altitude: alt }, 900);

      globeRef.current = g;
    })();

    return () => {
      disposed = true;
      if (ro && hostRef.current) ro.unobserve(hostRef.current);
      if (mountRef.current && hostRef.current?.contains(mountRef.current)) hostRef.current.removeChild(mountRef.current);
      globeRef.current = null;
    };
  }, [trip, ninjasKey, height]);

  return (
    <div className="card trip-globe">
      <div className="card-title">Route preview</div>
      <div ref={hostRef} style={{ width: '100%', height }} />
      {!ready && <div className="muted center" style={{ padding: 12 }}>Loading route…</div>}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';

const GLOBE_CDN = 'https://cdn.jsdelivr.net/npm/globe.gl';
const EARTH_IMG = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg';
const BUMP_IMG  = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png';

const IATA = {
  RIX: { lat: 56.9236, lng: 23.9711 },
  MAN: { lat: 53.367, lng: -2.2728 },
  LHR: { lat: 51.4700, lng: -0.4543 },
  LGW: { lat: 51.1537, lng: -0.1821 },
  STN: { lat: 51.8850, lng: 0.2350 },
  DUB: { lat: 53.4273, lng: -6.2436 },
  AMS: { lat: 52.3105, lng: 4.7683 },
  CPH: { lat: 55.6180, lng: 12.6508 },
  OSL: { lat: 60.1939, lng: 11.1004 },
  HEL: { lat: 60.3172, lng: 24.9633 },
  FRA: { lat: 50.0379, lng: 8.5622 },
  CDG: { lat: 49.0097, lng: 2.5479 },
  BCN: { lat: 41.2974, lng: 2.0833 },
  MAD: { lat: 40.4893, lng: -3.5676 },
  IST: { lat: 41.2753, lng: 28.7519 },
  MUC: { lat: 48.3538, lng: 11.7861 },
  WAW: { lat: 52.1657, lng: 20.9671 },
  VNO: { lat: 54.6431, lng: 25.2790 }
};

function getAirportCoords(flight) {
  const fromId = flight?.fromId || flight?.legs?.[0]?.departureAirport?.id;
  const toId   = flight?.toId   || flight?.legs?.slice(-1)?.[0]?.arrivalAirport?.id;
  const fromLL = flight?.legs?.[0]?.departureAirport;
  const toLL   = flight?.legs?.slice(-1)?.[0]?.arrivalAirport;
  const a = fromLL?.latitude && fromLL?.longitude ? { lat: Number(fromLL.latitude), lng: Number(fromLL.longitude) } : IATA[fromId || ''] || null;
  const b = toLL?.latitude && toLL?.longitude ? { lat: Number(toLL.latitude), lng: Number(toLL.longitude) } : IATA[toId || ''] || null;
  return { a, b, fromId, toId };
}

function getHotelCoords(hotel) {
  const lat = hotel?.gps?.latitude;
  const lng = hotel?.gps?.longitude;
  return lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null;
}

export default function TripGlobeArcCDN({ trip, height = 360 }) {
  const wrapRef = useRef(null);
  const mountRef = useRef(null);
  const globeRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    const load = () =>
      new Promise((res, rej) => {
        if (window.Globe) return res();
        const tag = document.querySelector('script[data-globe-cdn]');
        if (tag) {
          tag.addEventListener('load', () => res(), { once: true });
          tag.addEventListener('error', () => rej(new Error('cdn error')), { once: true });
          return;
        }
        const s = document.createElement('script');
        s.src = GLOBE_CDN;
        s.async = true;
        s.defer = true;
        s.setAttribute('data-globe-cdn', '1');
        s.onload = () => res();
        s.onerror = () => rej(new Error('cdn error'));
        document.head.appendChild(s);
      });

    (async () => {
      await load();
      if (disposed) return;

      const inner = document.createElement('div');
      inner.style.cssText = 'width:100%;height:100%;position:relative';
      mountRef.current = inner;
      wrapRef.current.appendChild(inner);

      const g = new window.Globe(inner, { waitForGlobeReady: true, animateIn: true })
        .backgroundColor('#00000000')
        .globeImageUrl(EARTH_IMG)
        .bumpImageUrl(BUMP_IMG)
        .showAtmosphere(true)
        .atmosphereColor('#a0c6ff')
        .atmosphereAltitude(0.22)
        .showGraticules(false);

      const size = () => {
        const w = wrapRef.current.clientWidth || 640;
        const h = wrapRef.current.clientHeight || height;
        g.width(w); g.height(h);
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(wrapRef.current);

      globeRef.current = g;
      setReady(true);

      return () => {
        ro.disconnect();
      };
    })();

    return () => {
      disposed = true;
      if (mountRef.current && wrapRef.current?.contains(mountRef.current)) {
        wrapRef.current.removeChild(mountRef.current);
      }
      globeRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!ready || !trip || !globeRef.current) return;

    const g = globeRef.current;

    let origin = null;
    let dest = null;

    const f = Array.isArray(trip.flights) && trip.flights.length ? trip.flights[0] : null;
    if (f) {
      const r = getAirportCoords(f);
      origin = r.a || origin;
      dest   = r.b || dest;
    }

    const h = Array.isArray(trip.hotels) && trip.hotels.length ? trip.hotels[0] : null;
    const hLL = getHotelCoords(h);
    if (hLL) dest = hLL;

    if (!origin || !dest) return;

    const arc = [{
      startLat: origin.lat,
      startLng: origin.lng,
      endLat: dest.lat,
      endLng: dest.lng,
      color: ['#99ccff', '#ffffff']
    }];

    const pins = [
      { lat: origin.lat, lng: origin.lng, weight: 1 },
      { lat: dest.lat,   lng: dest.lng,   weight: 1 }
    ];

    g
      .pointsData(pins)
      .pointAltitude(0.05)
      .pointRadius(0.15)
      .pointColor(() => '#7fb3ff')
      .arcsData(arc)
      .arcColor('color')
      .arcDashLength(0.48)
      .arcDashGap(0.28)
      .arcDashInitialGap(1)
      .arcDashAnimateTime(1800)
      .arcStroke(0.35)
      .arcsTransitionDuration(600)
      .ringsData(pins.map(p => ({ ...p, maxR: 3.2 })))
      .ringMaxRadius('maxR')
      .ringPropagationSpeed(1.1)
      .ringRepeatPeriod(900)
      .ringColor(() => ['rgba(180,210,255,0.7)', 'rgba(180,210,255,0)']);

    const midLat = (origin.lat + dest.lat) / 2;
    const midLng = (origin.lng + dest.lng) / 2;
    const dist = Math.hypot(origin.lat - dest.lat, origin.lng - dest.lng);
    const alt = 1.8 + Math.min(0.9, dist / 90);
    g.pointOfView({ lat: midLat, lng: midLng, altitude: alt }, 900);

    const c = g.controls();
    c.enableDamping = true;
    c.dampingFactor = 0.06;
    c.autoRotate = false;
  }, [ready, trip]);

  return <div className="trip-globe" ref={wrapRef} style={{ height }} />;
}

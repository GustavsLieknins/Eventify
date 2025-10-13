import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';

const EARTH_CDN = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-dark.jpg';
const BUMP_CDN  = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png';

export default function AdminGlobe({ days = 365 }) {
  const mountRef = useRef(null);
  const gRef = useRef(null);

  const [ui, setUi] = useState({
    status: 'init',
    http: null,
    count: 0,
    first: null,
    usingFallback: false,
  });

  const num = (v) => (typeof v === 'string' ? parseFloat(v) : v);
  const toPoints = (arr) =>
    (Array.isArray(arr) ? arr : [])
      .map(p => ({
        lat: num(p.lat),
        lng: num(p.lng),
        weight: p.count != null ? Number(p.count) : 1
      }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  useLayoutEffect(() => {
    if (!mountRef.current || gRef.current) return;

    const g = Globe(mountRef.current, { waitForGlobeReady: true, animateIn: true })
      .backgroundColor('#00000000')
      .globeImageUrl(EARTH_CDN)
      .bumpImageUrl(BUMP_CDN)
      .showAtmosphere(true)
      .showGraticules(false)
      .pointsData([])
      .pointLat('lat')
      .pointLng('lng')
      .pointAltitude(d => 0.02 + Math.min(0.18, Math.log10(1 + (d.weight || 1)) * 0.06))
      .pointRadius(d => 0.18 + Math.log10(1 + (d.weight || 1)) * 0.06)
      .pointColor(() => '#e9ecf1')
      .pointsTransitionDuration(0)
      .onGlobeReady(() => {
        setUi(s => ({ ...s, status: 'ready' }));
        g.pointOfView({ lat: 22, lng: 10, altitude: 2.2 }, 600);
      });

    gRef.current = g;

    const fallbackTimer = setTimeout(() => {
      if (!gRef.current) return;
      gRef.current.showGlobe(false);
      gRef.current.showGraticules(true);
      setUi(s => ({ ...s, usingFallback: true }));
    }, 2500);

    const resize = () => {
      if (!mountRef.current || !gRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || 560;
      gRef.current.width(w);
      gRef.current.height(h);
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('resize', resize);
      gRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!gRef.current) return;
    const test = [{ lat: 57.32, lng: 25.28, weight: 7 }];
    gRef.current.pointsData(test);
    setUi(s => ({ ...s, status: 'ok', count: test.length, first: test[0] }));
  }, []);

  const load = async () => {
    if (!gRef.current) return;
    setUi(s => ({ ...s, status: 'loading', http: null }));

    try {
      const r = await fetch(`/admin/geo/points?days=${days}`, { credentials: 'same-origin' });
      const txt = await r.text();
      setUi(s => ({ ...s, http: r.status }));

      const json = JSON.parse(txt);
      const pts = toPoints(json.points);

      gRef.current.pointsData(pts);
      if (pts.length) {
        gRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 600);
      }

      setUi(s => ({ ...s, status: 'ok', count: pts.length, first: pts[0] || null }));
    } catch (e) {
      setUi(s => ({ ...s, status: 'error' }));
      console.error('Globe load error:', e);
    }
  };

  useEffect(() => { load(); }, []); 

  return (
    <div className="card globe-card">
      <div className="card-title">Users Around the World</div>

      <div className="globe-canvas" ref={mountRef}>
        {(ui.status === 'loading' || ui.status === 'error') && (
          <div className="globe-empty">Loading points…</div>
        )}
      </div>

      <div className="globe-legend">
        <span className="dot" />
        <span>Pin height/size ≈ visits (rounded to 0.1°)</span>
      </div>

      <div className="globe-debug">
        <button className="ef-btn ef-btn--glass ef-btn--sm" onClick={load}>Reload</button>
        <div className="globe-meta">
          <span>status: {ui.status}</span>
          <span>http: {String(ui.http)}</span>
          <span>points: {ui.count}</span>
          <span>first: {ui.first ? `${ui.first.lat}, ${ui.first.lng}, w=${ui.first.weight}` : '—'}</span>
          <span>{ui.usingFallback ? 'fallback:grid' : 'texture'}</span>
        </div>
      </div>
    </div>
  );
}

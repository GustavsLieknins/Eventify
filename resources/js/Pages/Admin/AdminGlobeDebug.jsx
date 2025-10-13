import React, { useEffect, useRef, useState } from 'react';

const EARTH_IMG = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-dark.jpg';
const BUMP_IMG  = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png';

export default function AdminGlobeDebug({ api = '/admin/geo/points?days=365' }) {
  const mountRef = useRef(null);
  const globeRef = useRef(null);

  const [ui, setUi] = useState({
    phase: 'init',
    http: null,
    err: null,
    points: 0,
    first: null
  });

  const setPhase = (phase, extra = {}) => setUi((s) => ({ ...s, phase, ...extra }));
  const num = (v) => (v == null ? v : typeof v === 'string' ? parseFloat(v) : v);
  const toPoints = (arr) =>
    (Array.isArray(arr) ? arr : [])
      .map(p => ({ lat: num(p.lat), lng: num(p.lng), weight: p.count ? Number(p.count) : 1 }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  useEffect(() => {
    let disposed = false;

    const boot = async () => {
      try {
        if (!mountRef.current) return;
        setPhase('loading-module');

        const mod = await import('globe.gl').catch(e => { throw new Error('import-failed: ' + e.message); });
        if (disposed) return;
        const Globe = mod.default;

        setPhase('creating');

        const g = Globe(mountRef.current, { waitForGlobeReady: true, animateIn: true })
          .backgroundColor('#00000000')
          .globeImageUrl(EARTH_IMG)
          .bumpImageUrl(BUMP_IMG)
          .showAtmosphere(true)
          .showGraticules(false)
          .pointsData([])
          .pointLat('lat')
          .pointLng('lng')
          .pointRadius(d => 0.18 + Math.log10(1 + (d.weight || 1)) * 0.06)
          .pointAltitude(d => 0.02 + Math.min(0.18, Math.log10(1 + (d.weight || 1)) * 0.06))
          .pointColor(() => '#e9ecf1')
          .pointsTransitionDuration(0)
          .onGlobeReady(() => setPhase('ready'));

        globeRef.current = g;

        const resize = () => {
          if (!mountRef.current || !globeRef.current) return;
          const w = mountRef.current.clientWidth || window.innerWidth;
          const h = mountRef.current.clientHeight || 560;
          globeRef.current.width(w);
          globeRef.current.height(h);
        };
        resize();
        window.addEventListener('resize', resize);

        const test = [{ lat: 57.32, lng: 25.28, weight: 5 }];
        g.pointsData(test);
        g.pointOfView({ lat: 22, lng: 10, altitude: 2.2 }, 600);
        setPhase('ok', { points: test.length, first: test[0] });

        setPhase('fetching');
        const r = await fetch(api, { credentials: 'same-origin' });
        const text = await r.text();
        setUi(s => ({ ...s, http: r.status }));
        if (!r.ok) throw new Error('http ' + r.status);

        let json;
        try { json = JSON.parse(text); } catch (e) { throw new Error('json-parse: ' + e.message); }
        const pts = toPoints(json.points);
        g.pointsData(pts);
        if (pts.length) g.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 600);
        setPhase('ok', { points: pts.length, first: pts[0] || null });

        setTimeout(() => {
          if (!globeRef.current) return;
          const canvas = mountRef.current?.querySelector('canvas');
          if (!canvas) {
            globeRef.current.showGlobe(false);
            globeRef.current.showGraticules(true);
            setPhase('fallback-grid');
          }
        }, 3000);

        return () => {
          window.removeEventListener('resize', resize);
        };
      } catch (err) {
        setUi(s => ({ ...s, phase: 'error', err: String(err.message || err) }));
      }
    };

    boot();
    return () => { disposed = true; };
  }, [api]);

  return (
    <div className="card globe-card">
      <div className="card-title">Users Around the World</div>

      <div className="globe-canvas">
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
        {(ui.phase === 'fetching' || ui.phase === 'error') && (
          <div className="globe-empty">
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>phase: {ui.phase}</div>
              <div>http: {ui.http ?? '—'}</div>
              {!!ui.err && <div style={{ color: '#ff8a8a', marginTop: 6 }}>{ui.err}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="globe-legend">
        <span className="dot" />
        <span>Pin height/size ≈ visits</span>
      </div>

      <div className="globe-debug">
        <button
          className="ef-btn ef-btn--glass ef-btn--sm"
          onClick={() => window.location.reload()}
        >
          Hard Reload
        </button>
        <div className="globe-meta">
          <span>phase: {ui.phase}</span>
          <span>http: {ui.http ?? '—'}</span>
          <span>points: {ui.points}</span>
          <span>first: {ui.first ? `${ui.first.lat.toFixed(1)}, ${ui.first.lng.toFixed(1)}` : '—'}</span>
          {ui.err && <span style={{color:'#f66'}}>error: {ui.err}</span>}
        </div>
      </div>
    </div>
  );
}

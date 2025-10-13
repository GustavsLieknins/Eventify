import React, { useEffect, useRef, useState } from 'react';

const GLOBE_CDN = 'https://cdn.jsdelivr.net/npm/globe.gl';

const EARTH_IMG = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg';
const BUMP_IMG  = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png';

export default function AdminGlobeCDN({ api = '/admin/geo/points?days=365' }) {
  const hostRef = useRef(null);
  const mountRef = useRef(null);
  const globeRef = useRef(null);

  const [ui, setUi] = useState({
    phase: 'init',
    http: null,
    probe: '—',
    points: 0,
    max: 0,
    first: null,
    err: null
  });

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  const toPoints = (arr) =>
    (Array.isArray(arr) ? arr : [])
      .map(p => ({
        lat: typeof p.lat === 'string' ? parseFloat(p.lat) : p.lat,
        lng: typeof p.lng === 'string' ? parseFloat(p.lng) : p.lng,
        weight: p.count != null ? Number(p.count) : 1
      }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  const heatColor = (t) => {
    const h = lerp(210, 16, t);
    const s = lerp(80, 95, t);
    const l = lerp(58, 55, t);
    return `hsl(${h} ${s}% ${l}%)`;
  };

  const loadCDN = () =>
    new Promise((resolve, reject) => {
      if (window.Globe) return resolve();
      const tagged = document.querySelector('script[data-globe-cdn]');
      if (tagged) {
        tagged.addEventListener('load', () => resolve(), { once: true });
        tagged.addEventListener('error', () => reject(new Error('cdn load error')), { once: true });
        return;
      }
      const s = document.createElement('script');
      s.src = GLOBE_CDN;
      s.async = true;
      s.defer = true;
      s.setAttribute('data-globe-cdn', '1');
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('cdn load error'));
      document.head.appendChild(s);
    });

  const probeWebGL = () => {
    try {
      const c = document.createElement('canvas');
      const gl2 = c.getContext('webgl2');
      const gl = gl2 || c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';
      const vendor = gl.getParameter(gl.VENDOR);
      const renderer = gl.getParameter(gl.RENDERER);
      return `webgl${gl2 ? '2' : ''} (${renderer} / ${vendor})`;
    } catch { return 'no-webgl (blocked)'; }
  };

  useEffect(() => {
    let disposed = false;
    let ro;

    (async () => {
      try {
        setUi(s => ({ ...s, phase: 'loading-cdn' }));
        await loadCDN();
        if (disposed) return;

        const inner = document.createElement('div');
        inner.style.cssText = 'width:100%;height:100%;position:relative';
        mountRef.current = inner;
        hostRef.current.appendChild(inner);

        setUi(s => ({ ...s, probe: probeWebGL(), phase: 'creating' }));

        const g = new window.Globe(inner, { waitForGlobeReady: true, animateIn: true })
          .backgroundColor('#00000000')
          .globeImageUrl(EARTH_IMG)
          .bumpImageUrl(BUMP_IMG)
          .showAtmosphere(true)
          .atmosphereColor('#a0c6ff')
          .atmosphereAltitude(0.22)
          .showGraticules(false)
          .pointsData([])
          .pointLat('lat')
          .pointLng('lng')
          .pointLabel(d => `
              <div class="ef-tip">
                <b>${d.weight}</b> visit${d.weight>1?'s':''}<br/>
                <span>${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}</span>
              </div>
          `)
          .pointsTransitionDuration(400)
          .onGlobeReady(() => setUi(s => ({ ...s, phase: 'ready' })));

        const controls = g.controls();
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.22;

        const lights = g.lights();
        lights[0].intensity = 0.9;  
        lights[1].intensity = 1.25; 

        const size = () => {
          const w = hostRef.current.clientWidth || window.innerWidth;
          const h = hostRef.current.clientHeight || 560;
          g.width(w); g.height(h);
        };
        size();
        ro = new ResizeObserver(size);
        ro.observe(hostRef.current);

        globeRef.current = g;

        g.pointsData([{ lat: 0, lng: 0, weight: 1 }]);
        g.pointOfView({ lat: 23, lng: 12, altitude: 2.2 }, 800);

        setUi(s => ({ ...s, phase: 'fetching' }));
        const r = await fetch(api, { credentials: 'same-origin' });
        const txt = await r.text();
        setUi(s => ({ ...s, http: r.status }));
        const json = JSON.parse(txt);
        const pts = toPoints(json.points);

        const max = pts.reduce((m, p) => Math.max(m, p.weight || 1), 1);
        const radius   = (w) => 0.10 + Math.log10(1 + w) * 0.09;
        const altitude = (w) => 0.03 + Math.log10(1 + w) * 0.13;
        const color    = (w) => heatColor(clamp01((Math.log10(1 + w)) / Math.log10(1 + max)));

        g.pointRadius(d => radius(d.weight || 1));
        g.pointAltitude(d => altitude(d.weight || 1));
        g.pointColor(d => color(d.weight || 1));
        g.pointsData(pts);

        const top = [...pts].sort((a,b)=> (b.weight||0)-(a.weight||0)).slice(0, 5);
        g.ringsData(top.map(p => ({ ...p, maxR: 2 + clamp01((p.weight||1)/max) * 4 })));
        g.ringMaxRadius(d => d.maxR);
        g.ringColor(d => [color(d.weight||1), 'rgba(255,255,255,0)']);
        g.ringRepeatPeriod(d => 1200 - clamp01((d.weight||1)/max)*700);
        g.ringPropagationSpeed(1.2);

        let prev;
        g.onPointHover((o) => {
          if (prev) prev.__emph = false;
          if (o) o.__emph = true;
          prev = o || null;
          g.pointRadius(d => radius(d.weight || 1) * (d.__emph ? 1.6 : 1));
          g.pointAltitude(d => altitude(d.weight || 1) * (d.__emph ? 1.25 : 1));
        });

        if (pts.length) g.pointOfView({ lat: 20, lng: 0, altitude: 2.05 }, 900);

        setUi(s => ({ ...s, phase: 'ok', points: pts.length, max, first: pts[0] || null }));
      } catch (e) {
        setUi(s => ({ ...s, phase: 'error', err: e?.message || String(e) }));
      }
    })();

    return () => {
      if (ro && hostRef.current) ro.unobserve(hostRef.current);
      if (mountRef.current && hostRef.current?.contains(mountRef.current)) {
        hostRef.current.removeChild(mountRef.current);
      }
      globeRef.current = null;
    };
  }, [api]);

  return (
    <div className="card globe-card ef-globe">
      <div className="card-title">Users Around the World</div>
      <div ref={hostRef} className="globe-canvas" />
      <div className="globe-legend">
        <span className="dot" />
        <span>Pin size/height scales with visits · brightest = most traffic</span>
      </div>
      <div className="globe-debug">
        <button className="ef-btn ef-btn--glass ef-btn--sm" onClick={() => window.location.reload()}>
          Hard Reload
        </button>
        <div className="globe-meta">
          <span>phase: {ui.phase}</span>
          <span>probe: {ui.probe}</span>
          <span>http: {ui.http ?? '—'}</span>
          <span>points: {ui.points}</span>
          {ui.max ? <span>max: {ui.max}</span> : null}
          <span>first: {ui.first ? `${ui.first.lat.toFixed(1)}, ${ui.first.lng.toFixed(1)}` : '—'}</span>
          {ui.err && <span style={{ color: '#f66' }}>error: {ui.err}</span>}
        </div>
      </div>
    </div>
  );
}

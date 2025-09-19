import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
} from 'react';
import { usePage } from '@inertiajs/react';
import './Bookmarks.css';
import TopNav from '@/Shared/TopNav';

const RELAY_KEY = 'toastRelay';

/* =========================================================
   Tiny, dependency-free UI primitives (memoized)
========================================================= */

const Icon = memo(function Icon({ name, size = 18, className = '' }) {
  const s = size;
  switch (name) {
    case 'x':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'external':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M14 4h6v6m0-6L10 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 9v10a1 1 0 001 1h10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      );
    case 'trash':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      );
    case 'plane':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M10 21l2-5 7-7a2 2 0 10-3-3l-7 7-5 2 2-5-3-3 4-1 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'hotel':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M3 21V9a3 3 0 013-3h7a5 5 0 015 5v10M3 21h18M6 12h4m4 0h4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'map':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
          <circle cx="12" cy="10" r="2" fill="currentColor"/>
        </svg>
      );
    case 'globe':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20z M2 12h20M12 2c3.5 4.5 3.5 15.5 0 20M12 2c-3.5 4.5-3.5 15.5 0 20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      );
    case 'link':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 10-7.07-7.07L10 5m4 6a5 5 0 01-7.07 0L5.5 9.57a5 5 0 117.07-7.07L13 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return null;
  }
});

const Button = memo(function Button({
  children,
  size = 'md',
  variant = 'glass',
  iconLeft,
  iconRight,
  as = 'button',
  className = '',
  ...rest
}) {
  const Comp = as;
  return (
    <Comp
      className={`ui-btn ui-btn--${size} ui-btn--${variant} ${className}`}
      {...rest}
    >
      {iconLeft ? <span className="ui-btn__icon">{iconLeft}</span> : null}
      <span className="ui-btn__label">{children}</span>
      {iconRight ? <span className="ui-btn__icon">{iconRight}</span> : null}
    </Comp>
  );
});

const Badge = memo(function Badge({ children, tone = 'glass', className = '' }) {
  return <span className={`ui-badge ui-badge--${tone} ${className}`}>{children}</span>;
});

const Card = memo(function Card({ children, interactive = true, className = '', ...rest }) {
  return (
    <section
      className={`ui-card ${interactive ? 'ui-card--hover' : ''} ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
});

const Section = memo(function Section({ title, icon, children, className = '' }) {
  return (
    <div className={`blk ${className}`}>
      <div className="blk__head">
        {icon}
        <h3 className="blk__title">{title}</h3>
      </div>
      <div className="blk__body">{children}</div>
    </div>
  );
});

const Empty = memo(function Empty({ title = 'Nothing here yet', hint }) {
  return (
    <div className="empty">
      <div className="empty__title">{title}</div>
      {hint && <div className="empty__hint">{hint}</div>}
    </div>
  );
});

/* =========================================================
   Simple Confirm Popup (no libs)
========================================================= */
function ConfirmDialog({ open, title, message, onConfirm, onCancel, busy }) {
  if (!open) return null;
  return (
    <div className="confirm-wrap" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="confirm" onClick={(e) => e.stopPropagation()}>
        <button className="confirm__close" onClick={onCancel} aria-label="Close">
          <Icon name="x" />
        </button>

        <h3 className="confirm__title">{title || 'Are you sure?'}</h3>
        {message ? <div className="confirm__msg">{message}</div> : null}

        <div className="confirm__actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            variant="danger"
            iconLeft={<Icon name="trash" />}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Map Pane
========================================================= */
const TripMapPane = memo(function TripMapPane({ trip, buildTripEmbedUrl, buildTripExternalUrl }) {
  const url = buildTripEmbedUrl(trip);
  const ext = buildTripExternalUrl(trip);
  if (!url) return null;

  return (
    <div className="map-card">
      <div className="map-aspect">
        <iframe
          key={url}
          title="Trip Map"
          src={url}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="map-overlay">
          <div className="map-caption">Route preview</div>
          {ext && (
            <a className="ui-btn ui-btn--sm ui-btn--glass map-btn" href={ext} target="_blank" rel="noreferrer">
              <span className="ui-btn__icon"><Icon name="external" /></span>
              <span className="ui-btn__label">Open in Google Maps</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

/* =========================================================
   Page
========================================================= */

export default function Bookmarks({ trips: initialTrips, user }) {
  const { flash } = usePage().props; // server flash
  const [trips, setTrips] = useState(() => initialTrips || []);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, trip: null }); // <-- NEW
  const modalRef = useRef(null);

  /* ------------ toasts (no alerts) ------------ */
  const TOAST_TTL = 3800;
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, tone = 'ok', ttl = 4200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl);
  }, []);

  // relay toast
  useEffect(() => {
    let rafId;
    let tries = 0;
    const tick = () => {
      tries += 1;
      try {
        const raw = sessionStorage.getItem(RELAY_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const now = Date.now();
          if (data.until && now > data.until) {
            sessionStorage.removeItem(RELAY_KEY);
          } else {
            const allowed = !data.notBefore || now >= data.notBefore;
            if (!data._shown && allowed) {
              toast(data.title || data.message || 'Done', data.tone || 'ok', data.ttl || 4800);
              data._shown = true;
              sessionStorage.setItem(RELAY_KEY, JSON.stringify(data));
            }
          }
        }
      } catch {}
      if (tries < 120) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [toast]);

  /* ------------ helpers ------------ */
  const mapsLinkFromHotel = useCallback((h) => {
    if (h?.gps?.latitude && h?.gps?.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${h.gps.latitude},${h.gps.longitude}`;
    }
    const q = encodeURIComponent(`${h?.title || ''} ${h?.address || ''}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, []);

  const buildFlightsLink = useCallback((f) => {
    const origin = f?.fromId || f?.legs?.[0]?.departureAirport?.id || '';
    const dest   = f?.toId   || f?.legs?.slice(-1)?.[0]?.arrivalAirport?.id || '';
    const rawDate = f?.depart || f?.legs?.[0]?.departureAirport?.time || '';
    const day = (typeof rawDate === 'string' && rawDate.length >= 10) ? rawDate.slice(0,10) : '';
    const q = encodeURIComponent(
      [origin && `${origin} to`, dest, day, 'flights'].filter(Boolean).join(' ')
    );
    return {
      flightsUrl: `https://www.google.com/travel/flights?q=${q}`,
      searchUrl:  `https://www.google.com/search?q=${q}`,
    };
  }, []);

  const fmtPrice = useCallback(
    (n, currency = 'EUR') =>
      typeof n === 'number'
        ? n.toLocaleString(undefined, { style: 'currency', currency })
        : '—',
    []
  );

  const fmtDuration = useCallback((mins) => {
    if (!mins || isNaN(mins)) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h ? `${h}h` : ''}${h && m ? ' ' : ''}${m ? `${m}m` : ''}`;
  }, []);

  const buildTripEmbedUrl = useCallback((trip) => {
    if (!trip) return null;
    const f = trip.flights?.[0];
    const h = trip.hotels?.[0];

    const origin = f?.fromId ? `${f.fromId} Airport` : (f?.legs?.[0]?.departureAirport?.name || '');
    let destination = '';

    if (h?.gps?.latitude && h?.gps?.longitude) destination = `${h.gps.latitude},${h.gps.longitude}`;
    else if (h?.title || h?.address) destination = [h.title, h.address].filter(Boolean).join(' ');
    else if (f?.toId) destination = `${f.toId} Airport`;

    if (!origin || !destination) return null;

    const key = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY;
    if (key) {
      const o = encodeURIComponent(origin);
      const d = encodeURIComponent(destination);
      return `https://www.google.com/maps/embed/v1/directions?key=${key}&origin=${o}&destination=${d}&mode=transit`;
    }
    const q = encodeURIComponent(`${origin} to ${destination}`);
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }, []);

  const buildTripExternalUrl = useCallback((trip) => {
    if (!trip) return null;
    const f = trip.flights?.[0];
    const h = trip.hotels?.[0];
    const origin = f?.fromId ? `${f.fromId} Airport` : (f?.legs?.[0]?.departureAirport?.name || '');
    const dest = h?.address || h?.title || (f?.toId ? `${f?.toId} Airport` : '');
    if (!origin || !dest) return null;
    const o = encodeURIComponent(origin);
    const d = encodeURIComponent(dest);
    return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}`;
  }, []);

  /* ------------ actions ------------ */
  const onOpenTrip = useCallback((trip) => setSelectedTrip(trip), []);
  const onCloseTrip = useCallback(() => setSelectedTrip(null), []);

  // keep your working delete; popup will call this
  const deleteTrip = useCallback(async (tripId) => {
    try {
      setDeleting(tripId);
      const res = await fetch(`/bookmarks/${tripId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to delete trip');
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      setSelectedTrip((sel) => (sel?.id === tripId ? null : sel));
      toast('Trip deleted', 'ok');
    } catch {
      toast('Failed to delete trip', 'error');
    } finally {
      setDeleting(null);
    }
  }, [toast]);

  const createShareLink = useCallback(async (tripId) => {
    try {
      const res = await fetch('/share-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ trip_id: tripId }),
        credentials: 'same-origin',
      });
    if (!res.ok) throw new Error('Failed to create link');
      const data = await res.json();
      const url = data?.url;
      if (!url) throw new Error('Invalid response');
      await navigator.clipboard.writeText(url);
      toast('Share link copied!', 'ok');
    } catch {
      toast('Could not create link', 'error');
    }
  }, [toast]);

  /* ------------ modal UX ------------ */
  useEffect(() => {
    if (!selectedTrip) return;
    const onKey = (e) => e.key === 'Escape' && setSelectedTrip(null);
    window.addEventListener('keydown', onKey);
    modalRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedTrip]);

  /* =========================================================
     Renderers
  ========================================================== */

  const FlightList = memo(function FlightList({ flights }) {
    if (!flights?.length) return <Empty title="No flights saved" />;

    return (
      <div className="stack">
        {flights.map((f, i) => {
          const { flightsUrl, searchUrl } = buildFlightsLink(f);
          const airlines = f?.airlines?.length ? f.airlines.join(' + ') : null;

          return (
            <Card key={i}>
              <div className="row row--space">
                <div className="route">
                  <span className="iata">{f.fromId || '—'}</span>
                  <span className="arrow">→</span>
                  <span className="iata">{f.toId || '—'}</span>
                </div>
                <Badge tone="accent">{fmtPrice(f.price)}</Badge>
              </div>

              <div className="row row--wrap">
                {f.type && <Badge>{f.type}</Badge>}
                {f.travelClass && <Badge>{f.travelClass}</Badge>}
                {f.totalDuration && <Badge>{fmtDuration(f.totalDuration)}</Badge>}
                {airlines && <Badge>{airlines}</Badge>}
              </div>

              {f.legs?.map((leg, idx) => (
                <div key={idx} className="leg">
                  <div className="leg__line">
                    <strong>{leg?.departureAirport?.id}</strong> ({leg?.departureAirport?.time})
                    {' '}→{' '}
                    <strong>{leg?.arrivalAirport?.id}</strong> ({leg?.arrivalAirport?.time})
                  </div>
                  <div className="leg__meta">
                    {leg?.airline} • {leg?.flightNumber} • {leg?.travelClass}
                    {leg?.legroom ? ` • ${leg.legroom} legroom` : ''}
                  </div>
                  {!!(leg?.extensions?.length) && (
                    <div className="chips">
                      {leg.extensions.map((ext, eidx) => <Badge key={eidx}>{ext}</Badge>)}
                    </div>
                  )}
                </div>
              ))}

              {(f?.emissions?.thisFlight || typeof f?.emissions?.differencePercent === 'number') && (
                <div className="row row--wrap mt-6">
                  {typeof f?.emissions?.differencePercent === 'number' && (
                    <Badge tone={f.emissions.differencePercent <= 0 ? 'green' : 'red'}>
                      {f.emissions.differencePercent > 0 ? '+' : ''}{f.emissions.differencePercent}% vs typical
                    </Badge>
                  )}
                  {f?.emissions?.thisFlight && (
                    <span className="muted small">Est. {Math.round(f.emissions.thisFlight / 1000)} kg CO₂</span>
                  )}
                </div>
              )}

              <div className="toolbar">
                <Button
                  size="sm"
                  iconLeft={<Icon name="plane" />}
                  as="a"
                  href={flightsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Flights
                </Button>
                <Button
                  size="sm"
                  iconLeft={<Icon name="globe" />}
                  as="a"
                  href={searchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Web Search
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  });

  const HotelList = memo(function HotelList({ hotels }) {
    if (!hotels?.length) return <Empty title="No hotels saved" />;

    return (
      <div className="stack">
        {hotels.map((h, i) => (
          <Card key={i} interactive={false} className="hotel">
            <div className="hotel__grid">
              <div className="hotel__thumb">
                {h.thumbnail
                  ? <img src={h.thumbnail} alt="" loading="lazy" />
                  : <div className="thumb--placeholder" aria-hidden="true" />
                }
              </div>

              <div className="hotel__body">
                <div className="row row--space">
                  <h4 className="hotel__title">
                    {h.website
                      ? <a href={h.website} target="_blank" rel="noreferrer" className="link">{h.title}</a>
                      : h.title}
                  </h4>
                  <div className="row gap-6">
                    {typeof h.rating === 'number' && (
                      <Badge tone="gold">{h.rating.toFixed(1)} ★</Badge>
                    )}
                    {typeof h.reviews === 'number' && (
                      <span className="muted small">({h.reviews.toLocaleString()} reviews)</span>
                    )}
                  </div>
                </div>

                <div className="muted small mt-4">
                  {h.stars ? `${h.stars}★` : ''}{h.stars && h.type ? ' • ' : ''}{h.type || ''}
                </div>
                {h.address && <div className="muted small">{h.address}</div>}

                {!!(h.tags?.length) && (
                  <div className="chips mt-6">
                    {h.tags.map((t, idx) => <Badge key={idx}>{t}</Badge>)}
                  </div>
                )}

                <div className="toolbar mt-8">
                  <Button size="sm" iconLeft={<Icon name="map" />} as="a" href={mapsLinkFromHotel(h)} target="_blank" rel="noreferrer">
                    Maps
                  </Button>
                  {h.website && (
                    <Button size="sm" iconLeft={<Icon name="external" />} as="a" href={h.website} target="_blank" rel="noreferrer">
                      Website
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  });

  /* =========================================================
     Page layout
  ========================================================== */

  const hasTrips = trips && trips.length > 0;

  // open/close confirm and call delete on confirm
  const requestDelete = (trip) => setConfirm({ open: true, trip });
  const cancelDelete = () => setConfirm({ open: false, trip: null });
  const confirmDelete = async () => {
    if (!confirm.trip) return;
    await deleteTrip(confirm.trip.id);
    cancelDelete();
  };

  return (
    <>
      <TopNav active="bookmarks" />
      <div className="page">
        {/* Toasts */}
        <div className="toasts">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast--${t.tone}`}>
              {t.msg}
            </div>
          ))}
        </div>

        <header className="page__head" role="banner">
          <h1 className="page__title">My Bookmarked Trips</h1>
        </header>

        {!hasTrips ? (
          <Card interactive={false}>
            <Empty
              title="No trips bookmarked yet"
              hint="Search events on the dashboard, pick a flight and/or hotel, then bookmark the trip."
            />
          </Card>
        ) : (
          <div className="trip-list">
            {trips.map((trip) => {
              const where = trip?.flights?.[0]
                ? `${trip.flights[0].fromId} → ${trip.flights[0].toId}`
                : trip?.hotels?.[0]
                ? trip.hotels[0].title
                : 'Unknown';

              return (
                <Card key={trip.id} className="trip" onClick={() => onOpenTrip(trip)} aria-label={`Open ${trip.title}`}>
                  <div className="trip__left">
                    <h3 className="trip__title">{trip.title}</h3>
                    <div className="trip__where">{where}</div>
                  </div>

                    <div className="trip__actions" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => onOpenTrip(trip)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="glass"
                      onClick={(e) => { e.stopPropagation(); createShareLink(trip.id); }}
                      title="Create shareable link"
                      iconLeft={<Icon name="link" />}
                    >
                      Share link
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => { e.stopPropagation(); requestDelete(trip); }}
                      disabled={deleting === trip.id}
                      iconLeft={<Icon name="trash" />}
                    >
                      {deleting === trip.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {selectedTrip && (
          <div className="modal-wrap" onClick={onCloseTrip} aria-modal="true" role="dialog">
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              ref={modalRef}
              tabIndex={-1}
            >
              <button className="modal__close" onClick={onCloseTrip} aria-label="Close">
                <Icon name="x" />
              </button>

              <div className="modal__header">
                <h2 className="modal__title">{selectedTrip.title}</h2>
                <div className="modal__sub">
                  {selectedTrip?.flights?.[0]
                    ? `${selectedTrip.flights[0].fromId} → ${selectedTrip.flights[0].toId}`
                    : selectedTrip?.hotels?.[0]?.address || 'Trip details'}
                </div>
              </div>

              {/* SCROLLABLE REGION: map + content */}
              <div className="modal__scroll">
                <TripMapPane
                  trip={selectedTrip}
                  buildTripEmbedUrl={buildTripEmbedUrl}
                  buildTripExternalUrl={buildTripExternalUrl}
                />

                <div className="modal__grid">
                  <Section title="Flights" icon={<Icon name="plane" />}>
                    <FlightList flights={selectedTrip.flights || []} />
                  </Section>

                  <Section title="Hotels" icon={<Icon name="hotel" />}>
                    <HotelList hotels={selectedTrip.hotels || []} />
                  </Section>
                </div>
              </div>
              {/* end scrollable */}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation popup */}
      <ConfirmDialog
        open={confirm.open}
        title="Delete this trip?"
        message={confirm.trip ? `“${confirm.trip.title}” will be permanently removed.` : ''}
        busy={!!(confirm.trip && deleting === confirm.trip.id)}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}

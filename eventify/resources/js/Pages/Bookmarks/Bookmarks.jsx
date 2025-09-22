import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { usePage } from '@inertiajs/react';
import './Bookmarks.css';
import TopNav from '@/Shared/TopNav';

import Icon from './components/ui/Icon';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import Card from './components/ui/Card';
import Section from './components/ui/Section';
import Empty from './components/ui/Empty';

import ConfirmDialog from './components/ConfirmDialog';
import TripMapPane from './components/TripMapPane';
import FlightList from './components/FlightList';
import HotelList from './components/HotelList';

const RELAY_KEY = 'toastRelay';

export default function Bookmarks({ trips: initialTrips, user }) {
  const { flash } = usePage().props;

  const [trips, setTrips] = useState(() => initialTrips || []);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, trip: null });
  const modalRef = useRef(null);

  /* ---------- tiny toasts ---------- */
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, tone = 'ok', ttl = 4200) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl);
  }, []);

  // relay (from Dashboard bookmark)
  useEffect(() => {
    let rafId; let tries = 0;
    const tick = () => {
      tries += 1;
      try {
        const raw = sessionStorage.getItem(RELAY_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const now = Date.now();
          if (data.until && now > data.until) {
            sessionStorage.removeItem(RELAY_KEY);
          } else if (!data._shown && (!data.notBefore || now >= data.notBefore)) {
            toast(data.title || data.message || 'Done', data.tone || 'ok', data.ttl || 4800);
            data._shown = true;
            sessionStorage.setItem(RELAY_KEY, JSON.stringify(data));
          }
        }
      } catch {}
      if (tries < 120) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [toast]);

  /* ---------- helpers ---------- */
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
    const q = encodeURIComponent([origin && `${origin} to`, dest, day, 'flights'].filter(Boolean).join(' '));
    return {
      flightsUrl: `https://www.google.com/travel/flights?q=${q}`,
      searchUrl:  `https://www.google.com/search?q=${q}`,
    };
  }, []);

  const fmtPrice = useCallback(
    (n, currency = 'EUR') =>
      typeof n === 'number' ? n.toLocaleString(undefined, { style: 'currency', currency }) : '—',
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

  /* ---------- actions ---------- */
  const onOpenTrip = useCallback((trip) => setSelectedTrip(trip), []);
  const onCloseTrip = useCallback(() => setSelectedTrip(null), []);

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

  useEffect(() => {
    if (!selectedTrip) return;
    const onKey = (e) => e.key === 'Escape' && setSelectedTrip(null);
    window.addEventListener('keydown', onKey);
    modalRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedTrip]);

  /* ---------- render ---------- */
  const hasTrips = trips && trips.length > 0;
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
            <div key={t.id} className={`toast toast--${t.tone}`}>{t.msg}</div>
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
                    <Button size="sm" variant="accent" onClick={() => onOpenTrip(trip)}>View</Button>
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
            <div className="modal" onClick={(e) => e.stopPropagation()} ref={modalRef} tabIndex={-1}>
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

              <div className="modal__scroll">
                <TripMapPane
                  trip={selectedTrip}
                  buildTripEmbedUrl={buildTripEmbedUrl}
                  buildTripExternalUrl={buildTripExternalUrl}
                />

                <div className="modal__grid">
                  <Section title="Flights" icon={<Icon name="plane" />}>
                    <FlightList
                      flights={selectedTrip.flights || []}
                      buildFlightsLink={buildFlightsLink}
                      fmtPrice={fmtPrice}
                      fmtDuration={fmtDuration}
                    />
                  </Section>

                  <Section title="Hotels" icon={<Icon name="hotel" />}>
                    <HotelList
                      hotels={selectedTrip.hotels || []}
                      mapsLinkFromHotel={mapsLinkFromHotel}
                    />
                  </Section>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

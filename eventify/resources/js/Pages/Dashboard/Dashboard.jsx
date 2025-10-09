import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';
import TopNav from '@/Shared/TopNav';
import { router, usePage } from '@inertiajs/react';

import Toasts from './components/Toasts';
import SearchHeader from './components/SearchHeader';
import EventCard from './components/EventCard';
import TravelModal from './components/TravelModal';
import useVisitBeacon from '@/Shared/useVisitBeacon';

import {
  DEFAULT_GL, DEFAULT_HL, DEFAULT_EVENT_LOCATION,
  hasAnyFlights, suggestTripTitle,
  normalizeEvents, extractFlightOptions, normalizeFlightOption, normalizeHotel,
  getEventTravelDates, guessOriginIata,
} from './utils';

const uid = () => Math.random().toString(36).slice(2, 9);
const searchCache = new Map();
const cacheKey = (q, when, loc) => `${q}|||${when || ''}|||${loc || ''}`;
const CACHE_TTL_MS = 1000 * 60 * 60;

const AIRPORTS = [
  { iata: 'RIX', lat: 56.9236, lon: 23.9711 }, { iata: 'TLL', lat: 59.4133, lon: 24.8328 },
  { iata: 'VNO', lat: 54.6341, lon: 25.2858 }, { iata: 'HEL', lat: 60.3172, lon: 24.9633 },
  { iata: 'ARN', lat: 59.6519, lon: 17.9186 }, { iata: 'OSL', lat: 60.1939, lon: 11.1004 },
  { iata: 'CPH', lat: 55.6181, lon: 12.6561 }, { iata: 'LHR', lat: 51.4700, lon: -0.4543 },
  { iata: 'LGW', lat: 51.1537, lon: -0.1821 }, { iata: 'LTN', lat: 51.8747, lon: -0.3683 },
  { iata: 'STN', lat: 51.8850, lon: 0.2350 },  { iata: 'LCY', lat: 51.5053, lon: 0.0553 },
  { iata: 'MAN', lat: 53.3650, lon: -2.2720 }, { iata: 'BHX', lat: 52.4539, lon: -1.7480 },
  { iata: 'EDI', lat: 55.95, lon: -3.3725 },   { iata: 'GLA', lat: 55.8719, lon: -4.4331 },
  { iata: 'BFS', lat: 54.6575, lon: -6.2158 }, { iata: 'DUB', lat: 53.4273, lon: -6.2436 },
  { iata: 'CDG', lat: 49.0097, lon: 2.5479 },  { iata: 'ORY', lat: 48.7262, lon: 2.3652 },
  { iata: 'AMS', lat: 52.3086, lon: 4.7639 },  { iata: 'FRA', lat: 50.0379, lon: 8.5622 },
  { iata: 'MUC', lat: 48.3538, lon: 11.7861 }, { iata: 'BER', lat: 52.3667, lon: 13.5033 },
  { iata: 'ZRH', lat: 47.4581, lon: 8.5555 },  { iata: 'GVA', lat: 46.2381, lon: 6.1089 },
  { iata: 'BCN', lat: 41.2974, lon: 2.0833 },  { iata: 'MAD', lat: 40.4983, lon: -3.5676 },
  { iata: 'FCO', lat: 41.8003, lon: 12.2389 }, { iata: 'MXP', lat: 45.6301, lon: 8.7281 },
  { iata: 'JFK', lat: 40.6413, lon: -73.7781 },{ iata: 'EWR', lat: 40.6895, lon: -74.1745 },
  { iata: 'LGA', lat: 40.7769, lon: -73.8740 },{ iata: 'BOS', lat: 42.3656, lon: -71.0096 },
  { iata: 'MIA', lat: 25.7959, lon: -80.2870 },{ iata: 'ORD', lat: 41.9742, lon: -87.9073 },
  { iata: 'DFW', lat: 32.8998, lon: -97.0403 },{ iata: 'ATL', lat: 33.6407, lon: -84.4277 },
  { iata: 'SEA', lat: 47.4502, lon: -122.3088 },{ iata: 'SFO', lat: 37.6213, lon: -122.3790 },
  { iata: 'LAX', lat: 33.9416, lon: -118.4085 },{ iata: 'YYZ', lat: 43.6777, lon: -79.6248 },
  { iata: 'YTZ', lat: 43.6287, lon: -79.3962 },{ iata: 'YUL', lat: 45.4706, lon: -73.7408 },
  { iata: 'YOW', lat: 45.3225, lon: -75.6692 },{ iata: 'YWG', lat: 49.9097, lon: -97.2399 },
  { iata: 'YVR', lat: 49.1947, lon: -123.1792 },{ iata: 'YYC', lat: 51.1315, lon: -114.0106 },
  { iata: 'YXU', lat: 43.0329, lon: -81.1539 }
];

export default function Dashboard() {
  useVisitBeacon();

  const { auth } = usePage().props;
  const userId = auth?.user?.id ?? null;

  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [when, setWhen] = useState('');
  const [originIata, setOriginIata] = useState('RIX');

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [pageStart, setPageStart] = useState(0);

  const [selected, setSelected] = useState(null);
  const [showTravel, setShowTravel] = useState(false);
  const [flights, setFlights] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [usedArrival, setUsedArrival] = useState('');
  const [arrivalOverride, setArrivalOverride] = useState('');
  const [outboundDate, setOutboundDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [saving, setSaving] = useState(false);

  const [flightsLoading, setFlightsLoading] = useState(false);
  const [hotelsLoading, setHotelsLoading] = useState(false);

  const reqIdRef = useRef(0);
  const modalRef = useRef(null);

  const [toasts, setToasts] = useState([]);
  const toast = ({ title, message = '', tone = 'info', ttl = 3800 }) => {
    const id = uid();
    setToasts(t => [...t, { id, title, message, tone, ttl }]);
    window.setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), ttl + 250);
  };
  const dismissToast = (id) => setToasts(ts => ts.filter(x => x.id !== id));

  const showLanding = !loading && events.length === 0 && !searchTriggered && !lastQuery;

  const ninjasKey = import.meta.env.VITE_NINJAS_KEY || '';

  const toRad = d => d * Math.PI / 180;
  const haversineKm = (aLat, aLon, bLat, bLon) => {
    const R = 6371;
    const dLat = toRad(bLat - aLat);
    const dLon = toRad(bLon - aLon);
    const x = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  };

  const parseCityIso = (label) => {
    const parts = (label || '').split(',').map(s => s.trim()).filter(Boolean);
    const city = parts[0] || '';
    const iso = (parts[parts.length - 1] || '').length === 2 ? parts[parts.length - 1].toUpperCase() : '';
    return { city, iso };
  };

  const ninjasGet = async (url) => {
    try {
      const r = await fetch(url, { headers: { 'X-Api-Key': ninjasKey } });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  };

  const resolveCityToIataListNinjas = async (cityLabel) => {
    const { city, iso } = parseCityIso(cityLabel);
    if (!city) return ['LHR'];

    let codes = [];

    if (ninjasKey) {
      const g = new URL('https://api.api-ninjas.com/v1/geocoding');
      g.searchParams.set('city', city);
      if (iso) g.searchParams.set('country', iso);
      const geo = await ninjasGet(g.toString());
      const c = Array.isArray(geo) ? geo[0] : null;

      if (c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
        const ranked = AIRPORTS
          .map(a => ({ code: a.iata, d: haversineKm(c.latitude, c.longitude, a.lat, a.lon) }))
          .sort((x, y) => x.d - y.d)
          .slice(0, 6)
          .map(x => x.code);
        codes = Array.from(new Set(ranked));
      }
    }

    return codes.length ? codes : ['LHR'];
  };

  const resetSearchUI = () => {
    setEvents([]);
    setPageStart(0);
    setSelected(null);
    setFlights(null);
    setHotels([]);
    setShowTravel(false);
    setUsedArrival('');
    setSelectedFlight(null);
    setSelectedHotel(null);
  };

  useEffect(() => {
    let on = true;
    (async () => {
      const i = await guessOriginIata('RIX');
      if (on) setOriginIata(i || 'RIX');
    })();
    return () => { on = false; };
  }, []);

  const searchEvents = async (reset = true, overrides = {}) => {
    const qVal = ((overrides.q ?? q) || '').trim();
    const whenVal = overrides.when ?? when;
    const locVal = overrides.location ?? (location || DEFAULT_EVENT_LOCATION);
    const startVal = reset ? 0 : pageStart;

    if (!qVal) { toast({ title: 'Type something to search', tone: 'warn' }); return; }

    const key = cacheKey(qVal, whenVal, locVal);
    setLastQuery(qVal);
    setSearchTriggered(true);

    if (reset) {
      const cached = searchCache.get(key);
      const fresh = cached && (Date.now() - cached.ts) < CACHE_TTL_MS;
      setEvents(fresh && Array.isArray(cached.items) ? cached.items : []);
      resetSearchUI();
    }

    const myReq = ++reqIdRef.current;
    setLoading(true);

    try {
      const { data } = await axios.get('/api/events', {
        params: { q: qVal, location: locVal, when: whenVal, gl: DEFAULT_GL, hl: DEFAULT_HL, start: startVal },
      });
      if (myReq !== reqIdRef.current) return;

      const items = normalizeEvents(data);
      setEvents(prev => (reset ? items : [...prev, ...items]));
      if (reset) searchCache.set(key, { ts: Date.now(), items });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Search failed';
      toast({ title: msg, tone: 'error' });
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
    }
  };

  const runQuickSearch = async (term = '', whenVal = '', city = '') => {
    const loc = city ? `${city}, ${DEFAULT_EVENT_LOCATION}` : DEFAULT_EVENT_LOCATION;
    setQ(term);
    setWhen(whenVal || '');
    setLocation(city ? loc : '');
    await searchEvents(true, { q: term, when: whenVal || '', location: loc });
  };

  useEffect(() => {
    if (!showTravel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    const onKey = (e) => { if (e.key === 'Escape') setShowTravel(false); };
    window.addEventListener('keydown', onKey);
    if (modalRef.current) modalRef.current.focus();
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [showTravel]);

  const loadMore = async () => {
    setPageStart(p => p + 10);
    await searchEvents(false);
  };

  const fetchFlightsWithFallbacks = async (from, arrivals, dOutISO, dRetISO, stayNights) => {
    for (const arrivalId of arrivals) {
      try {
        const r = await axios.get('/api/travel/flights', {
          params: {
            from, fromId: from, origin: from,
            arrivalId, to: arrivalId, toId: arrivalId, destination: arrivalId,
            departDate: dOutISO, outboundDate: dOutISO,
            inboundDate: dRetISO, returnDate: dRetISO,
            stayNights,
          },
        });
        if (hasAnyFlights(r.data)) {
          setFlights(r.data);
          setUsedArrival(arrivalId);
          if (arrivals[0] !== arrivalId) {
            toast({ title: `Using nearby airport: ${arrivalId}`, message: 'Found better availability.', tone: 'info' });
          }
          return true;
        }
      } catch {}
    }
    setFlights({ error: 'No flights found for nearby airports' });
    setUsedArrival(arrivals[0] || '');
    return false;
  };

  const selectEvent = async (evt) => {
    setSelected(evt);
    setShowTravel(true);
    setFlights(null);
    setHotels([]);
    setUsedArrival('');
    setFlightsLoading(true);
    setHotelsLoading(true);

    const { departISO, returnISO } = getEventTravelDates(evt);
    if (!departISO || !returnISO) {
      const today = new Date();
      const out = new Date(today); out.setDate(today.getDate() + 14);
      const ret = new Date(out); ret.setDate(out.getDate() + 1);
      setOutboundDate(out.toISOString().slice(0, 10));
      setReturnDate(ret.toISOString().slice(0, 10));
    } else {
      setOutboundDate(departISO);
      setReturnDate(returnISO);
    }

    const city = evt?.city || '';
    const venue = evt?.venue || '';

    try {
      const res = await axios.get('/api/travel/hotels', {
        params: { q: venue ? `hotels near ${venue} ${city}` : `hotels in ${city}`, city, venue },
      });
      const h = res.data;
      const list = Array.isArray(h) ? h : (h?.localResults || h?.results || h?.places || h?.data || []);
      setHotels(Array.isArray(list) ? list : []);
    } catch { setHotels([]); }
    finally { setHotelsLoading(false); }

    const override = (arrivalOverride || '').trim().toUpperCase();
    const candidates = override ? [override] : await resolveCityToIataListNinjas(city);
    const outISO = departISO || outboundDate;
    const retISO = returnISO || returnDate;
    await fetchFlightsWithFallbacks(originIata || 'RIX', candidates, outISO, retISO, 1);
    setFlightsLoading(false);
  };

  const refreshFlights = async () => {
    if (!selected) return;
    const city = selected?.city || '';
    const override = (arrivalOverride || '').trim().toUpperCase();
    const candidates = override ? [override] : await resolveCityToIataListNinjas(city);

    let outISO = outboundDate, retISO = returnDate;
    if (!outISO || !retISO) {
      const d = getEventTravelDates(selected);
      outISO = d.departISO; retISO = d.returnISO;
      setOutboundDate(outISO || outboundDate);
      setReturnDate(retISO || returnDate);
    }

    setFlightsLoading(true);
    setFlights(null);
    await fetchFlightsWithFallbacks(originIata || 'RIX', candidates, outISO, retISO, 1);
    setFlightsLoading(false);
  };

  const refreshHotels = async () => {
    if (!selected) return;
    const city = selected?.city || '';
    const venue = selected?.venue || '';
    setHotelsLoading(true);
    try {
      const r = await axios.get('/api/travel/hotels', {
        params: { q: venue ? `hotels near ${venue} ${city}` : `hotels in ${city}`, city, venue },
      });
      const h = r.data;
      const list = Array.isArray(h) ? h : (h?.localResults || h?.results || h?.places || h?.data || []);
      setHotels(Array.isArray(list) ? list : []);
    } catch { setHotels([]); }
    finally { setHotelsLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) { toast({ title: 'Please sign in first', tone: 'warn' }); return; }

    const flightOptions = extractFlightOptions(flights).map(normalizeFlightOption).slice(0, 10);
    const hotelOptions = (Array.isArray(hotels) ? hotels : []).map(normalizeHotel);
    const ok = (i, arr) => Number.isInteger(i) && i >= 0 && i < arr.length;

    const chosenFlight = ok(selectedFlight, flightOptions) ? flightOptions[selectedFlight] : null;
    const chosenHotel = ok(selectedHotel, hotelOptions) ? hotelOptions[selectedHotel] : null;

    if (!chosenFlight && !chosenHotel) { toast({ title: 'Select a flight or hotel first', tone: 'warn' }); return; }

    const payload = {
      title: suggestTripTitle(selected, usedArrival) || 'My Trip',
      flights: chosenFlight ? [chosenFlight] : [],
      hotels: chosenHotel ? [chosenHotel] : [],
      user_id: userId,
    };

    setSaving(true);

    try {
      const ttl = 4800;
      const notBefore = Date.now() + 800;
      sessionStorage.setItem('toastRelay', JSON.stringify({
        title: 'Trip saved!',
        message: usedArrival ? `Arrival: ${usedArrival}` : '',
        tone: 'success',
        ttl,
        until: Date.now() + (ttl + 12000),
        notBefore,
        _shown: false
      }));
    } catch {}

    router.post('/bookmarks', payload, {
      preserveScroll: true,
      onSuccess: () => { router.visit('/bookmarks', { replace: true }); },
      onError: () => {
        try { sessionStorage.removeItem('toastRelay'); } catch {}
        toast({ title: 'Failed to save trip', tone: 'error' });
      },
      onFinish: () => setSaving(false),
    });
  };

  return (
    <>
      <TopNav active="dashboard" />
      <div className={`main-wrapper ${searchTriggered ? 'search-active' : ''} ${showLanding ? 'landing' : ''}`}>
        <Toasts toasts={toasts} onDismiss={dismissToast} />

        <SearchHeader
          q={q} setQ={setQ}
          location={location} setLocation={setLocation}
          when={when} setWhen={setWhen}
          loading={loading}
          showSuggestions={showLanding}
          onSubmitSearch={(e, currentQ) => {
            e.preventDefault();
            const liveQ = (currentQ ?? q ?? '').trim();
            if (!liveQ) { toast({ title: 'Type something to search', tone: 'warn' }); return; }
            setQ(liveQ);
            searchEvents(true, { q: liveQ });
          }}
          onClear={() => {
            setQ(''); setLocation(''); setWhen('');
            resetSearchUI();
            setSearchTriggered(false);
            setLastQuery('');
          }}
          runQuickSearch={runQuickSearch}
        />

        <main className="results-area">
          {!showLanding && (
            <>
              {loading && events.length === 0 && (
                <div className="cards-stack">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="event-card skeleton">
                      <div className="skeleton-line title" />
                      <div className="skeleton-line meta" />
                      <div className="skeleton-actions">
                        <div className="skeleton-chip" />
                        <div className="skeleton-chip" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && events.length === 0 && (searchTriggered || !!lastQuery) && (
                <div className="muted center">No events found{lastQuery ? ` for “${lastQuery}”` : ''}.</div>
              )}

              {events?.map((evt, idx) => (
                <EventCard key={idx} evt={evt} onSelect={() => selectEvent(evt)} />
              ))}

              {events.length > 0 && (
                <div className="load-more">
                  <button disabled={loading} onClick={loadMore} className="btn">
                    {loading ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {showTravel && selected && (
          <TravelModal
            selected={selected}
            flights={flights}
            hotels={hotels}
            selectedFlight={selectedFlight}
            setSelectedFlight={setSelectedFlight}
            selectedHotel={selectedHotel}
            setSelectedHotel={setSelectedHotel}
            saving={saving}
            handleSave={handleSave}
            onClose={() => setShowTravel(false)}
            modalRef={modalRef}
            flightsLoading={flightsLoading}
            hotelsLoading={hotelsLoading}
          />
        )}
      </div>
    </>
  );
}

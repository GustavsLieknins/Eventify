import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';
import TopNav from '@/Shared/TopNav';
import { router, usePage } from '@inertiajs/react';

import Toasts from './components/Toasts';
import SearchHeader from './components/SearchHeader';
import EventCard from './components/EventCard';
import TravelModal from './components/TravelModal';

import {
  DEFAULT_GL, DEFAULT_HL, DEFAULT_EVENT_LOCATION,
  resolveCityToIataList, hasAnyFlights, suggestTripTitle,
  normalizeEvents, extractFlightOptions, normalizeFlightOption, normalizeHotel,
  getEventTravelDates, guessOriginIata,
} from './utils';

const _uid = () => Math.random().toString(36).slice(2, 9);

const searchCache = new Map();
const cacheKey = (q, when, loc) => `${q}|||${when || ''}|||${loc || ''}`;
const CACHE_TTL_MS = 1000 * 60 * 60;

export default function Dashboard() {
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [when, setWhen] = useState('');

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  const [lastQuery, setLastQuery] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [pageStart, setPageStart] = useState(0);

  const showLanding = !loading && events.length === 0 && !searchTriggered && !lastQuery;

  const reqIdRef = useRef(0);

  const [selected, setSelected] = useState(null);
  const [flights, setFlights] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [usedArrival, setUsedArrival] = useState('');

  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  const { auth } = usePage().props;
  const userId = auth?.user?.id ?? null;

  const [arrivalOverride, setArrivalOverride] = useState('');
  const [outboundDate, setOutboundDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const [originIata, setOriginIata] = useState('RIX');

  const [showTravel, setShowTravel] = useState(false);
  const modalRef = useRef(null);

  const [saving, setSaving] = useState(false);

  const [toasts, setToasts] = useState([]);
  const pushToast = ({ title, message = '', tone = 'info', ttl = 3800 }) => {
    const id = _uid();
    setToasts(t => [...t, { id, title, message, tone, ttl }]);
    window.setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), ttl + 250);
  };
  const dismissToast = (id) => setToasts(ts => ts.filter(x => x.id !== id));

  useEffect(() => {
    let mounted = true;
    (async () => {
      const iata = await guessOriginIata('RIX');
      if (mounted) setOriginIata(iata || 'RIX');
    })();
    return () => { mounted = false; };
  }, []);

  const searchEvents = async (reset = true, overrides = {}) => {
    const qVal     = ((overrides.q ?? q) || '').trim();
    const whenVal  = overrides.when ?? when;
    const locVal   = overrides.location ?? (location || DEFAULT_EVENT_LOCATION);
    const startVal = reset ? 0 : pageStart;

    if (!qVal) {
      pushToast({ title: 'Type something to search', tone: 'warn' });
      return;
    }

    const key = cacheKey(qVal, whenVal, locVal);
    setLastQuery(qVal);
    setSearchTriggered(true);

    if (reset) {
      const cached = searchCache.get(key);
      const fresh = cached && (Date.now() - cached.ts) < CACHE_TTL_MS;
      setEvents(fresh && Array.isArray(cached.items) ? cached.items : []);
      setPageStart(0);
      setSelected(null);
      setFlights(null);
      setHotels([]);
      setShowTravel(false);
      setUsedArrival('');
    }

    const myReqId = ++reqIdRef.current;
    setLoading(true);

    try {
      const { data } = await axios.get('/api/events', {
        params: { q: qVal, location: locVal, when: whenVal, gl: DEFAULT_GL, hl: DEFAULT_HL, start: startVal },
      });

      if (myReqId !== reqIdRef.current) return;

      const items = normalizeEvents(data);
      setEvents(prev => (reset ? items : [...prev, ...items]));

      if (reset) {
        searchCache.set(key, { ts: Date.now(), items });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Search failed';
      pushToast({ title: msg, tone: 'error' });
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    const onKey = (e) => { if (e.key === 'Escape') setShowTravel(false); };
    window.addEventListener('keydown', onKey);
    if (modalRef.current) modalRef.current.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [showTravel]);

  const loadMore = async () => {
    setPageStart((prev) => prev + 10);
    await searchEvents(false);
  };

  const fetchFlightsWithFallbacks = async (from, arrivalList, dOutISO, dRetISO, stayNights) => {
    for (const arrivalId of arrivalList) {
      try {
        const res = await axios.get('/api/travel/flights', {
          params: {
            from, fromId: from, origin: from,
            arrivalId, to: arrivalId, toId: arrivalId, destination: arrivalId,
            departDate: dOutISO, outboundDate: dOutISO,
            inboundDate: dRetISO, returnDate: dRetISO,
            stayNights,
          },
        });
        if (hasAnyFlights(res.data)) {
          setFlights(res.data);
          setUsedArrival(arrivalId);
          if (arrivalList[0] !== arrivalId) {
            pushToast({ title: `Using nearby airport: ${arrivalId}`, message: 'Found better availability.', tone: 'info' });
          }
          return true;
        }
      } catch {

      }
    }
    setFlights({ error: 'No flights found for nearby airports' });
    setUsedArrival(arrivalList[0] || '');
    return false;
  };

  const selectEvent = async (evt) => {
    setSelected(evt);
    setShowTravel(true);
    setFlights(null);
    setHotels([]);
    setUsedArrival('');

    const { departISO, returnISO } = getEventTravelDates(evt);

    if (!departISO || !returnISO) {
      const today = new Date();
      const out = new Date(today); out.setDate(today.getDate() + 14);
      const ret = new Date(out);   ret.setDate(out.getDate() + 1);
      setOutboundDate(out.toISOString().slice(0, 10));
      setReturnDate(ret.toISOString().slice(0, 10));
    } else {
      setOutboundDate(departISO);
      setReturnDate(returnISO);
    }

    const city = evt?.city || '';
    const venue = evt?.venue || '';

    try {
      const primary = await axios.get('/api/travel/hotels', {
        params: { q: venue ? `hotels near ${venue} ${city}` : `hotels in ${city}`, city, venue },
      });
      const h = primary.data;
      const list = Array.isArray(h) ? h : (h?.localResults || h?.results || h?.places || h?.data || []);
      setHotels(Array.isArray(list) ? list : []);
    } catch { setHotels([]); }

    const override = (arrivalOverride || '').trim().toUpperCase();
    const candidates = override ? [override] : resolveCityToIataList(city);
    if (candidates.length === 0) { setFlights({ error: 'No arrival airport for this city' }); return; }

    const outISO = departISO || outboundDate;
    const retISO = returnISO || returnDate;

    await fetchFlightsWithFallbacks(originIata || 'RIX', candidates, outISO, retISO, 1);
  };

  const refreshFlights = async () => {
    if (!selected) return;
    const city = selected?.city || '';
    const override = (arrivalOverride || '').trim().toUpperCase();
    const candidates = override ? [override] : resolveCityToIataList(city);
    if (candidates.length === 0) return;

    let outISO = outboundDate, retISO = returnDate;
    if (!outISO || !retISO) {
      const d = getEventTravelDates(selected);
      outISO = d.departISO; retISO = d.returnISO;
      setOutboundDate(outISO || outboundDate);
      setReturnDate(retISO || returnDate);
    }

    setFlights(null);
    await fetchFlightsWithFallbacks(originIata || 'RIX', candidates, outISO, retISO, 1);
  };

  const refreshHotels = async () => {
    if (!selected) return;
    const city = selected?.city || '';
    const venue = selected?.venue || '';
    try {
      const res = await axios.get('/api/travel/hotels', {
        params: { q: venue ? `hotels near ${venue} ${city}` : `hotels in ${city}`, city, venue },
      });
      const h = res.data;
      const list = Array.isArray(h) ? h : (h?.localResults || h?.results || h?.places || h?.data || []);
      setHotels(Array.isArray(list) ? list : []);
    } catch { setHotels([]); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) { pushToast({ title: 'Please sign in first', tone: 'warn' }); return; }

    const flightOptions = extractFlightOptions(flights).map(normalizeFlightOption).slice(0, 10);
    const hotelOptions  = (Array.isArray(hotels) ? hotels : []).map(normalizeHotel);

    const isValidIndex = (i, arr) => Number.isInteger(i) && i >= 0 && i < arr.length;

    const selectedFlightData = isValidIndex(selectedFlight, flightOptions) ? flightOptions[selectedFlight] : null;
    const selectedHotelData  = isValidIndex(selectedHotel,  hotelOptions)  ? hotelOptions[selectedHotel]  : null;

    if (!selectedFlightData && !selectedHotelData) {
      pushToast({ title: 'Select a flight or hotel first', tone: 'warn' });
      return;
    }

    const payload = {
      title: suggestTripTitle(selected, usedArrival) || 'My Trip',
      flights: selectedFlightData ? [selectedFlightData] : [],
      hotels:  selectedHotelData  ? [selectedHotelData]  : [],
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
        pushToast({ title: 'Failed to save trip', tone: 'error' });
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
            if (!liveQ) { pushToast({ title: 'Type something to search', tone: 'warn' }); return; }
            setQ(liveQ);
            searchEvents(true, { q: liveQ });
          }}
          onClear={() => {
            setQ(''); setLocation(''); setWhen('');
            setEvents([]); setSelected(null); setFlights(null); setHotels([]);
            setPageStart(0); setArrivalOverride(''); setOutboundDate(''); setReturnDate('');
            setSearchTriggered(false); setShowTravel(false); setLastQuery(''); setUsedArrival('');
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
          />
        )}
      </div>
    </>
  );
}

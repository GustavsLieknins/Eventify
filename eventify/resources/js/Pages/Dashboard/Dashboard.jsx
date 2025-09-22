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
  CITY_TO_IATA, normalizeEvents, extractFlightOptions, normalizeFlightOption, normalizeHotel
} from './utils';

/* uid for toasts */
const _uid = () => Math.random().toString(36).slice(2, 9);

export default function Dashboard() {
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [when, setWhen] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [flights, setFlights] = useState(null);
  const [hotels, setHotels] = useState([]);

  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  const { auth } = usePage().props;
  const userId = auth?.user?.id ?? null;

  const [searchTriggered, setSearchTriggered] = useState(false);
  const [pageStart, setPageStart] = useState(0);

  const [tripCfg, setTripCfg] = useState({ from: 'RIX', stayNights: 1 });
  const [arrivalOverride, setArrivalOverride] = useState('');
  const [outboundDate, setOutboundDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

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

  /* ---- API: search (supports overrides to avoid stale state) ---- */
  const searchEvents = async (reset = true, overrides = {}) => {
    setLoading(true);

    const qVal     = (overrides.q ?? q) || '';
    const whenVal  = overrides.when ?? when;
    const locVal   = overrides.location ?? (location || DEFAULT_EVENT_LOCATION);
    const startVal = reset ? 0 : pageStart;

    if (reset) {
      setEvents([]);
      setPageStart(0);
      setSelected(null);
      setFlights(null);
      setHotels([]);
      setShowTravel(false);
    }

    try {
      const { data } = await axios.get('/api/events', {
        params: { q: qVal, location: locVal, when: whenVal, gl: DEFAULT_GL, hl: DEFAULT_HL, start: startVal },
      });
      const items = normalizeEvents(data);
      setEvents((prev) => (reset ? items : [...prev, ...items]));
    } finally {
      setLoading(false);
    }
  };

  /* Quick chips (pass overrides straight into the request) */
  const runQuickSearch = async (term = '', whenVal = '', city = '') => {
    const loc = city ? `${city}, ${DEFAULT_EVENT_LOCATION}` : DEFAULT_EVENT_LOCATION;
    setQ(term);
    setWhen(whenVal || '');
    setLocation(city ? loc : '');

    setSearchTriggered(true);
    await searchEvents(true, { q: term, when: whenVal || '', location: loc });
  };

  /* Modal lock + esc + body class for styling */
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

  const selectEvent = async (evt) => {
    setSelected(evt);
    setShowTravel(true);
    setFlights(null);
    setHotels([]);

    const today = new Date();
    const dOut = new Date(today);
    dOut.setDate(today.getDate() + 14);
    const dRet = new Date(dOut);
    dRet.setDate(dOut.getDate() + Math.max(1, tripCfg.stayNights));
    const dOutISO = dOut.toISOString().slice(0, 10);
    const dRetISO = dRet.toISOString().slice(0, 10);
    setOutboundDate(dOutISO);
    setReturnDate(dRetISO);

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

    const arrivalId = arrivalOverride.trim().toUpperCase() || CITY_TO_IATA[city] || '';
    if (!arrivalId) return;

    try {
      const flightRes = await axios.get('/api/travel/flights', {
        params: { from: tripCfg.from, arrivalId, outboundDate: dOutISO, returnDate: dRetISO, stayNights: tripCfg.stayNights },
      });
      setFlights(flightRes.data);
    } catch { setFlights({ error: 'Failed to fetch flights' }); }
  };

  const refreshFlights = async () => {
    if (!selected) return;
    const city = selected?.city || '';
    const arrivalId = arrivalOverride.trim().toUpperCase() || CITY_TO_IATA[city] || '';
    if (!arrivalId) return;

    try {
      const flightRes = await axios.get('/api/travel/flights', {
        params: { from: tripCfg.from, arrivalId, outboundDate, returnDate, stayNights: tripCfg.stayNights },
      });
      setFlights(flightRes.data);
    } catch { setFlights({ error: 'Failed to fetch flights' }); }
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
      title: 'My Trip',
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
        message: '',
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

  const showSuggestions = !loading && events.length === 0 && !searchTriggered;

  return (
    <>
      <TopNav active="dashboard" />

      <div className={`main-wrapper ${searchTriggered ? 'search-active' : ''} ${showSuggestions ? 'landing' : ''}`}>
        <Toasts toasts={toasts} onDismiss={dismissToast} />

        <SearchHeader
          q={q} setQ={setQ}
          location={location} setLocation={setLocation}
          when={when} setWhen={setWhen}
          loading={loading}
          showSuggestions={showSuggestions}
          onSubmitSearch={(e) => { e.preventDefault(); setSearchTriggered(true); searchEvents(true); }}
          onClear={() => {
            setQ(''); setLocation(''); setWhen('');
            setEvents([]); setSelected(null); setFlights(null); setHotels([]);
            setPageStart(0); setArrivalOverride(''); setOutboundDate(''); setReturnDate('');
            setSearchTriggered(false); setShowTravel(false);
          }}
          runQuickSearch={runQuickSearch}
        />

        <main className="results-area">
          {!showSuggestions && events?.length === 0 && !loading && (
            <div className="muted center">No events yet. Try a search.</div>
          )}

          {events?.map((evt, idx) => (
            <EventCard key={idx} evt={evt} onSelect={setSelected ? () => selectEvent(evt) : undefined} />
          ))}

          {events.length > 0 && (
            <div className="load-more">
              <button disabled={loading} onClick={loadMore} className="btn">
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
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

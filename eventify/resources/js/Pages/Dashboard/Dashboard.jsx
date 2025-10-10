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
import geo from '@/data/geo.json';
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

  const ninjasGet = async (url) => {
    try {
      const r = await fetch(url, { headers: { 'X-Api-Key': ninjasKey } });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  };

  const countryAliasToIso2 = (s) => {
    const v = (s || '').toLowerCase().trim();
    if (['us','usa','united states','united states of america','america'].includes(v)) return 'US';
    if (['united kingdom','uk','great britain','gb','britain','england'].includes(v)) return 'GB';
    const map = { canada:'CA', ca:'CA', france:'FR', fr:'FR', germany:'DE', de:'DE', spain:'ES', es:'ES',
      italy:'IT', it:'IT', austria:'AT', at:'AT', belgium:'BE', be:'BE', portugal:'PT', pt:'PT',
      'czech republic':'CZ', czechia:'CZ', cz:'CZ', poland:'PL', pl:'PL', greece:'GR', gr:'GR',
      turkey:'TR', tr:'TR', sweden:'SE', se:'SE', norway:'NO', no:'NO', denmark:'DK', dk:'DK',
      finland:'FI', fi:'FI', switzerland:'CH', ch:'CH', netherlands:'NL', nl:'NL', ireland:'IE', ie:'IE'
    };
    return map[v] || '';
  };

  const normalizeCityKey = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  const parseCityIso = (label) => {
    const parts = (label || '').split(',').map(s => s.trim()).filter(Boolean);
    const city = parts[0] || '';
    const tail = parts[parts.length - 1] || '';
    const prev = parts[parts.length - 2] || '';
    let iso = '';
    if (/^[A-Z]{2}$/.test(tail)) iso = geo.stateProvinceToCountry[tail] || tail;
    else iso = countryAliasToIso2(tail);
    if (!iso && /^[A-Z]{2}$/.test(prev)) iso = geo.stateProvinceToCountry[prev] || countryAliasToIso2(prev);
    return { city, iso };
  };

  const resolveCityToIataListNinjas = async (cityLabel) => {
    const { city, iso } = parseCityIso(cityLabel);
    const key = normalizeCityKey(city);
    if (!city) return ['LHR'];
    if (geo.basicIata[key]) return geo.basicIata[key];

    let codes = [];
    let lat = null, lon = null;

    if (ninjasKey) {
      const g = new URL('https://api.api-ninjas.com/v1/geocoding');
      g.searchParams.set('city', city);
      if (iso) g.searchParams.set('country', iso);
      const geoRes = await ninjasGet(g.toString());
      const c = Array.isArray(geoRes) ? geoRes[0] : null;
      if (c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
        lat = c.latitude; lon = c.longitude;
      }
    }

    if ((lat == null || lon == null) && geo.basicGeo[key]) {
      lat = geo.basicGeo[key].latitude;
      lon = geo.basicGeo[key].longitude;
    }

    if (lat != null && lon != null) {
      const ranked = geo.airports
        .map(a => ({ code: a.iata, d: haversineKm(lat, lon, a.lat, a.lon) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, 6)
        .map(x => x.code);
      codes = Array.from(new Set(ranked));
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
            stayNights: Math.max(1, stayNights || 1),
          },
        });
        if (hasAnyFlights(r.data)) {
          setFlights(r.data);
          setUsedArrival(arrivalId);
          if (arrivals[0] !== arrivalId) {
            toast({ title: `Using nearby airport: ${arrivalId}`, tone: 'info' });
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

    const dates = getEventTravelDates(evt);
    let outISO = dates.departISO;
    let retISO = dates.returnISO;

    if (!outISO || !retISO) {
      const today = new Date();
      const out = new Date(today); out.setDate(today.getDate() + 14);
      const ret = new Date(out); ret.setDate(ret.getDate() + 1);
      outISO = out.toISOString().slice(0, 10);
      retISO = ret.toISOString().slice(0, 10);
    }

    setOutboundDate(outISO);
    setReturnDate(retISO);

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
      outISO = d.departISO || outboundDate;
      retISO = d.returnISO || returnDate;
      setOutboundDate(outISO);
      setReturnDate(retISO);
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

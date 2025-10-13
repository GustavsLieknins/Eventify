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

export default function Dashboard() {
  useVisitBeacon();

  const { auth } = usePage().props;
  const userId = auth?.user?.id ?? null;

  // search controls
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [whenFilter, setWhenFilter] = useState('');
  const [originIata, setOriginIata] = useState('RIX');

  // search results + ui
  const [eventResults, setEventResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [resultStart, setResultStart] = useState(0);

  // modal + selections
  const [activeEvent, setActiveEvent] = useState(null);
  const [isTravelOpen, setIsTravelOpen] = useState(false);
  const [flightResponse, setFlightResponse] = useState(null);
  const [hotelResults, setHotelResults] = useState([]);
  const [resolvedArrivalIata, setResolvedArrivalIata] = useState('');
  const [arrivalOverride, setArrivalOverride] = useState('');
  const [outboundDate, setOutboundDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [selectedFlightIndex, setSelectedFlightIndex] = useState(null);
  const [selectedHotelIndex, setSelectedHotelIndex] = useState(null);
  const [isSavingTrip, setIsSavingTrip] = useState(false);

  const [isFlightsLoading, setIsFlightsLoading] = useState(false);
  const [isHotelsLoading, setIsHotelsLoading] = useState(false);

  const requestIdRef = useRef(0);
  const modalRef = useRef(null);

  const [toasts, setToasts] = useState([]);
  const pushToast = ({ title, message = '', tone = 'info', ttl = 3800 }) => {
    const id = uid();
    setToasts(t => [...t, { id, title, message, tone, ttl }]);
    window.setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), ttl + 250);
  };
  const dismissToast = (id) => setToasts(ts => ts.filter(x => x.id !== id));

  const showLanding = !isSearching && eventResults.length === 0 && !hasSearched && !lastSearchTerm;

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

  const parseCityIsoFromLabel = (label) => {
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

  const resolveCityToIataList = async (cityLabel) => {
    const { city, iso } = parseCityIsoFromLabel(cityLabel);
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
    setEventResults([]);
    setResultStart(0);
    setActiveEvent(null);
    setFlightResponse(null);
    setHotelResults([]);
    setIsTravelOpen(false);
    setResolvedArrivalIata('');
    setSelectedFlightIndex(null);
    setSelectedHotelIndex(null);
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
    const term = ((overrides.searchTerm ?? searchTerm) || '').trim();
    const whenVal = overrides.whenFilter ?? whenFilter;
    const locVal = overrides.locationFilter ?? (locationFilter || DEFAULT_EVENT_LOCATION);
    const startVal = reset ? 0 : resultStart;

    if (!term) {
      pushToast({ title: 'Type something to search', tone: 'warn' });
      return;
    }

    setLastSearchTerm(term);
    setHasSearched(true);
    if (reset) resetSearchUI();

    const myReq = ++requestIdRef.current;
    setIsSearching(true);

    try {
      const { data } = await axios.get('/api/events', {
        params: { q: term, location: locVal, when: whenVal, gl: DEFAULT_GL, hl: DEFAULT_HL, start: startVal },
      });
      if (myReq !== requestIdRef.current) return;
      const items = normalizeEvents(data);
      setEventResults(prev => (reset ? items : [...prev, ...items]));
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Search failed';
      pushToast({ title: msg, tone: 'error' });
    } finally {
      if (myReq === requestIdRef.current) setIsSearching(false);
    }
  };

  const runQuickSearch = async (term = '', whenVal = '', city = '') => {
    const loc = city ? `${city}, ${DEFAULT_EVENT_LOCATION}` : DEFAULT_EVENT_LOCATION;
    setSearchTerm(term);
    setWhenFilter(whenVal || '');
    setLocationFilter(city ? loc : '');
    await searchEvents(true, { searchTerm: term, whenFilter: whenVal || '', locationFilter: loc });
  };

  // modal show/hide
  useEffect(() => {
    if (!isTravelOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    const onKey = (e) => { if (e.key === 'Escape') setIsTravelOpen(false); };
    window.addEventListener('keydown', onKey);
    if (modalRef.current) modalRef.current.focus();
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [isTravelOpen]);

  const loadMore = async () => {
    setResultStart(p => p + 10);
    await searchEvents(false);
  };

  // flights helper with nearby arrivals
  const fetchFlightsWithFallbacks = async (fromIata, arrivalIatas, departISO, returnISO, stayNights) => {
    for (const arrivalId of arrivalIatas) {
      try {
        const r = await axios.get('/api/travel/flights', {
          params: {
            from: fromIata,
            arrivalId,
            departDate: departISO,
            outboundDate: departISO,
            inboundDate: returnISO,
            returnDate: returnISO,
            stayNights: Math.max(1, stayNights || 1),
          },
        });
        if (hasAnyFlights(r.data)) {
          setFlightResponse(r.data);
          setResolvedArrivalIata(arrivalId);
          if (arrivalIatas[0] !== arrivalId) {
            pushToast({ title: `Using nearby airport: ${arrivalId}`, tone: 'info' });
          }
          return true;
        }
      } catch {}
    }
    setFlightResponse({ error: 'No flights found for nearby airports' });
    setResolvedArrivalIata(arrivalIatas[0] || '');
    return false;
  };

  const openEventTravel = async (evt) => {
    setActiveEvent(evt);
    setIsTravelOpen(true);
    setFlightResponse(null);
    setHotelResults([]);
    setResolvedArrivalIata('');
    setIsFlightsLoading(true);
    setIsHotelsLoading(true);

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

    // hotels
    try {
      const res = await axios.get('/api/travel/hotels', {
        params: { q: venue ? `hotels near ${venue} ${city}` : `hotels in ${city}`, city, venue },
      });
      const h = res.data;
      const list = Array.isArray(h) ? h : (h?.localResults || h?.results || h?.places || h?.data || []);
      setHotelResults(Array.isArray(list) ? list : []);
    } catch {
      setHotelResults([]);
    } finally {
      setIsHotelsLoading(false);
    }

    // flights
    const manualArrival = (arrivalOverride || '').trim().toUpperCase();
    const candidateArrivals = manualArrival ? [manualArrival] : await resolveCityToIataList(city);
    await fetchFlightsWithFallbacks(originIata || 'RIX', candidateArrivals, outISO, retISO, 1);
    setIsFlightsLoading(false);
  };

  const refreshFlights = async () => {
    if (!activeEvent) return;
    const city = activeEvent?.city || '';
    const manualArrival = (arrivalOverride || '').trim().toUpperCase();
    const candidateArrivals = manualArrival ? [manualArrival] : await resolveCityToIataList(city);

    let outISO = outboundDate, retISO = returnDate;
    if (!outISO || !retISO) {
      const d = getEventTravelDates(activeEvent);
      outISO = d.departISO || outboundDate;
      retISO = d.returnISO || returnDate;
      setOutboundDate(outISO);
      setReturnDate(retISO);
    }

    setIsFlightsLoading(true);
    setFlightResponse(null);
    await fetchFlightsWithFallbacks(originIata || 'RIX', candidateArrivals, outISO, retISO, 1);
    setIsFlightsLoading(false);
  };

  const refreshHotels = async () => {
    if (!activeEvent) return;
    const city = activeEvent?.city || '';
    const venue = activeEvent?.venue || '';
    setIsHotelsLoading(true);
    try {
      const r = await axios.get('/api/travel/hotels', {
        params: { q: venue ? `hotels near ${venue} ${city}` : `hotels in ${city}`, city, venue },
      });
      const h = r.data;
      const list = Array.isArray(h) ? h : (h?.localResults || h?.results || h?.places || h?.data || []);
      setHotelResults(Array.isArray(list) ? list : []);
    } catch { setHotelResults([]); }
    finally { setIsHotelsLoading(false); }
  };

  const saveTrip = async (e) => {
    e.preventDefault();
    if (!userId) { pushToast({ title: 'Please sign in first', tone: 'warn' }); return; }

    const flightOptions = extractFlightOptions(flightResponse).map(normalizeFlightOption).slice(0, 10);
    const hotelOptions = (Array.isArray(hotelResults) ? hotelResults : []).map(normalizeHotel);
    const inRange = (i, arr) => Number.isInteger(i) && i >= 0 && i < arr.length;

    const chosenFlight = inRange(selectedFlightIndex, flightOptions) ? flightOptions[selectedFlightIndex] : null;
    const chosenHotel = inRange(selectedHotelIndex, hotelOptions) ? hotelOptions[selectedHotelIndex] : null;

    if (!chosenFlight && !chosenHotel) { pushToast({ title: 'Select a flight or hotel first', tone: 'warn' }); return; }

    const payload = {
      title: suggestTripTitle(activeEvent, resolvedArrivalIata) || 'My Trip',
      flights: chosenFlight ? [chosenFlight] : [],
      hotels: chosenHotel ? [chosenHotel] : [],
      user_id: userId,
    };

    setIsSavingTrip(true);

    try {
      const ttl = 4800;
      const notBefore = Date.now() + 800;
      sessionStorage.setItem('toastRelay', JSON.stringify({
        title: 'Trip saved!',
        message: resolvedArrivalIata ? `Arrival: ${resolvedArrivalIata}` : '',
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
      onFinish: () => setIsSavingTrip(false),
    });
  };

  return (
    <>
      <TopNav active="dashboard" />
      <div className={`main-wrapper ${hasSearched ? 'search-active' : ''} ${showLanding ? 'landing' : ''}`}>
        <Toasts toasts={toasts} onDismiss={dismissToast} />

        <SearchHeader
          q={searchTerm} setQ={setSearchTerm}
          location={locationFilter} setLocation={setLocationFilter}
          when={whenFilter} setWhen={setWhenFilter}
          loading={isSearching}
          showSuggestions={showLanding}
          onSubmitSearch={(e, currentQ) => {
            e.preventDefault();
            const liveQ = (currentQ ?? searchTerm ?? '').trim();
            if (!liveQ) { pushToast({ title: 'Type something to search', tone: 'warn' }); return; }
            setSearchTerm(liveQ);
            searchEvents(true, { searchTerm: liveQ });
          }}
          onClear={() => {
            setSearchTerm(''); setLocationFilter(''); setWhenFilter('');
            resetSearchUI();
            setHasSearched(false);
            setLastSearchTerm('');
          }}
          runQuickSearch={runQuickSearch}
        />

        <main className="results-area">
          {!showLanding && (
            <>
              {isSearching && eventResults.length === 0 && (
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

              {!isSearching && eventResults.length === 0 && (hasSearched || !!lastSearchTerm) && (
                <div className="muted center">No events found{lastSearchTerm ? ` for “${lastSearchTerm}”` : ''}.</div>
              )}

              {eventResults?.map((evt, idx) => (
                <EventCard key={idx} evt={evt} onSelect={() => openEventTravel(evt)} />
              ))}

              {eventResults.length > 0 && (
                <div className="load-more">
                  <button disabled={isSearching} onClick={loadMore} className="btn">
                    {isSearching ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {isTravelOpen && activeEvent && (
          <TravelModal
            selected={activeEvent}
            flights={flightResponse}
            hotels={hotelResults}
            selectedFlight={selectedFlightIndex}
            setSelectedFlight={setSelectedFlightIndex}
            selectedHotel={selectedHotelIndex}
            setSelectedHotel={setSelectedHotelIndex}
            saving={isSavingTrip}
            handleSave={saveTrip}
            onClose={() => setIsTravelOpen(false)}
            modalRef={modalRef}
            flightsLoading={isFlightsLoading}
            hotelsLoading={isHotelsLoading}
          />
        )}
      </div>
    </>
  );
}

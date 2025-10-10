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
  { iata: 'HAM', lat: 53.6304, lon: 9.9882 },  { iata: 'ZRH', lat: 47.4581, lon: 8.5555 },
  { iata: 'GVA', lat: 46.2381, lon: 6.1089 },  { iata: 'BCN', lat: 41.2974, lon: 2.0833 },
  { iata: 'MAD', lat: 40.4983, lon: -3.5676 }, { iata: 'FCO', lat: 41.8003, lon: 12.2389 },
  { iata: 'MXP', lat: 45.6301, lon: 8.7281 },  { iata: 'VIE', lat: 48.1103, lon: 16.5697 },
  { iata: 'BRU', lat: 50.9010, lon: 4.4844 },  { iata: 'LIS', lat: 38.7742, lon: -9.1342 },
  { iata: 'OPO', lat: 41.2421, lon: -8.6788 }, { iata: 'PRG', lat: 50.1062, lon: 14.2669 },
  { iata: 'WAW', lat: 52.1657, lon: 20.9671 }, { iata: 'KRK', lat: 50.0777, lon: 19.7848 },
  { iata: 'ATH', lat: 37.9364, lon: 23.9445 }, { iata: 'IST', lat: 41.2753, lon: 28.7519 },
  { iata: 'JFK', lat: 40.6413, lon: -73.7781 }, { iata: 'EWR', lat: 40.6895, lon: -74.1745 },
  { iata: 'LGA', lat: 40.7769, lon: -73.8740 }, { iata: 'BOS', lat: 42.3656, lon: -71.0096 },
  { iata: 'MIA', lat: 25.7959, lon: -80.2870 }, { iata: 'FLL', lat: 26.0726, lon: -80.1527 },
  { iata: 'PBI', lat: 26.6832, lon: -80.0956 }, { iata: 'ORD', lat: 41.9742, lon: -87.9073 },
  { iata: 'MDW', lat: 41.7868, lon: -87.7522 }, { iata: 'DFW', lat: 32.8998, lon: -97.0403 },
  { iata: 'DAL', lat: 32.8471, lon: -96.8518 }, { iata: 'ATL', lat: 33.6407, lon: -84.4277 },
  { iata: 'SEA', lat: 47.4502, lon: -122.3088 },{ iata: 'SFO', lat: 37.6213, lon: -122.3790 },
  { iata: 'OAK', lat: 37.7126, lon: -122.2197 },{ iata: 'SJC', lat: 37.3639, lon: -121.9289 },
  { iata: 'LAX', lat: 33.9416, lon: -118.4085 },{ iata: 'SAN', lat: 32.7336, lon: -117.1933 },
  { iata: 'PHX', lat: 33.4373, lon: -112.0078 },{ iata: 'DEN', lat: 39.8561, lon: -104.6737 },
  { iata: 'IAH', lat: 29.9902, lon: -95.3368 }, { iata: 'HOU', lat: 29.6454, lon: -95.2789 },
  { iata: 'IAD', lat: 38.9531, lon: -77.4565 }, { iata: 'DCA', lat: 38.8521, lon: -77.0377 },
  { iata: 'BWI', lat: 39.1754, lon: -76.6684 }, { iata: 'CLT', lat: 35.2144, lon: -80.9473 },
  { iata: 'MSP', lat: 44.883, lon: -93.2109 },  { iata: 'DTW', lat: 42.2162, lon: -83.3554 },
  { iata: 'SLC', lat: 40.7899, lon: -111.9791 },{ iata: 'LAS', lat: 36.084, lon: -115.1537 },
  { iata: 'MCO', lat: 28.4312, lon: -81.3081 }, { iata: 'TPA', lat: 27.9755, lon: -82.5332 },
  { iata: 'AUS', lat: 30.1975, lon: -97.6664 }, { iata: 'BNA', lat: 36.1263, lon: -86.6774 },
  { iata: 'PHL', lat: 39.8729, lon: -75.2437 },
  { iata: 'YYZ', lat: 43.6777, lon: -79.6248 }, { iata: 'YTZ', lat: 43.6287, lon: -79.3962 },
  { iata: 'YUL', lat: 45.4706, lon: -73.7408 }, { iata: 'YVR', lat: 49.1947, lon: -123.1792 },
  { iata: 'YYC', lat: 51.1315, lon: -114.0106 },{ iata: 'YEG', lat: 53.3097, lon: -113.579 },
  { iata: 'YWG', lat: 49.9097, lon: -97.2399 }, { iata: 'YOW', lat: 45.3225, lon: -75.6692 },
  { iata: 'YHZ', lat: 44.8848, lon: -63.5143 }, { iata: 'YYJ', lat: 48.6469, lon: -123.426 },
  { iata: 'YQB', lat: 46.7911, lon: -71.3933 }
];

const BASIC_IATA = {
  'new york': ['JFK','LGA','EWR'],
  'nyc': ['JFK','LGA','EWR'],
  'new york city': ['JFK','LGA','EWR'],
  'los angeles': ['LAX'],
  'chicago': ['ORD','MDW'],
  'miami': ['MIA','FLL','PBI'],
  'boston': ['BOS'],
  'san francisco': ['SFO','OAK','SJC'],
  'oakland': ['OAK','SFO','SJC'],
  'san jose': ['SJC','SFO','OAK'],
  'seattle': ['SEA'],
  'las vegas': ['LAS'],
  'denver': ['DEN'],
  'phoenix': ['PHX'],
  'dallas': ['DFW','DAL'],
  'houston': ['IAH','HOU'],
  'austin': ['AUS'],
  'nashville': ['BNA'],
  'atlanta': ['ATL'],
  'philadelphia': ['PHL'],
  'san diego': ['SAN'],
  'orlando': ['MCO'],
  'tampa': ['TPA'],
  'charlotte': ['CLT'],
  'salt lake city': ['SLC'],
  'washington': ['DCA','IAD','BWI'],
  'washington dc': ['DCA','IAD','BWI'],
  'toronto': ['YYZ','YTZ'],
  'montreal': ['YUL'],
  'vancouver': ['YVR'],
  'calgary': ['YYC'],
  'edmonton': ['YEG'],
  'winnipeg': ['YWG'],
  'ottawa': ['YOW'],
  'quebec city': ['YQB'],
  'halifax': ['YHZ'],
  'victoria': ['YYJ'],
  'london': ['LHR','LGW','LTN','STN','LCY'],
  'manchester': ['MAN'],
  'birmingham': ['BHX'],
  'edinburgh': ['EDI'],
  'glasgow': ['GLA'],
  'belfast': ['BFS'],
  'dublin': ['DUB'],
  'paris': ['CDG','ORY'],
  'berlin': ['BER'],
  'frankfurt': ['FRA'],
  'munich': ['MUC'],
  'hamburg': ['HAM'],
  'amsterdam': ['AMS'],
  'brussels': ['BRU'],
  'zurich': ['ZRH'],
  'geneva': ['GVA'],
  'madrid': ['MAD'],
  'barcelona': ['BCN'],
  'rome': ['FCO'],
  'milan': ['MXP'],
  'lisbon': ['LIS'],
  'porto': ['OPO'],
  'vienna': ['VIE'],
  'prague': ['PRG'],
  'warsaw': ['WAW'],
  'krakow': ['KRK'],
  'athens': ['ATH'],
  'istanbul': ['IST']
};

const BASIC_GEO = {
  'new york': { latitude: 40.7128, longitude: -74.006 },
  'nyc': { latitude: 40.7128, longitude: -74.006 },
  'new york city': { latitude: 40.7128, longitude: -74.006 },
  'los angeles': { latitude: 34.0522, longitude: -118.2437 },
  'chicago': { latitude: 41.8781, longitude: -87.6298 },
  'miami': { latitude: 25.7617, longitude: -80.1918 },
  'boston': { latitude: 42.3601, longitude: -71.0589 },
  'san francisco': { latitude: 37.7749, longitude: -122.4194 },
  'oakland': { latitude: 37.8044, longitude: -122.2711 },
  'san jose': { latitude: 37.3382, longitude: -121.8863 },
  'seattle': { latitude: 47.6062, longitude: -122.3321 },
  'las vegas': { latitude: 36.1699, longitude: -115.1398 },
  'denver': { latitude: 39.7392, longitude: -104.9903 },
  'phoenix': { latitude: 33.4484, longitude: -112.074 },
  'dallas': { latitude: 32.7767, longitude: -96.797 },
  'houston': { latitude: 29.7604, longitude: -95.3698 },
  'austin': { latitude: 30.2672, longitude: -97.7431 },
  'nashville': { latitude: 36.1627, longitude: -86.7816 },
  'washington': { latitude: 38.9072, longitude: -77.0369 },
  'washington dc': { latitude: 38.9072, longitude: -77.0369 },
  'atlanta': { latitude: 33.749, longitude: -84.388 },
  'minneapolis': { latitude: 44.9778, longitude: -93.265 },
  'detroit': { latitude: 42.3314, longitude: -83.0458 },
  'philadelphia': { latitude: 39.9526, longitude: -75.1652 },
  'san diego': { latitude: 32.7157, longitude: -117.1611 },
  'orlando': { latitude: 28.5383, longitude: -81.3792 },
  'tampa': { latitude: 27.9506, longitude: -82.4572 },
  'charlotte': { latitude: 35.2271, longitude: -80.8431 },
  'salt lake city': { latitude: 40.7608, longitude: -111.891 },
  'toronto': { latitude: 43.6532, longitude: -79.3832 },
  'montreal': { latitude: 45.5019, longitude: -73.5674 },
  'vancouver': { latitude: 49.2827, longitude: -123.1207 },
  'calgary': { latitude: 51.0447, longitude: -114.0719 },
  'edmonton': { latitude: 53.5461, longitude: -113.4938 },
  'winnipeg': { latitude: 49.8951, longitude: -97.1384 },
  'ottawa': { latitude: 45.4215, longitude: -75.6972 },
  'quebec city': { latitude: 46.8139, longitude: -71.208 },
  'halifax': { latitude: 44.6488, longitude: -63.5752 },
  'victoria': { latitude: 48.4284, longitude: -123.3656 },
  'london': { latitude: 51.5074, longitude: -0.1278 },
  'manchester': { latitude: 53.4808, longitude: -2.2426 },
  'birmingham': { latitude: 52.4862, longitude: -1.8904 },
  'edinburgh': { latitude: 55.9533, longitude: -3.1883 },
  'glasgow': { latitude: 55.8642, longitude: -4.2518 },
  'belfast': { latitude: 54.5973, longitude: -5.9301 },
  'dublin': { latitude: 53.3498, longitude: -6.2603 },
  'paris': { latitude: 48.8566, longitude: 2.3522 },
  'berlin': { latitude: 52.52, longitude: 13.405 },
  'frankfurt': { latitude: 50.1109, longitude: 8.6821 },
  'munich': { latitude: 48.1351, longitude: 11.582 },
  'hamburg': { latitude: 53.5511, longitude: 9.9937 },
  'amsterdam': { latitude: 52.3676, longitude: 4.9041 },
  'brussels': { latitude: 50.8503, longitude: 4.3517 },
  'zurich': { latitude: 47.3769, longitude: 8.5417 },
  'geneva': { latitude: 46.2044, longitude: 6.1432 },
  'madrid': { latitude: 40.4168, longitude: -3.7038 },
  'barcelona': { latitude: 41.3851, longitude: 2.1734 },
  'rome': { latitude: 41.9028, longitude: 12.4964 },
  'milan': { latitude: 45.4642, longitude: 9.19 },
  'lisbon': { latitude: 38.7223, longitude: -9.1393 },
  'porto': { latitude: 41.1579, longitude: -8.6291 },
  'vienna': { latitude: 48.2082, longitude: 16.3738 },
  'prague': { latitude: 50.0755, longitude: 14.4378 },
  'warsaw': { latitude: 52.2297, longitude: 21.0122 },
  'krakow': { latitude: 50.0647, longitude: 19.945 },
  'athens': { latitude: 37.9838, longitude: 23.7275 },
  'istanbul': { latitude: 41.0082, longitude: 28.9784 }
};

const STATE_PROVINCE_TO_COUNTRY = {
  AL:'US',AK:'US',AZ:'US',AR:'US',CA:'US',CO:'US',CT:'US',DE:'US',FL:'US',GA:'US',
  HI:'US',ID:'US',IL:'US',IN:'US',IA:'US',KS:'US',KY:'US',LA:'US',ME:'US',MD:'US',
  MA:'US',MI:'US',MN:'US',MS:'US',MO:'US',MT:'US',NE:'US',NV:'US',NH:'US',NJ:'US',
  NM:'US',NY:'US',NC:'US',ND:'US',OH:'US',OK:'US',OR:'US',PA:'US',RI:'US',SC:'US',
  SD:'US',TN:'US',TX:'US',UT:'US',VT:'US',VA:'US',WA:'US',WV:'US',WI:'US',WY:'US',DC:'US',
  AB:'CA',BC:'CA',MB:'CA',NB:'CA',NL:'CA',NS:'CA',NT:'CA',NU:'CA',ON:'CA',PE:'CA',QC:'CA',SK:'CA',YT:'CA'
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

  const parseCityIso = (label) => {
    const parts = (label || '').split(',').map(s => s.trim()).filter(Boolean);
    const city = parts[0] || '';
    const tail = parts[parts.length - 1] || '';
    const prev = parts[parts.length - 2] || '';
    let iso = '';
    if (/^[A-Z]{2}$/.test(tail)) iso = STATE_PROVINCE_TO_COUNTRY[tail] || tail;
    else iso = countryAliasToIso2(tail);
    if (!iso && /^[A-Z]{2}$/.test(prev)) iso = STATE_PROVINCE_TO_COUNTRY[prev] || countryAliasToIso2(prev);
    return { city, iso };
  };

  const resolveCityToIataListNinjas = async (cityLabel) => {
    const { city, iso } = parseCityIso(cityLabel);
    const key = normalizeCityKey(city);
    if (!city) return ['LHR'];
    if (BASIC_IATA[key]) return BASIC_IATA[key];

    let codes = [];
    let lat = null, lon = null;

    if (ninjasKey) {
      const g = new URL('https://api.api-ninjas.com/v1/geocoding');
      g.searchParams.set('city', city);
      if (iso) g.searchParams.set('country', iso);
      const geo = await ninjasGet(g.toString());
      const c = Array.isArray(geo) ? geo[0] : null;
      if (c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
        lat = c.latitude; lon = c.longitude;
      }
    }

    if ((lat == null || lon == null) && BASIC_GEO[key]) {
      lat = BASIC_GEO[key].latitude;
      lon = BASIC_GEO[key].longitude;
    }

    if (lat != null && lon != null) {
      const ranked = AIRPORTS
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

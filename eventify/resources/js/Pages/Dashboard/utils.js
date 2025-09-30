
export const DEFAULT_GL = 'uk';
export const DEFAULT_HL = 'en';
export const DEFAULT_EVENT_LOCATION = 'United Kingdom';


export const CITY_TO_IATA = {
  'London, GB': 'LON', 'London, UK': 'LON', London: 'LON',
  'Manchester, GB': 'MAN', Manchester: 'MAN',
  'Birmingham, GB': 'BHX', Birmingham: 'BHX',
  'Edinburgh, GB': 'EDI',
  'Glasgow, GB': 'GLA',
  'Belfast, GB': 'BFS',
  'Dublin, IE': 'DUB',

  'London, CA': 'YXU', 'London, Ontario': 'YXU',
  'Toronto, CA': 'YTO', Toronto: 'YTO',
  'Montreal, CA': 'YMQ', 'Montréal, CA': 'YMQ',
  'Vancouver, CA': 'YVR',
  'Calgary, CA': 'YYC',
  'Ottawa, CA': 'YOW',
  'Winnipeg, CA': 'YWG',

  'New York, US': 'NYC', 'NYC, US': 'NYC', 'New York': 'NYC',
  'Washington, US': 'WAS', 'Washington DC, US': 'WAS', 'Washington, DC': 'WAS',
  'Chicago, US': 'CHI',
  'Los Angeles, US': 'LAX', 'LA, US': 'LAX', 'Los Angeles': 'LAX',
  'San Francisco, US': 'SFO', 'San Francisco': 'SFO',
  'Boston, US': 'BOS',
  'Miami, US': 'MIA',
  'Seattle, US': 'SEA',
  'Dallas, US': 'DFW',
  'Atlanta, US': 'ATL',
  'Houston, US': 'IAH',
  'Orlando, US': 'MCO',
  'Birmingham, US': 'BHM',
  'Manchester, US': 'MHT',

  'Paris, FR': 'PAR', Paris: 'PAR',
  'Milan, IT': 'MIL', Milan: 'MIL',
  'Rome, IT': 'ROM', Rome: 'ROM',
  'Madrid, ES': 'MAD', Madrid: 'MAD',
  'Barcelona, ES': 'BCN', Barcelona: 'BCN',
  'Berlin, DE': 'BER', Berlin: 'BER',
  'Munich, DE': 'MUC', Munich: 'MUC',
  'Frankfurt, DE': 'FRA',
  'Amsterdam, NL': 'AMS', 'Haarlem, NL': 'AMS', Haarlem: 'AMS',
  'Stockholm, SE': 'STO', Stockholm: 'ARN', Johanneshov: 'ARN',
  'Oslo, NO': 'OSL', Oslo: 'OSL',
  'Copenhagen, DK': 'CPH',
  'Helsinki, FI': 'HEL',
  'Tallinn, EE': 'TLL', Tallinn: 'TLL',
  'Riga, LV': 'RIX', Riga: 'RIX',
  'Vilnius, LT': 'VNO',
  'Prague, CZ': 'PRG',
  'Vienna, AT': 'VIE',
  'Warsaw, PL': 'WAW',
  'Wrocław, PL': 'WRO', 'Wrocław': 'WRO',
  'Budapest, HU': 'BUD',
  'Zurich, CH': 'ZRH',
  'Geneva, CH': 'GVA',

  'Tokyo, JP': 'TYO', Tokyo: 'TYO',
  'Seoul, KR': 'SEL',
  'Hong Kong, HK': 'HKG',
  'Singapore, SG': 'SIN',
  'Bangkok, TH': 'BKK',
  'Dubai, AE': 'DXB',

  'Iklin, MT': 'MLA', Iklin: 'MLA',
};


export const CITY_IATA_FALLBACKS = {
  'London, CA': ['YXU', 'YTO', 'DTW'],
  'Winnipeg, CA': ['YWG', 'YTO', 'MSP'],
  'Manchester, GB': ['MAN', 'LON'],
  'Edinburgh, GB': ['EDI', 'GLA', 'LON'],
  'Glasgow, GB': ['GLA', 'EDI', 'LON'],
  'Belfast, GB': ['BFS', 'DUB', 'LON'],
  'Riga, LV': ['RIX', 'VNO', 'TLL'],
  'Tallinn, EE': ['TLL', 'RIX', 'HEL'],
  'Vilnius, LT': ['VNO', 'RIX', 'WAW'],
  'Oslo, NO': ['OSL', 'ARN', 'CPH'],
  'Stockholm, SE': ['ARN', 'CPH', 'OSL'],
  'Helsinki, FI': ['HEL', 'ARN'],
  'Prague, CZ': ['PRG', 'VIE', 'FRA'],
  'Vienna, AT': ['VIE', 'BUD', 'MUC'],
  'Warsaw, PL': ['WAW', 'WRO', 'BER'],
  'Wrocław, PL': ['WRO', 'WAW', 'PRG'],
  'Munich, DE': ['MUC', 'FRA', 'BER'],
  'Berlin, DE': ['BER', 'FRA', 'MUC'],
  'Milan, IT': ['MIL', 'MXP', 'LIN', 'BGY'],
  'Rome, IT': ['ROM', 'FCO', 'CIA'],
  'Paris, FR': ['PAR', 'CDG', 'ORY'],
  'Amsterdam, NL': ['AMS', 'BRU', 'FRA'],
  'Zurich, CH': ['ZRH', 'GVA', 'MUC'],
  'Geneva, CH': ['GVA', 'LYS', 'ZRH'],
  'Copenhagen, DK': ['CPH', 'ARN', 'HAM'],
  'Madrid, ES': ['MAD', 'BCN', 'LIS'],
  'Barcelona, ES': ['BCN', 'MAD'],
  'Dublin, IE': ['DUB', 'LON'],
  'Toronto, CA': ['YTO', 'YYZ', 'YTZ'],
  'Ottawa, CA': ['YOW', 'YTO', 'YUL'],
  'Montreal, CA': ['YMQ', 'YUL', 'YHU'],
  'Calgary, CA': ['YYC', 'YVR'],
  'Vancouver, CA': ['YVR', 'SEA'],
  'New York, US': ['NYC', 'JFK', 'EWR', 'LGA'],
  'Washington, US': ['WAS', 'IAD', 'DCA', 'BWI'],
  'Chicago, US': ['CHI', 'ORD', 'MDW'],
  'Los Angeles, US': ['LAX', 'SNA', 'ONT'],
  'San Francisco, US': ['SFO', 'OAK', 'SJC'],
  'Boston, US': ['BOS', 'JFK', 'EWR'],
  'Miami, US': ['MIA', 'FLL', 'PBI'],
  'Seattle, US': ['SEA', 'YVR'],
  'Dallas, US': ['DFW', 'DAL', 'IAH'],
  'Atlanta, US': ['ATL', 'CLT', 'MCO'],
  'Houston, US': ['IAH', 'HOU', 'DFW'],
  'Orlando, US': ['MCO', 'TPA', 'MIA'],
};

const COUNTRY_TO_ISO = {
  'united kingdom': 'GB', uk: 'GB', england: 'GB', scotland: 'GB', wales: 'GB', 'northern ireland': 'GB', britain: 'GB', 'great britain': 'GB',
  'canada': 'CA', ca: 'CA',
  'united states': 'US', usa: 'US', 'u.s.a.': 'US', us: 'US', america: 'US',
  'ireland': 'IE',
  'france': 'FR',
  'italy': 'IT',
  'spain': 'ES',
  'germany': 'DE',
  'netherlands': 'NL', 'the netherlands': 'NL', holland: 'NL',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'estonia': 'EE',
  'latvia': 'LV',
  'lithuania': 'LT',
  'czechia': 'CZ', 'czech republic': 'CZ',
  'austria': 'AT',
  'poland': 'PL',
  'hungary': 'HU',
  'switzerland': 'CH',
  'japan': 'JP',
  'south korea': 'KR', korea: 'KR',
  'hong kong': 'HK',
  'singapore': 'SG',
  'thailand': 'TH',
  'united arab emirates': 'AE', uae: 'AE',
  'malta': 'MT',
};

export const AIRPORTS = [
  { iata: 'RIX', lat: 56.9236, lon: 23.9711 },
  { iata: 'TLL', lat: 59.4133, lon: 24.8328 },
  { iata: 'VNO', lat: 54.6341, lon: 25.2858 },
  { iata: 'HEL', lat: 60.3172, lon: 24.9633 },
  { iata: 'ARN', lat: 59.6519, lon: 17.9186 },
  { iata: 'OSL', lat: 60.1939, lon: 11.1004 },
  { iata: 'CPH', lat: 55.6181, lon: 12.6561 },

  { iata: 'LHR', lat: 51.4700, lon: -0.4543 },
  { iata: 'LGW', lat: 51.1537, lon: -0.1821 },
  { iata: 'LTN', lat: 51.8747, lon: -0.3683 },
  { iata: 'STN', lat: 51.8850, lon: 0.2350 },
  { iata: 'LCY', lat: 51.5053, lon: 0.0553 },
  { iata: 'MAN', lat: 53.3650, lon: -2.2720 },
  { iata: 'BHX', lat: 52.4539, lon: -1.7480 },
  { iata: 'EDI', lat: 55.9500, lon: -3.3725 },
  { iata: 'GLA', lat: 55.8719, lon: -4.4331 },
  { iata: 'BFS', lat: 54.6575, lon: -6.2158 },
  { iata: 'DUB', lat: 53.4273, lon: -6.2436 },

  { iata: 'CDG', lat: 49.0097, lon: 2.5479 },
  { iata: 'ORY', lat: 48.7262, lon: 2.3652 },
  { iata: 'AMS', lat: 52.3086, lon: 4.7639 },
  { iata: 'FRA', lat: 50.0379, lon: 8.5622 },
  { iata: 'MUC', lat: 48.3538, lon: 11.7861 },
  { iata: 'BER', lat: 52.3667, lon: 13.5033 },
  { iata: 'ZRH', lat: 47.4581, lon: 8.5555 },
  { iata: 'GVA', lat: 46.2381, lon: 6.1089 },
  { iata: 'BCN', lat: 41.2974, lon: 2.0833 },
  { iata: 'MAD', lat: 40.4983, lon: -3.5676 },
  { iata: 'FCO', lat: 41.8003, lon: 12.2389 },
  { iata: 'MXP', lat: 45.6301, lon: 8.7281 },

  { iata: 'JFK', lat: 40.6413, lon: -73.7781 },
  { iata: 'EWR', lat: 40.6895, lon: -74.1745 },
  { iata: 'LGA', lat: 40.7769, lon: -73.8740 },
  { iata: 'BOS', lat: 42.3656, lon: -71.0096 },
  { iata: 'MIA', lat: 25.7959, lon: -80.2870 },
  { iata: 'ORD', lat: 41.9742, lon: -87.9073 },
  { iata: 'DFW', lat: 32.8998, lon: -97.0403 },
  { iata: 'ATL', lat: 33.6407, lon: -84.4277 },
  { iata: 'SEA', lat: 47.4502, lon: -122.3088 },
  { iata: 'SFO', lat: 37.6213, lon: -122.3790 },
  { iata: 'LAX', lat: 33.9416, lon: -118.4085 },

  { iata: 'YYZ', lat: 43.6777, lon: -79.6248 },
  { iata: 'YTZ', lat: 43.6287, lon: -79.3962 },
  { iata: 'YUL', lat: 45.4706, lon: -73.7408 },
  { iata: 'YOW', lat: 45.3225, lon: -75.6692 },
  { iata: 'YWG', lat: 49.9097, lon: -97.2399 },
  { iata: 'YVR', lat: 49.1947, lon: -123.1792 },
  { iata: 'YYC', lat: 51.1315, lon: -114.0106 },
  { iata: 'YXU', lat: 43.0329, lon: -81.1539 },
];

const METRO_TO_PRIMARY = {
  LON: 'LHR',
  NYC: 'JFK',
  WAS: 'IAD',
  PAR: 'CDG',
  MIL: 'MXP',
  ROM: 'FCO',
  YTO: 'YYZ',
  YMQ: 'YUL',
  STO: 'ARN',
  CHI: 'ORD',
};

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function closestAirportIata(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return '';
  let best = null;
  let bestD = Infinity;
  for (const ap of AIRPORTS) {
    const d = haversineKm(lat, lon, ap.lat, ap.lon);
    if (d < bestD) { bestD = d; best = ap.iata; }
  }
  return best || '';
}

export function requestBrowserLocation(timeoutMs = 10000) {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    let done = false;
    const finish = (val) => { if (!done) { done = true; resolve(val); } };
    const id = navigator.geolocation.getCurrentPosition(
      (pos) => finish({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => finish(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
    setTimeout(() => finish(null), timeoutMs + 500);
  });
}

export async function guessOriginIata(defaultIata = 'RIX') {
  try {
    const cacheKey = 'ef.originIata';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;

    const loc = await requestBrowserLocation();
    if (!loc) return defaultIata;

    const iata = closestAirportIata(loc.lat, loc.lon) || defaultIata;
    sessionStorage.setItem(cacheKey, iata);
    return iata;
  } catch {
    return defaultIata;
  }
}

function pad2(n){ return String(n).padStart(2,'0'); }
function toISO(y, m, d){ return `${y}-${pad2(m)}-${pad2(d)}`; }

export function parseWhenToISO(whenStr) {
  if (!whenStr || typeof whenStr !== 'string') return '';

  const iso = whenStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const mMap = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12,'dec.':12};

  const m1 = whenStr.toLowerCase().match(/(?:\b|,|\s)(\d{1,2})\s([a-z\.]{3,5})(?:[^\d]|$)/i);
  if (m1) {
    const d = parseInt(m1[1],10);
    const mm = mMap[m1[2]] || null;
    if (mm) {
      const now = new Date();
      let y = now.getFullYear();
      const candidate = new Date(y, mm - 1, d);
      if (candidate < now) y += 1;
      return toISO(y, mm, d);
    }
  }

  const m2 = whenStr.toLowerCase().match(/(\d{1,2})\s([a-z]{3,10})\s(\d{4})/i);
  if (m2) {
    const d = parseInt(m2[1],10);
    const mm = mMap[m2[2]] || null;
    const y  = parseInt(m2[3],10);
    if (mm && y) return toISO(y, mm, d);
  }

  const m3 = whenStr.toLowerCase().match(/([a-z]{3,10})\s(\d{1,2}),?\s(\d{4})/i);
  if (m3) {
    const mm = mMap[m3[1]] || null;
    const d  = parseInt(m3[2],10);
    const y  = parseInt(m3[3],10);
    if (mm && y && d) return toISO(y, mm, d);
  }

  return '';
}

export function getEventTravelDates(evt) {
  const rawStart = (evt?.startDate && /^\d{4}-\d{2}-\d{2}/.test(evt.startDate)) ? evt.startDate.slice(0,10) : '';
  const parsed   = parseWhenToISO(evt?.when || evt?._raw?.date?.when || '');
  const eventISO = rawStart || parsed || '';

  if (!eventISO) return { eventISO: '', departISO: '', returnISO: '' };

  const d = new Date(eventISO + 'T12:00:00');
  const before = new Date(d); before.setDate(d.getDate() - 1);
  const after  = new Date(d); after.setDate(d.getDate() + 1);

  const departISO = toISO(before.getFullYear(), before.getMonth()+1, before.getDate());
  const returnISO = toISO(after.getFullYear(),  after.getMonth()+1,  after.getDate());

  return { eventISO, departISO, returnISO };
}

export function getCityFromAddress(addressArr) {
  if (!Array.isArray(addressArr) || addressArr.length === 0) return '';
  const last = String(addressArr[addressArr.length - 1] || '').trim();
  if (!last) return '';
  const parts = last.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  const city = parts[0];

  let iso =
    COUNTRY_TO_ISO[parts[parts.length - 1]?.toLowerCase?.() || ''] ||
    COUNTRY_TO_ISO[parts[parts.length - 2]?.toLowerCase?.() || ''] ||
    '';

  if (!iso && parts.length >= 2 && parts[parts.length - 1].length === 2) {
    iso = parts[parts.length - 1].toUpperCase();
  }
  return iso ? `${city}, ${iso}` : city;
}

export function normalizeEvents(payload) {
  const raw =
    payload?.eventsResults ??
    payload?.events ??
    payload?.data?.events ??
    payload?.results?.events ??
    payload?.results ??
    payload?.items ??
    [];
  return (raw || []).map((e, i) => {
    const addr = Array.isArray(e?.address) ? e.address : [];
    const cityLabel = getCityFromAddress(addr);

    const startRaw = e?.date?.startDate || e?.startDate || '';
    const fromRaw  = (typeof startRaw === 'string' && startRaw.match(/^(\d{4}-\d{2}-\d{2})/)) ? RegExp.$1 : '';
    const parsed   = parseWhenToISO(e?.date?.when || e?.when || e?.date || '');
    const startDate = fromRaw || parsed || '';

    return {
      title: e?.title || e?.name || `Event #${i + 1}`,
      when: e?.date?.when || e?.date || e?.startDate || '',
      startDate,
      venue: e?.venue?.name || '',
      address: addr,
      city: cityLabel,
      link: e?.link || '',
      _raw: e,
    };
  });
}

export function resolveCityToIata(cityLabel = '') {
  if (!cityLabel) return '';
  const key = cityLabel.trim();
  if (CITY_TO_IATA[key]) return CITY_TO_IATA[key];
  const cityOnly = key.split(',')[0].trim();
  return CITY_TO_IATA[cityOnly] || '';
}

export function resolveCityToIataList(cityLabel = '') {
  const list = [];
  const primary = resolveCityToIata(cityLabel);
  if (primary) list.push(primary);

  const cityKey = cityLabel?.trim() || '';
  const cityOnly = cityKey.split(',')[0].trim();

  const f1 = CITY_IATA_FALLBACKS[cityKey] || [];
  const f2 = CITY_IATA_FALLBACKS[cityOnly] || [];
  [...f1, ...f2].forEach(code => {
    if (code && !list.includes(code)) list.push(code);
  });

  return list.length ? list : (primary ? [primary] : []);
}

export function hasAnyFlights(data) {
  return extractFlightOptions(data).length > 0;
}

export const join = (arr, sep = ' • ') => (arr.filter(Boolean).join(sep));

export function fmtDuration(mins) {
  if (!mins || isNaN(mins)) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h ? `${h}h ` : ''}${m ? `${m}m` : ''}`.trim();
}
export const fmtInt = (n) => (typeof n === 'number' ? n.toLocaleString() : n);

export function inferCurrencySymbol(flightsData) {
  const url = flightsData?.requestMetadata?.url || '';
  const match = url.match(/curr=([A-Z]{3})/);
  const curr = match?.[1] || 'EUR';
  switch (curr) {
    case 'EUR': return '€';
    case 'USD': return '$';
    case 'GBP': return '£';
    case 'NOK': return 'kr';
    default: return curr + ' ';
  }
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function fmtDateTimeSimple(s) {
  if (!s || typeof s !== 'string') return '';
  const [date, time] = s.split(' ');
  if (!date) return s;
  const [y, mo, d] = date.split('-').map(Number);
  const dd = isNaN(d) ? date : `${d.toString().padStart(2,'0')} ${MONTHS[(mo || 1)-1]}`;
  return time ? `${dd} • ${time}` : dd;
}

export function extractFlightOptions(data) {
  if (!data) return [];
  const list =
    (Array.isArray(data.otherFlights) ? data.otherFlights : null) ??
    (Array.isArray(data.results) ? data.results : null) ??
    (Array.isArray(data.items) ? data.items : null) ??
    (Array.isArray(data.flights) ? data.flights : null) ??
    [];
  return list;
}

export function normalizeFlightOption(opt) {
  const legs = Array.isArray(opt?.flights) ? opt.flights : (Array.isArray(opt?.legs) ? opt.legs : []);
  const first = legs[0] || {};
  const last  = legs.length ? legs[legs.length - 1] : first;

  const fromId = first?.departureAirport?.id || first?.departureAirportCode || '';
  const fromName = first?.departureAirport?.name || '';
  const toId = last?.arrivalAirport?.id || last?.arrivalAirportCode || '';
  const toName = last?.arrivalAirport?.name || '';

  const depart = first?.departureAirport?.time || first?.departureTime || first?.departure || '';
  const arrive = last?.arrivalAirport?.time || last?.arrivalTime || last?.arrival || '';

  const airlines = [...new Set(legs.map(l => l?.airline).filter(Boolean))];
  const flightNumbers = legs.map(l => l?.flightNumber).filter(Boolean);

  const totalDuration = opt?.totalDuration || opt?.duration ||
    (legs.reduce((sum, l) => sum + (l?.duration || 0), 0) || undefined);

  const price = opt?.price ?? opt?.priceTotal ?? opt?.priceFrom ?? null;
  const travelClass = first?.travelClass || opt?.travelClass || '';
  const type = opt?.type || (legs.length > 1 ? 'Multi-leg' : 'Trip');
  const emissions = opt?.carbonEmissions || {};

  return {
    price, type, totalDuration, legs,
    fromId, fromName, toId, toName,
    depart, arrive,
    airlines, flightNumbers,
    travelClass, emissions
  };
}

export function normalizeHotel(h) {
  return {
    title: h?.title || 'Hotel',
    thumbnail: h?.thumbnail || '',
    rating: h?.rating || null,
    reviews: h?.reviews || null,
    type: h?.type || '',
    stars: h?.stars || null,
    address: h?.address || '',
    phone: h?.phone || '',
    website: h?.website || '',
    gps: h?.gpsCoordinates || null,
    tags: Array.isArray(h?.serviceOptions) ? h.serviceOptions : (Array.isArray(h?.extensions?.crowd) ? h.extensions.crowd : [])
  };
}

export function mapsLinkFromHotel(h) {
  if (h?.gps?.latitude && h?.gps?.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${h.gps.latitude},${h.gps.longitude}`;
  }
  const q = encodeURIComponent(`${h?.title || ''} ${h?.address || ''}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function suggestTripTitle(evt, arrivalId) {
  const title = evt?.title || evt?.name || '';
  const city  = evt?.city || '';
  const date  = (evt?.startDate || '').toString().slice(0,10);

  const base =
    (title && city) ? `${title} — ${city}` :
    (title || city) || 'My Trip';

  const hints = [];
  if (arrivalId) hints.push(arrivalId);
  if (date) hints.push(date);

  return hints.length ? `${base} (${hints.join(' · ')})` : base;
}

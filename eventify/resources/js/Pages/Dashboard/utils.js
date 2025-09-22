// utils.js
export const DEFAULT_GL = 'uk';
export const DEFAULT_HL = 'en';
export const DEFAULT_EVENT_LOCATION = 'United Kingdom';

export const CITY_TO_IATA = {
  London: 'LHR',
  Birmingham: 'BHX',
  Manchester: 'MAN',
  Riga: 'RIX',
  Oslo: 'OSL',
  Munich: 'MUC',
  Milan: 'MXP',
  Stockholm: 'ARN',
  Tallinn: 'TLL',
  'Wrocław': 'WRO',
  Haarlem: 'AMS',
  Johanneshov: 'ARN',
  Iklin: 'MLA',
};

// small helpers
export const join = (arr, sep = ' • ') => (arr.filter(Boolean).join(sep));

export function getCityFromAddress(addressArr) {
  if (!Array.isArray(addressArr) || addressArr.length === 0) return '';
  const last = addressArr[addressArr.length - 1];
  const city = last.split(',')[0]?.trim();
  return city || '';
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
  return (raw || []).map((e, i) => ({
    title: e?.title || e?.name || `Event #${i + 1}`,
    when: e?.date?.when || e?.date || e?.startDate || '',
    startDate: e?.date?.startDate || '',
    venue: e?.venue?.name || '',
    address: e?.address || [],
    city: getCityFromAddress(e?.address),
    link: e?.link || '',
    _raw: e,
  }));
}

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

// Flights
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
  const last = legs.length ? legs[legs.length - 1] : first;

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
    price,
    type,
    totalDuration,
    legs,
    fromId, fromName, toId, toName,
    depart, arrive,
    airlines, flightNumbers,
    travelClass,
    emissions
  };
}

// Hotels
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

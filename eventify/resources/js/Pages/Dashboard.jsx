import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';

function getCityFromAddress(addressArr) {
  if (!Array.isArray(addressArr) || addressArr.length === 0) return '';
  const last = addressArr[addressArr.length - 1];
  const city = last.split(',')[0]?.trim();
  return city || '';
}

function normalizeEvents(payload) {
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

const CITY_TO_IATA = {
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

const DEFAULT_GL = 'uk';
const DEFAULT_HL = 'en';
const DEFAULT_EVENT_LOCATION = 'United Kingdom';

/* ------------------------------
   Helpers for pretty rendering
--------------------------------*/

// Safe join
const join = (arr, sep = ' • ') => (arr.filter(Boolean).join(sep));

// Minutes -> "1h 35m"
function fmtDuration(mins) {
  if (!mins || isNaN(mins)) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h ? `${h}h ` : ''}${m ? `${m}m` : ''}`.trim();
}

// Number -> e.g., "1,234"
const fmtInt = (n) => (typeof n === 'number' ? n.toLocaleString() : n);

// Price with currency symbol if we can infer it from request URL
function inferCurrencySymbol(flightsData) {
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

// "YYYY-MM-DD HH:MM" -> "24 Sep • 08:00"
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDateTimeSimple(s) {
  if (!s || typeof s !== 'string') return '';
  const [date, time] = s.split(' ');
  if (!date) return s;
  const [y, mo, d] = date.split('-').map(Number);
  const dd = isNaN(d) ? date : `${d.toString().padStart(2,'0')} ${MONTHS[(mo || 1)-1]}`;
  return time ? `${dd} • ${time}` : dd;
}

/* Flights: extract & normalize options from various shapes */
function extractFlightOptions(data) {
  if (!data) return [];
  const list =
    (Array.isArray(data.otherFlights) ? data.otherFlights : null) ??
    (Array.isArray(data.results) ? data.results : null) ??
    (Array.isArray(data.items) ? data.items : null) ??
    (Array.isArray(data.flights) ? data.flights : null) ??
    [];
  return list;
}

function normalizeFlightOption(opt) {
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
  const type = opt?.type || (legs.length > 1 ? 'Multi‑leg' : 'Trip');
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

/* Hotels: handle typical fields safely */
function normalizeHotel(h) {
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

function mapsLinkFromHotel(h) {
  if (h?.gps?.latitude && h?.gps?.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${h.gps.latitude},${h.gps.longitude}`;
  }
  const q = encodeURIComponent(`${h?.title || ''} ${h?.address || ''}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/* ------------------------------
   Pretty Lists (Flights/Hotels)
--------------------------------*/

function FlightList({ data }) {
  if (data === null) {
    return <div className="muted">No flights loaded yet.</div>;
  }
  if (data?.error) {
    return <div className="error">⚠️ {data.error}</div>;
  }

  const options = extractFlightOptions(data).map(normalizeFlightOption).slice(0, 10);
  const symbol = inferCurrencySymbol(data);
  const deepLink = data?.requestMetadata?.url;

  if (options.length === 0) {
    return (
      <div className="muted">
        No flights found. Try changing dates or arrival IATA.
        {deepLink && (
          <> <a className="inline-link" href={deepLink} target="_blank" rel="noreferrer">Open in Google Flights</a>.</>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="cards-stack">
        {options.map((f, i) => (
          <div className="card flight-card" key={i}>
            <input type="radio" name="flight-select" className="radio-select" />
            <div className="card-head">
              <div className="route">
                <span className="iata">{f.fromId || '—'}</span>
                <span className="arrow">→</span>
                <span className="iata">{f.toId || '—'}</span>
              </div>
              {typeof f.price === 'number' && (
                <div className="price-badge">{symbol}{fmtInt(f.price)}</div>
              )}
            </div>

            <div className="meta-row">
              <span className="badge">{f.type}</span>
              {f.travelClass && <span className="badge">{f.travelClass}</span>}
              {f.totalDuration && <span className="badge">{fmtDuration(f.totalDuration)}</span>}
              {f.airlines?.length > 0 && <span className="badge">{f.airlines.join(' + ')}</span>}
            </div>

            <div className="timing">
              <div className="time-col">
                <div className="time">{fmtDateTimeSimple(f.depart)}</div>
                <div className="muted small">{f.fromName || 'Departure'}</div>
              </div>
              <div className="time-col">
                <div className="time">{fmtDateTimeSimple(f.arrive)}</div>
                <div className="muted small">{f.toName || 'Arrival'}</div>
              </div>
            </div>

            {f.flightNumbers?.length > 0 && (
              <div className="muted small">Flight: {f.flightNumbers.join(', ')}</div>
            )}

            {(typeof f.emissions?.differencePercent === 'number' || typeof f.emissions?.thisFlight === 'number') && (
              <div className="emissions-row">
                {typeof f.emissions?.differencePercent === 'number' && (
                  <span
                    className={`badge ${f.emissions.differencePercent <= 0 ? 'green' : 'red'}`}
                    title="Compared to typical for this route"
                  >
                    {f.emissions.differencePercent > 0 ? '+' : ''}{f.emissions.differencePercent}% vs typical
                  </span>
                )}
                {typeof f.emissions?.thisFlight === 'number' && (
                  <span className="muted small">Est. {Math.round(f.emissions.thisFlight / 1000)} kg CO₂</span>
                )}
              </div>
            )}

            {deepLink && (
              <div className="actions-row">
                <a className="btn small" href={deepLink} target="_blank" rel="noreferrer">
                  Open in Google Flights
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function HotelList({ hotels }) {
  if (!hotels) {
    return <div className="muted">No hotels loaded yet.</div>;
  }
  const items = (Array.isArray(hotels) ? hotels : []).map(normalizeHotel);
  if (items.length === 0) {
    return <div className="muted">No hotels found near this venue.</div>;
  }

  return (
    <div className="cards-stack">
      {items.slice(0, 12).map((h, i) => (
        <div className="card hotel-card" key={i}>
        <input type="radio" name="hotels-select" class="radio-select" />
          <div className="hotel-grid">
            <div className="thumb-wrap">
              {h.thumbnail
                ? <img className="hotel-thumb" src={h.thumbnail} alt={h.title} loading="lazy" />
                : <div className="hotel-thumb placeholder" aria-hidden="true" />
              }
            </div>
            <div className="hotel-info">
              <div className="hotel-title-row">
                <div className="hotel-title">
                  {h.website ? (
                    <a href={h.website} target="_blank" rel="noreferrer" className="card-link">{h.title}</a>
                  ) : (
                    h.title
                  )}
                </div>
                {(h.stars || h.type) && (
                  <div className="muted small">{join([h.type, h.stars ? `${h.stars}★` : ''])}</div>
                )}
              </div>

              {(h.rating || h.reviews) && (
                <div className="rating-row">
                  {typeof h.rating === 'number' && <span className="star">★</span>}
                  {typeof h.rating === 'number' && <span className="rating">{h.rating.toFixed(1)}</span>}
                  {typeof h.reviews === 'number' && <span className="muted small">({fmtInt(h.reviews)} reviews)</span>}
                </div>
              )}

              {h.address && <div className="muted small">{h.address}</div>}

              {Array.isArray(h.tags) && h.tags.length > 0 && (
                <div className="chip-row">
                  {h.tags.slice(0, 4).map((t, idx) => (
                    <span className="chip" key={idx}>{t}</span>
                  ))}
                </div>
              )}

              <div className="actions-row">
                <a className="btn small" href={mapsLinkFromHotel(h)} target="_blank" rel="noreferrer">Maps</a>
                {h.website && <a className="btn small" href={h.website} target="_blank" rel="noreferrer">Website</a>}
                {h.phone && <a className="btn small" href={`tel:${h.phone.replace(/\s+/g,'')}`}>Call</a>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------
   Main component
--------------------------------*/

export default function Dashboard() {
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [when, setWhen] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [flights, setFlights] = useState(null);
  const [hotels, setHotels] = useState([]);

  const [userId, setUserId] = useState(null);

useEffect(() => {
  axios.get('/api/user')
    .then(res => {
      setUserId(res.data?.id || null);
    })
    .catch(() => {
      setUserId(null);
    });
}, []);


  const [searchTriggered, setSearchTriggered] = useState(false);
  const [pageStart, setPageStart] = useState(0);

  const [tripCfg, setTripCfg] = useState({
    from: 'RIX',
    stayNights: 1,
  });

  const [arrivalOverride, setArrivalOverride] = useState('');
  const [outboundDate, setOutboundDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // Modal state
  const [showTravel, setShowTravel] = useState(false);
  const modalRef = useRef(null);

  // Lock body scroll + close on Esc + focus when modal opens
  useEffect(() => {
    if (!showTravel) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') setShowTravel(false);
    };
    window.addEventListener('keydown', onKey);

    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [showTravel]);

  const searchEvents = async (reset = true) => {
    setLoading(true);

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
        params: {
          q,
          location: location || DEFAULT_EVENT_LOCATION,
          when,
          gl: DEFAULT_GL,
          hl: DEFAULT_HL,
          start: reset ? 0 : pageStart,
        },
      });

      const items = normalizeEvents(data);
      setEvents((prev) => (reset ? items : [...prev, ...items]));
    } catch (e) {
      console.error('Events error:', e?.response?.status, e?.response?.data || e?.message);
    //   alert(`Events search failed (${e?.response?.status ?? 'network'}) — check console for details`);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setPageStart((prev) => prev + 10);
    await searchEvents(false);
  };

  const selectEvent = async (evt) => {
    setSelected(evt);
    setShowTravel(true);
    setFlights(null);
    setHotels([]);

    // default trip dates: 14 days from today, stayNights long
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
    } catch (e) {
      console.error('Hotels error:', e?.response?.status, e?.response?.data || e?.message);
      setHotels([]);
    }

    const arrivalId = arrivalOverride.trim().toUpperCase() || CITY_TO_IATA[city] || '';
    if (!arrivalId) return;

    try {
      const flightRes = await axios.get('/api/travel/flights', {
        params: {
          from: tripCfg.from,
          arrivalId,
          outboundDate: dOutISO,
          returnDate: dRetISO,
          stayNights: tripCfg.stayNights,
        },
      });
      setFlights(flightRes.data);
    } catch (e) {
      console.error('Flights error:', e?.response?.status, e?.response?.data || e?.message);
      setFlights({ error: 'Failed to fetch flights' });
    }
  };

  const refreshFlights = async () => {
    if (!selected) return;
    const city = selected?.city || '';
    const arrivalId = arrivalOverride.trim().toUpperCase() || CITY_TO_IATA[city] || '';
    if (!arrivalId) {
    //   alert('Please enter Arrival (IATA).');
      return;
    }
    try {
      const flightRes = await axios.get('/api/travel/flights', {
        params: {
          from: tripCfg.from,
          arrivalId,
          outboundDate,
          returnDate,
          stayNights: tripCfg.stayNights,
        },
      });
      setFlights(flightRes.data);
    } catch (e) {
      console.error(e);
      setFlights({ error: 'Failed to fetch flights' });
    }
  };

  const refreshHotels = async () => {
    if (!selected) return;
    const city = selected?.city || '';
    const venue = selected?.venue || '';
    try {
      const res = await axios.get('/api/travel/hotels', {
        params: {
          q: venue ? `hotels near ${venue} ${city}` : `hotels in ${city}`,
          city,
          venue,
        },
      });
      const h = res.data;
      const list = Array.isArray(h) ? h : (h?.localResults || h?.results || h?.places || h?.data || []);
      setHotels(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setHotels([]);
    }
  };

  return (
    
    <div className={`main-wrapper ${searchTriggered ? 'search-active' : ''}`}>

        
{/* <div style={{ padding: '10px', background: 'black', textAlign: 'right' }}>
<a href="/bookmarks" className="bookmarks">Bookmark</a>
</div> */}



      <header className="search-header">
        <div className="search-inner">
          <h1 className="app-name-title">Eventify</h1>

          <form
            className="actions-wrapper"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchTriggered(true);
              searchEvents(true);
            }}
          >
            {/* Search group */}
            <div className="input-group">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="input-search"
              />
              {/* Hidden location, preserved */}
              <input
                type="hidden"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder='e.g. "London,United Kingdom"'
              />
              <select
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="input-when"
              >
                <option value="">When</option>
                <option value="">Anytime</option>
                <option value="date:today">Today</option>
                <option value="date:tomorrow">Tomorrow</option>
                <option value="date:week">This Week</option>
                <option value="date:weekend">This Weekend</option>
                <option value="date:next_week">Next Week</option>
                <option value="date:month">This Month</option>
                <option value="date:next_month">Next Month</option>
                <option value="event_type:Virtual-Event">Online</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="actions-buttons">
              <button type="submit" className="btn primary">
                {loading ? 'Searching…' : 'Search'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setQ('');
                  setLocation('');
                  setWhen('');
                  setEvents([]);
                  setSelected(null);
                  setFlights(null);
                  setHotels([]);
                  setPageStart(0);
                  setArrivalOverride('');
                  setOutboundDate('');
                  setReturnDate('');
                  setSearchTriggered(false); // back to full header
                  setShowTravel(false);
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="results-area">
        {events?.length === 0 && !loading && <div>No events yet. Try a search.</div>}

        {events?.map((evt, idx) => (
          <div key={idx} className="event-card">
            <div className="event-title">{evt.title}</div>
            <div className="event-meta">
              {evt.when} {evt.venue && `• ${evt.venue}`} {evt.city && `• ${evt.city}`}
            </div>
            <div className="event-actions">
              {evt.link && (
                <a href={evt.link} target="_blank" rel="noreferrer noopener" className="btn small">
                  Source
                </a>
              )}
              <button onClick={() => selectEvent(evt)} className="btn small">
                View travel
              </button>
            </div>
          </div>
        ))}

        {events.length > 0 && (
          <div className="load-more">
            <button disabled={loading} onClick={loadMore} className="btn">
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </main>

      {/* Modal (popup) for travel options */}
      {showTravel && selected && (
        <div className="modal-backdrop" onClick={() => setShowTravel(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="travel-title"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <button
              className="modal-close"
              onClick={() => setShowTravel(false)}
              aria-label="Close dialog"
              title="Close"
            >
              ✕
            </button>

            <header className="modal-header">
              <h2 id="travel-title" className="modal-title">
                Travel options for: {selected.title || selected.name}
              </h2>
              <div className="modal-sub">
                {selected.when} {selected.venue && <>• {selected.venue} </>}{' '}
                {selected.city && <>• {selected.city}</>}
              </div>
            </header>

            <div className="modal-body">
              {/* <div className="travel-form">
                <div>
                  <label>From (IATA)</label>
                  <input
                    value={tripCfg.from}
                    onChange={(e) =>
                      setTripCfg({ ...tripCfg, from: e.target.value.toUpperCase() })
                    }
                  />
                </div>

                <div>
                  <label>Stay nights</label>
                  <input
                    type="number"
                    min={1}
                    value={tripCfg.stayNights}
                    onChange={(e) =>
                      setTripCfg({ ...tripCfg, stayNights: Number(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label>Arrival (IATA)</label>
                  <input
                    value={arrivalOverride}
                    onChange={(e) => setArrivalOverride(e.target.value)}
                    placeholder="e.g. OSL"
                  />
                </div>

                <div>
                  <label>Outbound date</label>
                  <input
                    type="date"
                    value={outboundDate}
                    onChange={(e) => setOutboundDate(e.target.value)}
                  />
                </div>

                <div>
                  <label>Return date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>

                <div className="travel-buttons">
                  <button onClick={refreshFlights} className="btn">
                    Update flights
                  </button>
                  <button onClick={refreshHotels} className="btn">
                    Update hotels
                  </button>
                </div>
              </div> */}

              {/* <div className="travel-columns"> */}
              <form
  className="travel-columns"
  onSubmit={async (e) => {
    e.preventDefault();

    const payload = { flights, hotels, title: "My Trip" };

    const getCookie = (name) =>
      document.cookie
        .split('; ')
        .find(row => row.startsWith(name + '='))
        ?.split('=')[1];

    try {
      // 1) Ensure CSRF cookie exists (sets XSRF-TOKEN + laravel_session)
      await fetch('/sanctum/csrf-cookie', {
        credentials: 'include',
      });

      // 2) POST with credentials + XSRF header
      const res = await fetch('/trips', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // IMPORTANT: send the XSRF token from the cookie
          'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN') || ''),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('POST /trips failed', res.status, text);
        // alert(`Failed to save trip (${res.status}).`); // PIEVIENO PAZINOJUMU
        return;
      }

      const data = await res.json();
    //   alert('Trip saved successfully!');// PIEVIENO PAZINOJUMU
      console.log(data.trip);
    } catch (err) {
      console.error(err);
    //   alert('Error saving trip.');// PIEVIENO PAZINOJUMU
    }
  }}
>

  <button className="button-submit">Bookmark this trip</button>

  <div className="travel-column">
    <h3>Flights</h3>
    <FlightList data={flights} />
    <input type="hidden" name="user_id" value={userId ?? 'null'} />
    <details className="raw-toggle">
      <summary>Show raw</summary>
      <pre className="pre-json">{JSON.stringify(flights, null, 2)}</pre>
    </details>
  </div>

  <div className="travel-column">
    <h3>Hotels near venue</h3>
    <HotelList hotels={hotels} />
    <details className="raw-toggle">
      <summary>Show raw</summary>
      <pre className="pre-json">{JSON.stringify(hotels, null, 2)}</pre>
    </details>
  </div>
</form>

              {/* </div> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

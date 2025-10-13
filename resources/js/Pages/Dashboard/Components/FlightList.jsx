import React from 'react';
import {
  extractFlightOptions,
  normalizeFlightOption,
  fmtDuration,
  fmtInt,
  fmtDateTimeSimple,
  inferCurrencySymbol,
} from '../utils';

export default function FlightList({ data, selectedFlight, setSelectedFlight }) {
  if (data === null) return <div className="muted">No flights loaded yet.</div>;
  if (data?.error) return <div className="error">⚠️ {data.error}</div>;

  const options = extractFlightOptions(data).map(normalizeFlightOption).slice(0, 10);
  const symbol = inferCurrencySymbol(data);
  const deepLink = data?.requestMetadata?.url;

  if (options.length === 0) {
    return (
      <div className="muted">
        No flights found. Try changing dates or arrival IATA.
        {deepLink && (<> <a className="inline-link" href={deepLink} target="_blank" rel="noreferrer">Open in Google Flights</a>.</>)}
      </div>
    );
  }

  return (
    <div className="cards-stack">
      {options.map((f, i) => (
        <label className="card flight-card" key={i}>
          <input
            type="radio"
            name="flight-select"
            className="radio-select"
            checked={selectedFlight === i}
            onChange={() => setSelectedFlight(i)}
          />
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
            {f.type && <span className="badge">{f.type}</span>}
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
        </label>
      ))}
    </div>
  );
}

import React from 'react';
import { normalizeHotel, join, fmtInt, mapsLinkFromHotel } from '../utils';

export default function HotelList({ hotels, selectedHotel, setSelectedHotel }) {
  if (!hotels) return <div className="muted">No hotels loaded yet.</div>;
  const items = (Array.isArray(hotels) ? hotels : []).map(normalizeHotel);
  if (items.length === 0) return <div className="muted">No hotels found near this venue.</div>;

  return (
    <div className="cards-stack">
      {items.slice(0, 12).map((h, i) => (
        <label className="card hotel-card" key={i}>
          <input
            type="radio"
            name="hotels-select"
            className="radio-select"
            checked={selectedHotel === i}
            onChange={() => setSelectedHotel(i)}
          />
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
                  ) : (h.title)}
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

              {!!(h.tags?.length) && (
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
        </label>
      ))}
    </div>
  );
}

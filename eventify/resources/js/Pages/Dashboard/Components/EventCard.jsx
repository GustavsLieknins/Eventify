import React from 'react';

export default function EventCard({ evt, onSelect }) {
  return (
    <div className="event-card">
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
        <button onClick={() => onSelect(evt)} className="btn small">
          View travel
        </button>
      </div>
    </div>
  );
}

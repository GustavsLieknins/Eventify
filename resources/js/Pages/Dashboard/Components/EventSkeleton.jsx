import React from 'react';

export default function EventCardSkeleton() {
  return (
    <div className="event-card is-loading" role="status" aria-busy="true" aria-label="Loading event">
      <div className="event-title">
        <span className="sk-line sk-title" />
      </div>

      <div className="event-meta">
        <span className="sk-line sk-meta" />
      </div>

      <div className="event-actions">
        <span className="btn small sk-btn" />
        <span className="btn small sk-btn" />
      </div>
    </div>
  );
}

import React from 'react';

export default function EventCardSkeleton({ withTickets = true }) {
  return (
    <div
      className="event-card skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="skeleton-line title" />
      <div className="skeleton-line meta" />

      <div className="skeleton-actions">
        <div className="skeleton-chip" />
        <div className="skeleton-chip" />
      </div>

      {withTickets && (
        <div className="skeleton-tickets">
          <div className="skeleton-chip" />
          <div className="skeleton-chip" />
          <div className="skeleton-chip" />
        </div>
      )}
    </div>
  );
}

import React from 'react';

export default function EventSkeleton() {
  return (
    <div className="event-card skeleton">
      <div className="sk-line sk-title" />
      <div className="sk-line sk-meta" />
      <div className="sk-actions">
        <div className="sk-chip" />
        <div className="sk-chip" />
      </div>
    </div>
  );
}

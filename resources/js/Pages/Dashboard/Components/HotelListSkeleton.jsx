import React from 'react';

export default function HotelListSkeleton({ count = 6 }) {
  return (
    <div className="cards-stack tm-skel">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card hotel-card skeleton" key={i}>
          <div className="hotel-grid">
            <div className="thumb-wrap">
              <div className="hotel-thumb placeholder" />
            </div>
            <div className="hotel-info">
              <div className="hotel-title-row">
                <div className="sk-line lg" style={{ maxWidth: 220 }} />
                <div className="sk-line xs" style={{ maxWidth: 80 }} />
              </div>
              <div className="rating-row">
                <span className="sk-chip sm" />
                <span className="sk-line xs" style={{ maxWidth: 120 }} />
              </div>
              <div className="sk-line xs" style={{ maxWidth: 260 }} />
              <div className="chip-row">
                <span className="sk-chip" />
                <span className="sk-chip" />
                <span className="sk-chip" />
              </div>
              <div className="actions-row">
                <span className="sk-btn" />
                <span className="sk-btn" />
                <span className="sk-btn" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

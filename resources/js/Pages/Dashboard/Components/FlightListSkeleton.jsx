import React from 'react';

export default function FlightListSkeleton({ count = 3 }) {
  return (
    <div className="cards-stack tm-skel">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card flight-card skeleton" key={i}>
          <div className="card-head">
            <div className="route">
              <span className="sk-box sm" />
              <span className="arrow">→</span>
              <span className="sk-box sm" />
            </div>
            <div className="sk-box price" />
          </div>
          <div className="meta-row">
            <span className="sk-chip" />
            <span className="sk-chip" />
            <span className="sk-chip" />
          </div>
          <div className="timing">
            <div className="time-col">
              <div className="sk-line md" />
              <div className="sk-line xs" />
            </div>
            <div className="time-col">
              <div className="sk-line md" />
              <div className="sk-line xs" />
            </div>
          </div>
          <div className="sk-line xs" />
        </div>
      ))}
    </div>
  );
}

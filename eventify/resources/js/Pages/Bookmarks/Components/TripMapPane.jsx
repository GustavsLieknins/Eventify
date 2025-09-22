import React, { memo } from 'react';
import Icon from './ui/Icon';

export default memo(function TripMapPane({ trip, buildTripEmbedUrl, buildTripExternalUrl }) {
  const url = buildTripEmbedUrl(trip);
  const ext = buildTripExternalUrl(trip);
  if (!url) return null;

  return (
    <div className="map-card">
      <div className="map-aspect">
        <iframe
          key={url}
          title="Trip Map"
          src={url}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="map-overlay">
          <div className="map-caption">Route preview</div>
          {ext && (
            <a className="ui-btn ui-btn--sm ui-btn--glass map-btn" href={ext} target="_blank" rel="noreferrer">
              <span className="ui-btn__icon"><Icon name="external" /></span>
              <span className="ui-btn__label">Open in Google Maps</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

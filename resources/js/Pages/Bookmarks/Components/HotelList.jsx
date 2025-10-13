import React, { memo } from 'react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Icon from './ui/Icon';
import Empty from './ui/Empty';

export default memo(function HotelList({ hotels, mapsLinkFromHotel }) {
  if (!hotels?.length) return <Empty title="No hotels saved" />;

  return (
    <div className="stack">
      {hotels.map((h, i) => (
        <Card key={i} interactive={false} className="hotel">
          <div className="hotel__grid">
            <div className="hotel__thumb">
              {h.thumbnail
                ? <img src={h.thumbnail} alt="" loading="lazy" />
                : <div className="thumb--placeholder" aria-hidden="true" />
              }
            </div>

            <div className="hotel__body">
              <div className="row row--space">
                <h4 className="hotel__title">
                  {h.website
                    ? <a href={h.website} target="_blank" rel="noreferrer" className="link">{h.title}</a>
                    : h.title}
                </h4>
                <div className="row gap-6">
                  {typeof h.rating === 'number' && <Badge tone="gold">{h.rating.toFixed(1)} ★</Badge>}
                  {typeof h.reviews === 'number' && (
                    <span className="muted small">({h.reviews.toLocaleString()} reviews)</span>
                  )}
                </div>
              </div>

              <div className="muted small mt-4">
                {h.stars ? `${h.stars}★` : ''}{h.stars && h.type ? ' • ' : ''}{h.type || ''}
              </div>
              {h.address && <div className="muted small">{h.address}</div>}

              {!!(h.tags?.length) && (
                <div className="chips mt-6">
                  {h.tags.map((t, idx) => <Badge key={idx}>{t}</Badge>)}
                </div>
              )}

              <div className="toolbar mt-8">
                <Button size="sm" iconLeft={<Icon name="map" />} as="a" href={mapsLinkFromHotel(h)} target="_blank" rel="noreferrer">
                  Maps
                </Button>
                {h.website && (
                  <Button size="sm" iconLeft={<Icon name="external" />} as="a" href={h.website} target="_blank" rel="noreferrer">
                    Website
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

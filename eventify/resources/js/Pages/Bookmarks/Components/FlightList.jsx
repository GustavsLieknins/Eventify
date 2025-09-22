import React, { memo } from 'react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Icon from './ui/Icon';
import Empty from './ui/Empty';

export default memo(function FlightList({ flights, buildFlightsLink, fmtPrice, fmtDuration }) {
  if (!flights?.length) return <Empty title="No flights saved" />;

  return (
    <div className="stack">
      {flights.map((f, i) => {
        const { flightsUrl, searchUrl } = buildFlightsLink(f);
        const airlines = f?.airlines?.length ? f.airlines.join(' + ') : null;

        return (
          <Card key={i}>
            <div className="row row--space">
              <div className="route">
                <span className="iata">{f.fromId || '—'}</span>
                <span className="arrow">→</span>
                <span className="iata">{f.toId || '—'}</span>
              </div>
              <Badge tone="accent">{fmtPrice(f.price)}</Badge>
            </div>

            <div className="row row--wrap">
              {f.type && <Badge>{f.type}</Badge>}
              {f.travelClass && <Badge>{f.travelClass}</Badge>}
              {f.totalDuration && <Badge>{fmtDuration(f.totalDuration)}</Badge>}
              {airlines && <Badge>{airlines}</Badge>}
            </div>

            {f.legs?.map((leg, idx) => (
              <div key={idx} className="leg">
                <div className="leg__line">
                  <strong>{leg?.departureAirport?.id}</strong> ({leg?.departureAirport?.time})
                  {' '}→{' '}
                  <strong>{leg?.arrivalAirport?.id}</strong> ({leg?.arrivalAirport?.time})
                </div>
                <div className="leg__meta">
                  {leg?.airline} • {leg?.flightNumber} • {leg?.travelClass}
                  {leg?.legroom ? ` • ${leg.legroom} legroom` : ''}
                </div>
                {!!(leg?.extensions?.length) && (
                  <div className="chips">
                    {leg.extensions.map((ext, eidx) => <Badge key={eidx}>{ext}</Badge>)}
                  </div>
                )}
              </div>
            ))}

            {(f?.emissions?.thisFlight || typeof f?.emissions?.differencePercent === 'number') && (
              <div className="row row--wrap mt-6">
                {typeof f?.emissions?.differencePercent === 'number' && (
                  <Badge tone={f.emissions.differencePercent <= 0 ? 'green' : 'red'}>
                    {f.emissions.differencePercent > 0 ? '+' : ''}{f.emissions.differencePercent}% vs typical
                  </Badge>
                )}
                {f?.emissions?.thisFlight && (
                  <span className="muted small">Est. {Math.round(f.emissions.thisFlight / 1000)} kg CO₂</span>
                )}
              </div>
            )}

            <div className="toolbar">
              <Button size="sm" iconLeft={<Icon name="plane" />} as="a" href={flightsUrl} target="_blank" rel="noreferrer">
                Google Flights
              </Button>
              <Button size="sm" iconLeft={<Icon name="globe" />} as="a" href={searchUrl} target="_blank" rel="noreferrer">
                Web Search
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
});

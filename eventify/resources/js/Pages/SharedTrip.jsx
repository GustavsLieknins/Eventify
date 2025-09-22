// import React, { memo, useCallback } from 'react';
// import { Head } from '@inertiajs/react';
// import './Bookmarks.css';

// /** Minimal icon + badge from your existing file */
// const Badge = ({children, tone='glass'}) => (
//   <span className={`ui-badge ui-badge--${tone}`}>{children}</span>
// );

// const Section = ({title, children}) => (
//   <div className="blk">
//     <div className="blk__head"><h3 className="blk__title">{title}</h3></div>
//     <div className="blk__body">{children}</div>
//   </div>
// );

// const Card = ({children}) => <section className="ui-card">{children}</section>;

// export default function SharedTrip({ slug, title, trip, meta }) {
//   const fmtDuration = useCallback((mins)=>{
//     if (!mins || isNaN(mins)) return '';
//     const h = Math.floor(mins/60), m = mins%60;
//     return `${h?`${h}h`:''}${h&&m?' ':''}${m?`${m}m`:''}`;
//   },[]);

//   const buildEmbed = useCallback(()=>{
//     const f = trip?.flights?.[0], h = trip?.hotels?.[0];
//     const origin = f?.fromId ? `${f.fromId} Airport` : (f?.legs?.[0]?.departureAirport?.name || '');
//     let destination = '';
//     if (h?.gps?.latitude && h?.gps?.longitude) destination = `${h.gps.latitude},${h.gps.longitude}`;
//     else if (h?.title || h?.address) destination = [h.title, h.address].filter(Boolean).join(' ');
//     else if (f?.toId) destination = `${f.toId} Airport`;
//     if (!origin || !destination) return null;
//     const q = encodeURIComponent(`${origin} to ${destination}`);
//     return `https://www.google.com/maps?q=${q}&output=embed`;
//   }, [trip]);

//   const mapUrl = buildEmbed();

//   return (
//     <div className="page">
//       <Head title={title ? `${title} – Eventify` : 'Eventify'} />
//       <header className="page__head">
//         <h1 className="page__title">{title || 'Trip'}</h1>
//         {trip?.flights?.[0] && (
//           <div className="muted" style={{marginTop:6}}>
//             {trip.flights[0].fromId} → {trip.flights[0].toId}
//           </div>
//         )}
//       </header>

//       {mapUrl && (
//         <div className="map-card">
//           <div className="map-aspect">
//             <iframe title="Trip Map" src={mapUrl} loading="lazy" allowFullScreen />
//             <div className="map-overlay">
//               <div className="map-caption">Route preview</div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="modal__grid" style={{marginTop:16}}>
//         <Section title="Flights">
//           {(!trip?.flights || trip.flights.length===0) ? (
//             <div className="muted">No flights saved for this trip.</div>
//           ) : (
//             <div className="stack">
//               {trip.flights.map((f, idx)=>(
//                 <Card key={idx}>
//                   <div className="row row--space">
//                     <div className="route">
//                       <span className="iata">{f.fromId || '—'}</span>
//                       <span className="arrow">→</span>
//                       <span className="iata">{f.toId || '—'}</span>
//                     </div>
//                     {typeof f.price === 'number' && <Badge tone="accent">{f.price}€</Badge>}
//                   </div>
//                   <div className="row row--wrap">
//                     {f.type && <Badge>{f.type}</Badge>}
//                     {f.travelClass && <Badge>{f.travelClass}</Badge>}
//                     {f.totalDuration && <Badge>{fmtDuration(f.totalDuration)}</Badge>}
//                     {!!f.airlines?.length && <Badge>{f.airlines.join(' + ')}</Badge>}
//                   </div>

//                   {f.legs?.map((leg,i)=>(
//                     <div key={i} className="leg">
//                       <div className="leg__line">
//                         <strong>{leg?.departureAirport?.id}</strong> ({leg?.departureAirport?.time})
//                         {' '}→{' '}
//                         <strong>{leg?.arrivalAirport?.id}</strong> ({leg?.arrivalAirport?.time})
//                       </div>
//                       <div className="leg__meta">
//                         {leg?.airline} • {leg?.flightNumber} • {leg?.travelClass}
//                         {leg?.legroom ? ` • ${leg.legroom} legroom` : ''}
//                       </div>
//                     </div>
//                   ))}
//                 </Card>
//               ))}
//             </div>
//           )}
//         </Section>

//         <Section title="Hotels">
//           {(!trip?.hotels || trip.hotels.length===0) ? (
//             <div className="muted">No hotels saved for this trip.</div>
//           ) : (
//             <div className="stack">
//               {trip.hotels.map((h, i)=>(
//                 <Card key={i}>
//                   <div className="hotel__grid">
//                     <div className="hotel__thumb">
//                       {h.thumbnail
//                         ? <img src={h.thumbnail} alt="" loading="lazy"/>
//                         : <div className="thumb--placeholder" />
//                       }
//                     </div>
//                     <div className="hotel__body">
//                       <div className="row row--space">
//                         <h4 className="hotel__title">{h.title}</h4>
//                         <div className="row gap-6">
//                           {typeof h.rating==='number' && <Badge tone="gold">{h.rating.toFixed(1)} ★</Badge>}
//                           {typeof h.reviews==='number' && <span className="muted small">({h.reviews.toLocaleString()} reviews)</span>}
//                         </div>
//                       </div>
//                       <div className="muted small mt-4">
//                         {h.stars ? `${h.stars}★` : ''}{h.stars && h.type ? ' • ' : ''}{h.type || ''}
//                       </div>
//                       {h.address && <div className="muted small">{h.address}</div>}
//                     </div>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </Section>
//       </div>
//     </div>
//   );
// }

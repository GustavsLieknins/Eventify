import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';

export default function Bookmarks() {
  const [userId, setUserId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    // Get logged-in user
    axios.get('/api/user')
      .then(res => setUserId(res.data?.id || null))
      .catch(() => setUserId(null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios.get('/api/trips', { params: { user_id: userId } })
      .then(res => setTrips(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const deleteTrip = async (tripId) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await axios.delete(`/api/trips/${tripId}`);
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete trip');
    }
  };

  // Modal ESC + focus
  useEffect(() => {
    if (!selectedTrip) return;
    const onKey = (e) => { if (e.key === 'Escape') setSelectedTrip(null); };
    window.addEventListener('keydown', onKey);
    if (modalRef.current) modalRef.current.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedTrip]);

  // Inlined FlightList
  const FlightList = ({ flights }) => {
    if (!flights) return <div className="muted">No flights</div>;
    const list = JSON.parse(flights);
    if (!list.length) return <div className="muted">No flights found</div>;
    return (
      <div className="cards-stack">
        {list.map((f, i) => (
          <div className="card flight-card" key={i}>
            <div className="route">
              {f.from || '—'} → {f.to || '—'}
            </div>
            <div className="price-badge">{f.price ? `$${f.price}` : 'N/A'}</div>
          </div>
        ))}
      </div>
    );
  };

  // Inlined HotelList
  const HotelList = ({ hotels }) => {
    if (!hotels) return <div className="muted">No hotels</div>;
    const list = JSON.parse(hotels);
    if (!list.length) return <div className="muted">No hotels found</div>;
    return (
      <div className="cards-stack">
        {list.map((h, i) => (
          <div className="card hotel-card" key={i}>
            <div>{h.title || 'Hotel'}</div>
            {h.thumbnail && <img src={h.thumbnail} alt={h.title} className="hotel-thumb" />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bookmarks-wrapper">
      <h1>My Bookmarked Trips</h1>
      {loading && <div>Loading…</div>}
      {!loading && trips.length === 0 && <div>No trips bookmarked yet.</div>}

      <div className="trip-cards">
        {trips.map(trip => (
          <div key={trip.id} className="trip-card">
            <h2>{trip.title}</h2>
            <div className="trip-actions">
              <button onClick={() => setSelectedTrip(trip)} className="btn small">View</button>
              <button onClick={() => deleteTrip(trip.id)} className="btn small danger">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {selectedTrip && (
        <div className="modal-backdrop" onClick={() => setSelectedTrip(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <button className="modal-close" onClick={() => setSelectedTrip(null)}>✕</button>
            <h2>{selectedTrip.title}</h2>
            <div className="travel-columns">
              <div className="travel-column">
                <h3>Flights</h3>
                <FlightList flights={selectedTrip.flights} />
              </div>
              <div className="travel-column">
                <h3>Hotels</h3>
                <HotelList hotels={selectedTrip.hotels} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import FlightList from './FlightList';
import HotelList from './HotelList';
import FlightListSkeleton from './FlightListSkeleton';
import HotelListSkeleton from './HotelListSkeleton';

export default function TravelModal({
  selected,
  flights,
  hotels,
  selectedFlight, setSelectedFlight,
  selectedHotel, setSelectedHotel,
  tripTitle, setTripTitle,
  saving,
  handleSave,
  onClose,
  modalRef,
  flightsLoading,
  hotelsLoading,
}) {
  if (!selected) return null;

  return (
    <div className="tm-backdrop" onClick={onClose}>
      <div
        className="tm-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="travel-title"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <button className="tm-close" onClick={onClose} aria-label="Close dialog" title="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <header className="tm-header">
          <h2 id="travel-title" className="tm-title">
            Travel options for: <span className="tm-title-accent">{selected.title || selected.name}</span>
          </h2>
          <div className="tm-sub">
            {selected.when}
            {selected.venue && <><span className="dot">•</span>{selected.venue}</>}
            {selected.city &&  <><span className="dot">•</span>{selected.city}</>}
          </div>

          <div className="tm-bar">
            <input
              type="hidden"
              className="input-search"
              style={{ borderRadius: 10, minWidth: 240, background: '#fff' }}
              placeholder="Trip name"
              value={tripTitle}
              onChange={(e) => setTripTitle?.(e.target.value)}
            />
            <form onSubmit={handleSave}>
              <PrimaryButton disabled={saving} style={{ marginLeft: 8 }}>
                {saving ? 'Saving…' : 'Bookmark this trip'}
              </PrimaryButton>
            </form>
            <div className="tm-hint">Pick a flight and/or hotel, name it, then bookmark.</div>
          </div>
        </header>

        <div className="tm-scroll">
          <div className="tm-grid">
            <section className="tm-section">
              <div className="tm-sec-head">
                <div className="tm-sec-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" className="ico" aria-hidden="true">
                    <path d="M10 21l2-5 7-7a2 2 0 10-3-3l-7 7-5 2 2-5-3-3 4-1 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Flights
                </div>
              </div>
              {flightsLoading ? (
                <FlightListSkeleton />
              ) : (
                <FlightList
                  data={flights}
                  selectedFlight={selectedFlight}
                  setSelectedFlight={setSelectedFlight}
                />
              )}
            </section>

            <section className="tm-section">
              <div className="tm-sec-head">
                <div className="tm-sec-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" className="ico" aria-hidden="true">
                    <path d="M3 21V9a3 3 0 013-3h7a5 5 0 015 5v10M3 21h18M6 12h4m4 0h4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Hotels near venue
                </div>
              </div>
              {hotelsLoading ? (
                <HotelListSkeleton />
              ) : (
                <HotelList
                  hotels={hotels}
                  selectedHotel={selectedHotel}
                  setSelectedHotel={setSelectedHotel}
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  ); 
}

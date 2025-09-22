import React from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import FlightList from './FlightList';
import HotelList from './HotelList';

export default function TravelModal({
  selected,
  flights,
  hotels,
  selectedFlight, setSelectedFlight,
  selectedHotel, setSelectedHotel,
  saving,
  handleSave,
  onClose,
  modalRef,
}) {
  if (!selected) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="travel-title"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close dialog" title="Close">
          ✕
        </button>

        <header className="modal-header">
          <h2 id="travel-title" className="modal-title">
            Travel options for: {selected.title || selected.name}
          </h2>
          <div className="modal-sub">
            {selected.when} {selected.venue && <>• {selected.venue} </>} {selected.city && <>• {selected.city}</>}
          </div>
        </header>

        <div className="modal-body">
          <form onSubmit={handleSave}>
            <PrimaryButton disabled={saving}>
              {saving ? 'Saving…' : 'Bookmark this trip'}
            </PrimaryButton>

            <div className="travel-column">
              <h3>Flights</h3>
              <FlightList
                data={flights}
                selectedFlight={selectedFlight}
                setSelectedFlight={setSelectedFlight}
              />
              <details className="raw-toggle">
                <summary>Show raw</summary>
                <pre className="pre-json">{JSON.stringify(flights, null, 2)}</pre>
              </details>
            </div>

            <div className="travel-column">
              <h3>Hotels near venue</h3>
              <HotelList
                hotels={hotels}
                selectedHotel={selectedHotel}
                setSelectedHotel={setSelectedHotel}
              />
              <details className="raw-toggle">
                <summary>Show raw</summary>
                <pre className="pre-json">{JSON.stringify(hotels, null, 2)}</pre>
              </details>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

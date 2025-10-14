import React from 'react';

export default function SearchHeader(props) {
  const {
    q, setQ,
    location, setLocation,
    when, setWhen,
    loading,
    showSuggestions,
    onSubmitSearch,
    onClear,
    runQuickSearch,
  } = props;

  return (
    <header className={`search-header ${showSuggestions ? 'is-landing' : ''}`}>
      <div className="search-inner">
        <h1 className="app-name-title">Eventify</h1>

        <form
          className="actions-wrapper"
          onSubmit={(e) => onSubmitSearch?.(e, q)}
        >
          <div className="input-group">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search artists, venues, genres…"
              className="input-search"
              aria-label="Search query"
              name="SearchQuery"
            />
            <input type="hidden" value={location} onChange={(e) => setLocation(e.target.value)} />
            <select
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="input-when"
              aria-label="When"
            >
              <option value="">When</option>
              <option value="">Anytime</option>
              <option value="date:today">Today</option>
              <option value="date:tomorrow">Tomorrow</option>
              <option value="date:week">This Week</option>
              <option value="date:weekend">This Weekend</option>
              <option value="date:next_week">Next Week</option>
              <option value="date:month">This Month</option>
              <option value="date:next_month">Next Month</option>
              <option value="event_type:Virtual-Event">Online</option>
            </select>
          </div>

          <div className="actions-buttons">
            <button
              type="submit"
              className="btn primary"
              disabled={loading}
              aria-busy={loading ? 'true' : 'false'}
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
            <button type="button" className="btn" onClick={onClear} disabled={loading}>
              Clear
            </button>
          </div>
        </form>

        {showSuggestions && (
          <section className="landing-suggest in-header">
            <div className="suggest-wrap">
              <div className="suggest-hero">
                <div className="hero-eyebrow">Getting started</div>
                <h2 className="hero-title">Search concerts & events</h2>
                <p className="hero-sub">Pick a quick chip or just type above.</p>
              </div>

              <div className="chip-row big mb-14">
                {['Korn','Lady Gaga','Morgenshtern','Linkin Park'].map((name) => (
                  <button
                    key={name}
                    className="chip chip--pill chip--ghost chip--lg"
                    onClick={() => runQuickSearch?.(name, '')}
                    type="button"
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="suggest-grid">
                <div className="suggest-card">
                  <div className="suggest-head">By date</div>
                  <div className="chip-row">
                    {[
                      { label: 'Today', value: 'date:today' },
                      { label: 'This Weekend', value: 'date:weekend' },
                      { label: 'Next Week', value: 'date:next_week' },
                    ].map(({label, value}) => (
                      <button
                        key={value}
                        className="chip chip--pill chip--ghost"
                        onClick={() => runQuickSearch?.(q || 'concert', value)}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="hint">Sets the “When” filter for you.</div>
                </div>

                <div className="suggest-card">
                  <div className="suggest-head">Cities</div>
                  <div className="chip-row">
                    {['London','Riga','Stockholm','Manchester'].map((c) => (
                      <button
                        key={c}
                        className="chip chip--pill chip--ghost"
                        onClick={() => runQuickSearch?.('concert', '', c)}
                        type="button"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="hint">Searches events around the city.</div>
                </div>

                <div className="suggest-card">
                  <div className="suggest-head">Ideas</div>
                  <div className="chip-row">
                    {['rock','pop','stand-up','festival'].map((k) => (
                      <button
                        key={k}
                        className="chip chip--pill chip--ghost"
                        onClick={() => runQuickSearch?.(k)}
                        type="button"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <div className="hint">Quick genre kicks to get you going.</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </header>
  );
}

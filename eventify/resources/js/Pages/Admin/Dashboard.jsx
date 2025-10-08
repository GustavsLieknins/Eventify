import React from 'react';
import { usePage } from '@inertiajs/react';
import TopNav from '@/Shared/TopNav';
import './Admin.css';

function Stat({ label, value }) {
  return (
    <div className="card stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function List({ title, items, labelKey, valueKey }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <ul className="list">
        {items?.map((it, idx) => (
          <li key={idx} className="list-item">
            <span className="list-label">{it[labelKey] || '—'}</span>
            <span className="list-value">{it[valueKey]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminDashboard() {
  const { props } = usePage();
  const {
    totals = {},
    visitsByDay = [],
    searchesByDay = [],
    topCountries = [],
    topPaths = [],
    topQueries = [],
    topSavedTitles = [],
    topShared = [],
  } = props;

  return (
    <>
      <TopNav active="admin" />
      <div className="admin-page">
        <div className="container-admin">
          <h1 className="admin-title">Admin · Stats</h1>

          <div className="kpis stats-grid">
            <Stat label="Visits" value={totals.visits ?? 0} />
            <Stat label="Searches" value={totals.searches ?? 0} />
            <Stat label="Share Links" value={totals.share_links ?? 0} />
            <Stat label="Share Opens" value={totals.share_opens ?? 0} />
            <Stat label="Trips Saved" value={totals.trips ?? 0} />
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <List title="Top Countries" items={topCountries} labelKey="country" valueKey="c" />
            <List title="Top Pages" items={topPaths} labelKey="path" valueKey="c" />
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <List title="Top Queries" items={topQueries} labelKey="query" valueKey="c" />
            <List title="Top Concert Titles" items={topSavedTitles} labelKey="title" valueKey="c" />
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">Top Shared Trips</div>
            <ul className="list">
              {topShared?.map((t) => (
                <li key={t.id} className="list-item">
                  <span className="list-label">{t.title || t.slug}</span>
                  <span className="list-value">{t.opens}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="card spark">
              <div className="card-title">Visits (14d)</div>
              {visitsByDay.map((r, i) => (
                <div key={i} className="spark-row">
                  <span>{r.d}</span>
                  <span className="spark-value">{r.c}</span>
                </div>
              ))}
            </div>
            <div className="card spark">
              <div className="card-title">Searches (14d)</div>
              {searchesByDay.map((r, i) => (
                <div key={i} className="spark-row">
                  <span>{r.d}</span>
                  <span className="spark-value">{r.c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

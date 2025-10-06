import React from 'react';
import { usePage } from '@inertiajs/react';
import TopNav from '@/Shared/TopNav';

function Stat({ label, value }) {
  return (
    <div className="p-4 rounded-2xl shadow-sm bg-white/70 backdrop-blur border border-white/30">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function List({ title, items, labelKey, valueKey }) {
  return (
    <div className="p-4 rounded-2xl shadow-sm bg-white/70 backdrop-blur border border-white/30">
      <div className="text-lg font-semibold mb-2">{title}</div>
      <ul className="space-y-1">
        {items?.map((it, idx) => (
          <li key={idx} className="flex justify-between text-sm">
            <span className="truncate">{it[labelKey] || '—'}</span>
            <span className="tabular-nums">{it[valueKey]}</span>
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
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Admin · Stats</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="Visits" value={totals.visits ?? 0} />
          <Stat label="Searches" value={totals.searches ?? 0} />
          <Stat label="Share Links" value={totals.share_links ?? 0} />
          <Stat label="Share Opens" value={totals.share_opens ?? 0} />
          <Stat label="Trips Saved" value={totals.trips ?? 0} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <List title="Top Countries" items={topCountries} labelKey="country" valueKey="c" />
          <List title="Top Pages" items={topPaths} labelKey="path" valueKey="c" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <List title="Top Queries" items={topQueries} labelKey="query" valueKey="c" />
          <List title="Top Concert Titles" items={topSavedTitles} labelKey="title" valueKey="c" />
        </div>

        <div className="p-4 rounded-2xl shadow-sm bg-white/70 backdrop-blur border border-white/30">
          <div className="text-lg font-semibold mb-2">Top Shared Trips</div>
          <ul className="space-y-1">
            {topShared?.map((t) => (
              <li key={t.id} className="flex justify-between text-sm">
                <span className="truncate">{t.title || t.slug}</span>
                <span className="tabular-nums">{t.opens}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl shadow-sm bg-white/70 backdrop-blur border border-white/30">
            <div className="text-lg font-semibold mb-2">Visits (14d)</div>
            <ul className="text-sm space-y-1">
              {visitsByDay.map((r, i) => (
                <li key={i} className="flex justify-between">
                  <span>{r.d}</span><span className="tabular-nums">{r.c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-2xl shadow-sm bg-white/70 backdrop-blur border border-white/30">
            <div className="text-lg font-semibold mb-2">Searches (14d)</div>
            <ul className="text-sm space-y-1">
              {searchesByDay.map((r, i) => (
                <li key={i} className="flex justify-between">
                  <span>{r.d}</span><span className="tabular-nums">{r.c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

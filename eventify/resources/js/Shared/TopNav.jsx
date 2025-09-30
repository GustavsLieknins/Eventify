import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import './TopNav.css';

export default function TopNav({ active = '' }) {
  const { auth } = usePage().props || {};
  const user = auth?.user;

  const logout = (e) => {
    e.preventDefault();
    router.post('/logout');
  };

  return (
    <nav className="ef-nav" role="navigation" aria-label="Main">
      <div className="ef-nav__inner">
        <Link href="/dashboard" className="ef-nav__brand" aria-label="Eventify home">
          <span className="ef-nav__logo" aria-hidden="true">✦</span>
          <span className="ef-nav__name">Eventify</span>
        </Link>

        <div className="ef-nav__links">
          <Link
            href="/dashboard"
            className={`ef-nav__link ${active === 'dashboard' ? 'is-active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            href="/bookmarks"
            className={`ef-nav__link ${active === 'bookmarks' ? 'is-active' : ''}`}
          >
            Bookmarks
          </Link>
        </div>

        <div className="ef-nav__auth">
          {user ? (
            <>
              <span className="ef-nav__hello">Hi, {user.name || 'User'}</span>
              <button className="ef-btn ef-btn--glass ef-btn--sm" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="ef-btn ef-btn--glass ef-btn--sm" href="/login">Log in</Link>
              <Link className="ef-btn ef-btn--accent ef-btn--sm" href="/register">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

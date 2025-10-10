import React, { useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import "./TopNav.css";

export default function TopNav({ active = "" }) {
  const { auth } = usePage().props || {};
  const user = auth?.user;
  const isAdmin = user && (user.role === 1 || user.role === "1");

  const [open, setOpen] = useState(false);

  const logout = (e) => {
    e.preventDefault();
    setOpen(false);
    router.post("/logout");
  };

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const NavLink = ({ href, id, children }) => (
    <Link
      href={href}
      className={`ef-nav__link ${active === id ? "is-active" : ""}`}
      onClick={() => setOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <nav className="ef-nav" role="navigation" aria-label="Main">
      <div className="ef-nav__inner">
        <Link
          href="/dashboard"
          className="ef-nav__brand"
          aria-label="Eventify home"
          onClick={() => setOpen(false)}
        >
          <span className="ef-nav__logo" aria-hidden="true">✦</span>
          <span className="ef-nav__name">Eventify</span>
        </Link>

        <div className="ef-nav__links ef-hide-mobile">
          <NavLink href="/dashboard" id="dashboard">Dashboard</NavLink>
          <NavLink href="/bookmarks" id="bookmarks">Bookmarks</NavLink>
          {isAdmin && <NavLink href="/admin" id="admin">Admin</NavLink>}
        </div>

        <div className="ef-nav__auth ef-hide-mobile">
          {user ? (
            <>
              <span className="ef-nav__hello">Hi, {user?.name || "User"}</span>
              <button className="ef-btn ef-btn--solid ef-btn--sm" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="ef-btn ef-btn--solid ef-btn--sm" href="/login">Log in</Link>
              <Link className="ef-btn ef-btn--accent ef-btn--sm" href="/register">Sign up</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={`ef-burger ef-show-mobile ${open ? "is-active" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open ? "true" : "false"}
          onClick={() => setOpen(!open)}
        >
          <span className="ef-burger__bar" />
          <span className="ef-burger__bar" />
          <span className="ef-burger__bar" />
        </button>
      </div>

      <div className={`ef-sheet ${open ? "is-open" : ""}`} role="dialog" aria-modal="true">
        <div className="ef-sheet__head">
          <span className="ef-sheet__title">Menu</span>
          <button className="ef-sheet__close" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        </div>

        <nav className="ef-sheet__links" aria-label="Mobile">
          <NavLink href="/dashboard" id="dashboard">Dashboard</NavLink>
          <NavLink href="/bookmarks" id="bookmarks">Bookmarks</NavLink>
          {isAdmin && <NavLink href="/admin" id="admin">Admin</NavLink>}
        </nav>

        <div className="ef-sheet__auth">
          {user ? (
            <button className="ef-btn ef-btn--solid ef-btn--sm" onClick={logout}>Logout</button>
          ) : (
            <>
              <Link className="ef-btn ef-btn--solid ef-btn--sm" href="/login" onClick={() => setOpen(false)}>Log in</Link>
              <Link className="ef-btn ef-btn--accent ef-btn--sm" href="/register" onClick={() => setOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

import React, { memo } from 'react';

export default memo(function Icon({ name, size = 18, className = '' }) {
  const s = size;
  switch (name) {
    case 'x':
      return <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
    case 'external':
      return <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M14 4h6v6m0-6L10 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 9v10a1 1 0 001 1h10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>;
    case 'trash':
      return <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>;
    case 'plane':
      return <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M10 21l2-5 7-7a2 2 0 10-3-3l-7 7-5 2 2-5-3-3 4-1 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'hotel':
      return <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M3 21V9a3 3 0 013-3h7a5 5 0 015 5v10M3 21h18M6 12h4m4 0h4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'map':
      return <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/><circle cx="12" cy="10" r="2" fill="currentColor"/></svg>;
    case 'globe':
      return <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z M2 12h20M12 2c3.5 4.5 3.5 15.5 0 20M12 2c-3.5 4.5-3.5 15.5 0 20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>;
    case 'link':
      return <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden="true"><path d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 10-7.07-7.07L10 5m4 6a5 5 0 01-7.07 0L5.5 9.57a5 5 0 117.07-7.07L13 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    default:
      return null;
  }
});

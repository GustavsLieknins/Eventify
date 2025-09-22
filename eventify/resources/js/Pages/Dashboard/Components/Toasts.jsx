import React from 'react';
import { createPortal } from 'react-dom';

export default function Toasts({ toasts, onDismiss }) {
  const content = (
    <div className="toast-wrap" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.tone ? `toast--${t.tone}` : ''}`}>
          <div className="toast__title">{t.title}</div>
          {t.message && <div className="toast__msg">{t.message}</div>}
          <button className="toast__close" onClick={() => onDismiss(t.id)}>✕</button>
          <div className="toast__bar" style={{ animationDuration: `${t.ttl}ms` }} />
        </div>
      ))}
    </div>
  );
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}

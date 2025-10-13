import React from 'react';
import Icon from './Ui/Icon';
import Button from './Ui/Button';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, busy }) {
  if (!open) return null;
  return (
    <div className="confirm-wrap" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="confirm" onClick={(e) => e.stopPropagation()}>
        <button className="confirm__close" onClick={onCancel} aria-label="Close">
          <Icon name="x" />
        </button>

        <h3 className="confirm__title">{title || 'Are you sure?'}</h3>
        {message ? <div className="confirm__msg">{message}</div> : null}

        <div className="confirm__actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" iconLeft={<Icon name="trash" />} disabled={busy} onClick={onConfirm}>
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import React, { memo } from 'react';
export default memo(function Empty({ title = 'Nothing here yet', hint }) {
  return (
    <div className="empty">
      <div className="empty__title">{title}</div>
      {hint && <div className="empty__hint">{hint}</div>}
    </div>
  );
});

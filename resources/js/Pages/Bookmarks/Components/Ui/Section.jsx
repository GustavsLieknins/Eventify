import React, { memo } from 'react';
export default memo(function Section({ title, icon, children, className = '' }) {
  return (
    <div className={`blk ${className}`}>
      <div className="blk__head">
        {icon}
        <h3 className="blk__title">{title}</h3>
      </div>
      <div className="blk__body">{children}</div>
    </div>
  );
});

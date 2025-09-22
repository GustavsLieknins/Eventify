import React, { memo } from 'react';
export default memo(function Badge({ children, tone = 'glass', className = '' }) {
  return <span className={`ui-badge ui-badge--${tone} ${className}`}>{children}</span>;
});

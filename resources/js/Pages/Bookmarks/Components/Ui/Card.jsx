import React, { memo } from 'react';
export default memo(function Card({ children, interactive = true, className = '', ...rest }) {
  return (
    <section className={`ui-card ${interactive ? 'ui-card--hover' : ''} ${className}`} {...rest}>
      {children}
    </section>
  );
});

import React, { memo } from 'react';

export default memo(function Button({
  children,
  size = 'md',
  variant = 'glass',
  iconLeft,
  iconRight,
  as = 'button',
  className = '',
  ...rest
}) {
  const Comp = as;
  return (
    <Comp className={`ui-btn ui-btn--${size} ui-btn--${variant} ${className}`} {...rest}>
      {iconLeft ? <span className="ui-btn__icon">{iconLeft}</span> : null}
      <span className="ui-btn__label">{children}</span>
      {iconRight ? <span className="ui-btn__icon">{iconRight}</span> : null}
    </Comp>
  );
});

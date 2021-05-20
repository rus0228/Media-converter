import React from 'react';

const FlexBox = ({children, className, style}) => {
  return (
    <div style={{display:'flex', ...style}} className={className}>{children}</div>
  )
};
export default FlexBox;

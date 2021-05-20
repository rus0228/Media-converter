import React from 'react';

export function useDelay(call, timeout) {
  const timeoutRef = React.useRef();

  React.useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const schedule = (...params) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      call(...params)
    }, timeout || 300);
  };

  return schedule;
}

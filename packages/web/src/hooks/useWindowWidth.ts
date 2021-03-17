import throttle from 'lodash.throttle';
import { useEffect, useState } from 'react';

export function useWindowWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (typeof window?.innerWidth === 'number') {
      function onWidthChange() {
        setWidth(window.innerWidth);
      }
      const tOnWidthChange = throttle(onWidthChange, 50);
      window.addEventListener('resize', tOnWidthChange);

      return () => {
        window.removeEventListener('resize', tOnWidthChange);
      };
    }
  }, [setWidth]);

  return width;
}

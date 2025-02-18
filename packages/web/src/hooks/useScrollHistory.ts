import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';

// Store scroll positions globally so they persist across component unmounts
const scrollPositions = new Map<string, number>();

export const useScrollHistory = (componentId: string) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositionRef = useRef<number>(0);
  const lastPathRef = useRef<string>(location.pathname + location.search);

  // Create a unique key for this component and route combination
  const getScrollKey = useCallback(() => {
    const { pathname, search } = location;
    return `${componentId}:${pathname}${search}`;
  }, [location, componentId]);

  // Save the current scroll position
  const saveScrollPosition = useCallback(
    (scrollOffset: number) => {
      const key = getScrollKey();
      scrollPositions.set(key, scrollOffset);
      scrollPositionRef.current = scrollOffset;
    },
    [getScrollKey],
  );

  // Get the saved scroll position for the current route
  const getSavedScrollPosition = useCallback((): number => {
    const key = getScrollKey();
    const savedPosition = scrollPositions.get(key);
    if (savedPosition !== undefined) {
      scrollPositionRef.current = savedPosition;
    }
    return savedPosition ?? 0;
  }, [getScrollKey]);

  // Save scroll position when navigating away
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (currentPath !== lastPathRef.current) {
      // Save the scroll position for the path we're leaving
      const key = `${componentId}:${lastPathRef.current}`;
      if (scrollPositionRef.current > 0) {
        scrollPositions.set(key, scrollPositionRef.current);
      }
      lastPathRef.current = currentPath;
    }
  }, [location, componentId]);

  // Handle scroll position restoration on back/forward navigation
  useEffect(() => {
    if (navigationType === 'POP') {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        const savedPosition = getSavedScrollPosition();
        if (savedPosition > 0) {
          saveScrollPosition(savedPosition);
        }
      }, 0);
    }
  }, [navigationType, getSavedScrollPosition, saveScrollPosition]);

  // Clear saved scroll position for current route
  const clearScrollPosition = useCallback(() => {
    const key = getScrollKey();
    scrollPositions.delete(key);
    scrollPositionRef.current = 0;
  }, [getScrollKey]);

  // Clear all saved scroll positions
  const clearAllScrollPositions = useCallback(() => {
    scrollPositions.clear();
    scrollPositionRef.current = 0;
  }, []);

  return {
    saveScrollPosition,
    getSavedScrollPosition,
    clearScrollPosition,
    clearAllScrollPositions,
    get lastSavedPosition() {
      return scrollPositionRef.current;
    },
  } as const;
};

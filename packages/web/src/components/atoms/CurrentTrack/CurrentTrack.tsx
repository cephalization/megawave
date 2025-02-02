import { useCallback, useEffect, useRef } from 'react';

import { getArrayString } from '~/utils/trackMeta';

import { AlbumArt } from '../AlbumArt/AlbumArt';

type CurrentTrackProps = {
  title?: string;
  artist?: string | string[] | null;
  art?: string;
  onScrollToTrack?: () => void;
};

export function CurrentTrack({
  title,
  artist,
  art,
  onScrollToTrack,
}: CurrentTrackProps) {
  const pressTimer = useRef<number>(0);
  const lastClickTime = useRef<number>(0);
  const DOUBLE_CLICK_DELAY = 300;
  const LONG_PRESS_DELAY = 1000;

  const handleMouseDown = useCallback(() => {
    if (onScrollToTrack) {
      pressTimer.current = window.setTimeout(() => {
        onScrollToTrack();
      }, LONG_PRESS_DELAY);
    }
  }, [onScrollToTrack]);

  const handleMouseUp = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  }, []);

  const handleClick = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime.current < DOUBLE_CLICK_DELAY) {
      // Double click detected
      if (onScrollToTrack) {
        onScrollToTrack();
      }
      lastClickTime.current = 0; // Reset to prevent triple-click
    } else {
      lastClickTime.current = currentTime;
    }
  }, [onScrollToTrack]);

  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, []);

  return (
    <div
      className="flex items-center gap-2 flex-shrink w-full cursor-pointer"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      <AlbumArt
        className="h-12 w-12 flex-shrink-0 hidden sm:flex"
        src={art}
        alt={`Album art for ${title} by ${artist}`}
      />
      <div className="flex flex-col min-w-0 w-full select-none">
        <div className="text-sm font-bold truncate max-w-full">
          {title || 'No track playing'}
        </div>
        <div className="text-xs text-gray-500 truncate max-w-full">
          {getArrayString(artist)}
        </div>
      </div>
    </div>
  );
}

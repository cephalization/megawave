import { EntityId } from '@reduxjs/toolkit';
import React, { useMemo, CSSProperties } from 'react';

import { Track } from '~/types/library';

const MOBILE_BREAKPOINT = 640;
const SCROLLBAR_WIDTH = 12;

type ScrollIndicatorProps = {
  currentTrack: Track | null;
  trackIDs: EntityId[];
  height: number;
};

export function ScrollIndicator({
  currentTrack,
  trackIDs,
  height,
}: ScrollIndicatorProps) {
  const style = useMemo((): CSSProperties | null => {
    if (!currentTrack || !height) return null;
    const currentTrackIndex = trackIDs.findIndex(
      (id) => id === currentTrack.id,
    );
    if (currentTrackIndex === -1) return null;

    const itemHeight = window.innerWidth >= MOBILE_BREAKPOINT ? 40 : 55;
    const totalHeight = trackIDs.length * itemHeight;
    const viewportRatio = height / totalHeight;
    const thumbHeight = Math.max(viewportRatio * height, 48); // Minimum thumb height of 48px
    const availableScrollHeight = height - thumbHeight;
    const scrollRatio = availableScrollHeight / (totalHeight - height);
    const position = currentTrackIndex * itemHeight * scrollRatio;
    const positionPercent = (position / availableScrollHeight) * 100;

    if (positionPercent < 0) return null;

    return {
      position: 'absolute',
      right: 0,
      top: `${Math.min(Math.max(positionPercent, 0), 100)}%`,
      width: SCROLLBAR_WIDTH,
      height: '4px',
      transform: 'translateY(-50%)',
      zIndex: 10,
      pointerEvents: 'none',
    };
  }, [currentTrack, trackIDs, height]);

  if (!style) return null;

  return <div style={style} className="bg-blue-500/50" />;
}

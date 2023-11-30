import { EntityId } from '@reduxjs/toolkit';
import React, { forwardRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import { useAvailableDimensions } from '~/hooks';
import { Track } from '~/types/library';

import { TrackListHeader } from '../TrackList/components/TrackListHeader';
import { TrackListRow } from '../TrackList/components/TrackListRow';

export type TrackListProps = {
  trackIDs: EntityId[];
  onPlayTrackId: (arg: {
    trackId?: EntityId | null;
    requeue?: boolean;
  }) => void;
  onFilterLibrary: (field: keyof Track, trackId: EntityId) => void;
  currentTrack?: Track | null;
};

const MOBILE_BREAKPOINT = 640;
export const LIST_PADDING = 16;

// react-window construct
// used to add padding to virtualized list contents
const innerElementType = forwardRef<
  HTMLDivElement,
  { style: React.CSSProperties }
>(({ style, ...rest }, ref) => (
  <div
    ref={ref}
    style={{
      ...style,
      height: `${
        (typeof style.height === 'number'
          ? (style.height as number)
          : parseFloat(style.height || '0')) +
        LIST_PADDING * 2
      }px`,
    }}
    {...rest}
  />
));

export const TrackList = ({
  trackIDs,
  onPlayTrackId,
  onFilterLibrary,
  currentTrack,
}: TrackListProps) => {
  // (height of parent container) - (height of all children)
  // this derived height value can be used to perfectly size the library items
  const { refToMeasure: libraryRef, height } =
    useAvailableDimensions('library-container');

  return (
    <>
      <TrackListHeader />
      <div
        className="border-t border-gray-200"
        style={{ height }}
        ref={libraryRef}
      >
        <div className="h-full">
          <AutoSizer>
            {({ width, height: innerHeight }) => (
              <FixedSizeList
                height={innerHeight}
                width={width}
                itemCount={trackIDs.length}
                // at available container width 640 or lower, this needs to get bumped up to 55
                // anything higher and this should be 40
                itemSize={width >= MOBILE_BREAKPOINT ? 40 : 55}
                innerElementType={innerElementType}
              >
                {({ index, style }) => {
                  const trackId = trackIDs[index];

                  return (
                    <TrackListRow
                      trackId={trackId}
                      style={style}
                      onClickTrack={() =>
                        onPlayTrackId({
                          trackId,
                          requeue: true,
                        })
                      }
                      onClickField={(field: keyof Track) =>
                        onFilterLibrary(field, trackId)
                      }
                      isActive={trackId === currentTrack?.id}
                    />
                  );
                }}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
      </div>
    </>
  );
};

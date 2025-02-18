import { EntityId } from '@reduxjs/toolkit';
import React, { forwardRef, useRef, useEffect, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import { useAvailableDimensions } from '~/hooks';
import { useTrackSelection } from '~/hooks/useTrackSelection';
import { Track } from '~/types/library';

import { ScrollIndicator } from './components/ScrollIndicator';
import { SelectionToolbar } from './components/SelectionToolbar';
import { TrackListHeader } from './components/TrackListHeader';
import { TrackListRow } from './components/TrackListRow';

export type TrackListProps = {
  trackIDs: EntityId[];
  onPlayTrackId: (arg: {
    trackId?: EntityId | null;
    requeue?: boolean;
    context?: 'library' | 'history' | 'queue' | 'album';
    addHistory?: boolean;
  }) => void;
  onFilterLibrary: (field: keyof Track, trackId: EntityId) => void;
  currentTrack?: Track | null;
  containerId?: string;
  context?: 'library' | 'history' | 'queue' | 'album';
  scrollToTrack?: EntityId | null;
};

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
  containerId = 'library-container',
  context = 'library',
  scrollToTrack,
}: TrackListProps) => {
  const { selectedTracks, handleTrackSelection, clearSelection } =
    useTrackSelection(trackIDs);
  const listRef = useRef<FixedSizeList>(null);
  const { refToMeasure: libraryRef, height } =
    useAvailableDimensions(containerId);

  // Add effect to scroll to track when scrollToTrack changes
  useEffect(() => {
    if (scrollToTrack && listRef.current) {
      const trackIndex = trackIDs.findIndex((id) => id === scrollToTrack);
      if (trackIndex !== -1) {
        listRef.current.scrollToItem(trackIndex, 'center');
      }
    }
  }, [scrollToTrack, trackIDs]);

  const handleAddToPlaylist = (trackIds: EntityId[]) => {
    // TODO: Implement playlist addition functionality
    clearSelection();
  };

  const handleQueueSelected = (trackIds: EntityId[]) => {
    // TODO: Implement queue addition functionality
    clearSelection();
  };

  return (
    <>
      <TrackListHeader />
      <div
        className="border-t border-border relative bg-card transition-colors"
        style={{ height }}
        ref={libraryRef}
      >
        <div className="h-full">
          <ScrollIndicator
            currentTrack={currentTrack ?? null}
            trackIDs={trackIDs}
            height={height ?? 0}
          />
          <AutoSizer>
            {({ width, height: innerHeight }) => (
              <FixedSizeList
                ref={listRef}
                height={innerHeight}
                width={width}
                itemCount={trackIDs.length}
                itemKey={(index) => `${index}-${trackIDs[index]}`}
                itemSize={50}
                innerElementType={innerElementType}
                overscanCount={20}
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
                          context,
                          addHistory: context === 'library',
                        })
                      }
                      onClickField={(field: keyof Track) =>
                        onFilterLibrary(field, trackId)
                      }
                      isActive={trackId === currentTrack?.id}
                      isSelected={selectedTracks.includes(trackId)}
                      onSelect={handleTrackSelection}
                    />
                  );
                }}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
      </div>
      <SelectionToolbar
        selectedTracks={selectedTracks}
        onAddToPlaylist={handleAddToPlaylist}
        onQueueTracks={handleQueueSelected}
      />
    </>
  );
};

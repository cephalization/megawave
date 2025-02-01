import { EntityId } from '@reduxjs/toolkit';
import debounce from 'lodash.debounce';
import React, { forwardRef, useEffect, useRef } from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { useAvailableDimensions } from '~/hooks';
import { libraryActions } from '~/store/slices/library/library';
import { librarySelectors } from '~/store/slices/library/selectors';
import { Track } from '~/types/library';

import { TrackListHeader } from '../TrackList/components/TrackListHeader';
import { TrackListRow } from '../TrackList/components/TrackListRow';

export type TrackListProps = {
  trackIDs: EntityId[];
  onPlayTrackId: (arg: {
    trackId?: EntityId | null;
    requeue?: boolean;
    context?: 'library' | 'history';
    addHistory?: boolean;
  }) => void;
  onFilterLibrary: (field: keyof Track, trackId: EntityId) => void;
  currentTrack?: Track | null;
  containerId?: string;
  context?: 'library' | 'history';
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
  containerId = 'library-container',
  context = 'library',
}: TrackListProps) => {
  const dispatch = useAppDispatch();
  const listRef = useRef<FixedSizeList>(null);
  const previousFilterRef = useRef<string>('');
  // (height of parent container) - (height of all children)
  // this derived height value can be used to perfectly size the library items
  const { refToMeasure: libraryRef, height } =
    useAvailableDimensions(containerId);

  const trackFilter = useAppSelector(librarySelectors.selectLibraryFilter);
  const tracksByFilter = useAppSelector(
    librarySelectors.selectLibraryTracksByFilter,
  );
  const savedScrollPosition = useAppSelector(
    librarySelectors.selectCurrentScrollPosition,
  );

  // Get the current active filter key
  const getCurrentFilterKey = useCallback(() => {
    const subkeyfilterKey = Object.keys(tracksByFilter).find(
      (key) => key.startsWith('artist-') || key.startsWith('album-'),
    );
    return subkeyfilterKey || trackFilter || '';
  }, [tracksByFilter, trackFilter]);

  // Save scroll position when scrolling
  const handleScroll = useMemo(
    () =>
      // debounce to prevent excessive dispatching
      debounce(({ scrollOffset }: { scrollOffset: number }) => {
        const currentFilterKey = getCurrentFilterKey();
        dispatch(
          libraryActions.setScrollPosition({
            filter: currentFilterKey,
            position: scrollOffset,
          }),
        );
      }, 200),
    [getCurrentFilterKey, dispatch],
  );

  // Handle filter changes and scroll position restoration
  useEffect(() => {
    const currentFilterKey = getCurrentFilterKey();

    // Only restore scroll position if we're removing a filter
    // (going from filtered -> unfiltered state)
    if (currentFilterKey === '' && previousFilterRef.current !== '') {
      if (listRef.current && savedScrollPosition > 0) {
        listRef.current.scrollTo(savedScrollPosition);
      }
    }

    // When applying a filter, always start at the top
    if (currentFilterKey !== '' && previousFilterRef.current === '') {
      if (listRef.current) {
        listRef.current.scrollTo(0);
      }
    }

    previousFilterRef.current = currentFilterKey;
  }, [getCurrentFilterKey, savedScrollPosition, trackFilter, tracksByFilter]);

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
                ref={listRef}
                height={innerHeight}
                width={width}
                itemCount={trackIDs.length}
                itemKey={(index) => `${index}-${trackIDs[index]}`}
                // at available container width 640 or lower, this needs to get bumped up to 55
                // anything higher and this should be 40
                itemSize={width >= MOBILE_BREAKPOINT ? 40 : 55}
                innerElementType={innerElementType}
                onScroll={handleScroll}
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

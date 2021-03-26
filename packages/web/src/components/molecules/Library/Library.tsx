import React, { forwardRef, useContext, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import { PlayerContext } from '~/context/PlayerContext';
import { fetchLibrary, librarySelectors } from '~/store/slices/library';
import {
  useAppDispatch,
  useAppSelector,
  useDynamicHeight,
  useWindowWidth,
} from '~/hooks';

import { WaveLoader } from '../WaveLoader';
import { LibraryRow } from './components/LibraryRow';
import { LibraryHeader } from './components/LibraryHeader';

export const LIST_PADDING = 16;

const MOBILE_BREAKPOINT = 640;

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

export function Library() {
  // (height of parent container) - (height of all children)
  // this derived height value can be used to perfectly size the library items
  const { refToMeasure: libraryRef, height } = useDynamicHeight(
    'library-container',
  );
  const windowWidth = useWindowWidth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchLibrary());
  }, []);

  const trackIDs = useAppSelector(librarySelectors.selectFilteredTrackIds);
  const isLoading = useAppSelector(librarySelectors.selectLibraryLoading);
  const { track: currentTrack, setTrack } = useContext(PlayerContext);

  if (isLoading) return <WaveLoader />;

  return (
    <>
      <LibraryHeader />
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
                // at window.width 640 or lower, this needs to get bumped up to 55
                // anything higher and this should be 40
                itemSize={windowWidth >= MOBILE_BREAKPOINT ? 40 : 55}
                innerElementType={innerElementType}
              >
                {({ index, style }) => {
                  const trackId = trackIDs[index];

                  return (
                    <LibraryRow
                      trackId={trackId}
                      style={style}
                      onClickTrack={setTrack}
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
}

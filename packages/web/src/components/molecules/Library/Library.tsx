import React, { forwardRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { bindActionCreators } from 'redux';

import {
  useAppDispatch,
  useAppSelector,
  useDynamicHeight,
  useWindowWidth,
} from '~/hooks';
import { playerActions } from '~/store/slices';
import { fetchLibrary, librarySelectors } from '~/store/slices/library';
import { getArrayString } from '~/utils/trackMeta';

import { WaveLoader } from '../WaveLoader';
import { LibraryHeader } from './components/LibraryHeader';
import { LibraryRow } from './components/LibraryRow';

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
  const currentTrack = useAppSelector(
    librarySelectors.selectLibraryActiveTrack,
  );
  const play = bindActionCreators(playerActions.play, useAppDispatch());

  if (isLoading) return <WaveLoader />;

  return (
    <>
      {currentTrack && (
        <Helmet>
          <title>
            {currentTrack.name}
            {getArrayString(currentTrack.artist)
              ? ` - ${getArrayString(currentTrack.artist)}`
              : ''}
            &nbsp;| Megawave
          </title>
        </Helmet>
      )}
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
                      onClickTrack={play}
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

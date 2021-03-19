import React, { forwardRef, useContext } from 'react';
import { FixedSizeList } from 'react-window';
import { useQuery } from 'react-query';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Track } from '~/types/library';
import { getLibrary } from '~/queries/library';
import { useDynamicHeight } from '~/hooks/useDynamicHeight';
import { PlayerContext } from '~/context/PlayerContext';
import { useWindowWidth } from '~/hooks/useWindowWidth';

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

const sanitizer = (s: string) => s?.toLocaleLowerCase?.() ?? '';

export function Library() {
  // (height of parent container) - (height of all children)
  // this derived height value can be used to perfectly size the library items
  const { refToMeasure: libraryRef, height } = useDynamicHeight(
    'library-container',
  );
  const { isLoading, error, data } = useQuery<Track[], any>(
    'library',
    getLibrary,
  );
  const windowWidth = useWindowWidth();
  const { track: currentTrack, setTrack, trackFilter } = useContext(
    PlayerContext,
  );

  if (isLoading || data === undefined) return <WaveLoader />;

  if (error) return null;

  const tracks = data.filter((t) =>
    ['name', 'artist', 'album'].some((p) =>
      // @ts-expect-error keys are properties of track. This will move into redux eventually.\
      sanitizer(Array.isArray(t[p]) ? t[p][0] : t[p]).includes(
        sanitizer(trackFilter),
      ),
    ),
  );

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
                itemCount={tracks.length}
                // at window.width 640 or lower, this needs to get bumped up to 55
                // anything higher and this should be 40
                itemSize={windowWidth >= MOBILE_BREAKPOINT ? 40 : 55}
                innerElementType={innerElementType}
              >
                {({ index, style }) => {
                  const track = tracks[index];

                  return (
                    <LibraryRow
                      track={track}
                      style={style}
                      onClickTrack={setTrack}
                      isActive={track.id === currentTrack?.id}
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

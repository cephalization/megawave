import React, { forwardRef } from 'react';
import { FixedSizeList } from 'react-window';
import { useQuery } from 'react-query';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Track } from '~/types/library';
import { getLibrary } from '~/queries/library';
import { useDynamicHeight } from '~/hooks/useDynamicHeight';

import { WaveLoader } from '../WaveLoader';
import { LibraryRow } from './components/LibraryRow';
import { LibraryHeader } from './components/LibraryHeader';
import { useWindowWidth } from '~/hooks/useWindowWidth';

export const LIST_PADDING = 16;

const MOBILE_BREAKPOINT = 640;

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
  const { isLoading, error, data } = useQuery<Track[], any>(
    'library',
    getLibrary,
  );
  const windowWidth = useWindowWidth();

  if (isLoading || data === undefined) return <WaveLoader />;

  if (error) return null;

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
                itemCount={data.length}
                // at window.width 640 or lower, this needs to get bumped up to 55
                // anything higher and this should be 40
                itemSize={windowWidth >= MOBILE_BREAKPOINT ? 40 : 55}
                innerElementType={innerElementType}
              >
                {({ index, style }) => {
                  const track = data[index];

                  return <LibraryRow track={track} style={style} />;
                }}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
      </div>
    </>
  );
}

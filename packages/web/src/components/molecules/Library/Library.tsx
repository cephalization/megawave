import React from 'react';
import { FixedSizeList } from 'react-window';
import { useQuery } from 'react-query';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Track } from '~/types/library';
import { getLibrary } from '~/queries/library';
import { useDynamicHeight } from '~/hooks/useDynamicHeight';

import { WaveLoader } from '../WaveLoader';
import { LibraryRow } from './components/LibraryRow';
import { LibraryHeader } from './components/LibraryHeader';

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
                itemSize={40}
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

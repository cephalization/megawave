import React from 'react';
import { useQuery } from 'react-query';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { getLibrary } from '~/queries/library';
import { Track } from '~/types/library';
import { WaveLoader } from '../WaveLoader';
import {
  LibraryTableRow,
  LibraryTableHeaderRow,
} from './components/LibraryTableRow';

function LibraryTableRows({ rows }: { rows: Track[] }) {
  return (
    <div className="min-h-full flex">
      <div className="align-middle flex-1 min-w-full border-b border-gray-200">
        <table className="min-w-full min-h-full">
          <thead>
            <LibraryTableHeaderRow />
          </thead>
          <AutoSizer>
            {({ height, width }) => (
              <FixedSizeList
                overscanCount={20}
                innerElementType="tbody"
                height={height}
                width={width}
                itemCount={rows.length}
                itemSize={40}
                className="bg-white divide-y divide-gray-100"
              >
                {({ index, style }) => {
                  const track = rows[index];
                  return (
                    <LibraryTableRow
                      key={track.id}
                      track={track}
                      style={style}
                    />
                  );
                }}
              </FixedSizeList>
            )}
          </AutoSizer>
        </table>
      </div>
    </div>
  );
}

export function LibraryTable() {
  const { isLoading, error, data } = useQuery<Track[], any>(
    'library',
    getLibrary,
  );

  if (isLoading || data === undefined) return <WaveLoader />;

  if (error) return null;

  return <LibraryTableRows rows={data} />;
}

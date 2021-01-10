import React from 'react';
import { useQuery } from 'react-query';
import { useVirtual } from 'react-virtual';
import { getLibrary } from '~/queries/library';
import { Track } from '~/types/library';
import { WaveLoader } from '../WaveLoader';
import {
  LibraryTableRow,
  LibraryTableHeaderRow,
} from './components/LibraryTableRow';

export function LibraryTable() {
  const { isLoading, error, data } = useQuery<Track[], any>(
    'library',
    getLibrary,
  );
  const parentRef = React.useRef(null);
  const rowVirtualizer = useVirtual({
    size: data?.length ?? 0,
    parentRef,
    estimateSize: React.useCallback(() => 45, [data]),
    overscan: 10,
  });

  if (isLoading || data === undefined) return <WaveLoader />;

  if (error) return null;

  return (
    <div className="block" ref={parentRef} style={{ overflow: 'auto' }}>
      <div className="align-middle inline-block min-w-full border-b border-gray-200">
        <table className="min-w-full">
          <thead>
            <LibraryTableHeaderRow />
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.totalSize}px`,
              width: '100%',
              position: 'relative',
            }}
            className="bg-white divide-y divide-gray-100"
          >
            {rowVirtualizer.virtualItems.map(({ index }) => {
              const track = data[index];
              return <LibraryTableRow key={track.id} track={track} />;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

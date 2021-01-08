import React from 'react';
import { useQuery } from 'react-query';
import { getLibrary, getLibraryResponse } from '~/queries/library';
import { Track } from '~/types/library';
import {
  LibraryTableRow,
  LibraryTableHeaderRow,
} from './components/LibraryTableRow';

export function LibraryTable() {
  const { isLoading, error, data } = useQuery<Track[], any>(
    'library',
    getLibrary,
  );

  if (isLoading || data === undefined) return null;

  if (error) return null;

  return (
    <div className="block">
      <div className="align-middle inline-block min-w-full border-b border-gray-200">
        <table className="min-w-full">
          <thead>
            <LibraryTableHeaderRow />
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((track: Track) => (
              <LibraryTableRow key={track.id} track={track} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

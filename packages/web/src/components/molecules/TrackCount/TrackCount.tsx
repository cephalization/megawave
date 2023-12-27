import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { useAppSelector } from '~/hooks';
import { librarySelectors } from '~/store/slices/library/selectors';

export const TrackCount = ({ loading }: { loading?: boolean }) => {
  const trackCount = useAppSelector(
    librarySelectors.selectFilteredTrackIdCount,
  );
  const trackFilter = useAppSelector(librarySelectors.selectLibraryFilter);

  return (
    <div className="flex-1 flex-grow-0 pl-5 px-4 py-4 sm:px-6 lg:px-8 items-center justify-end w-full hidden sm:flex gap-2">
      {loading && (
        <ArrowPathIcon className="animate-spin h-5 w-5 text-gray-400" />
      )}
      <h2 className="text-sm leading-6 text-gray-500 font-semibold">
        Tracks:{' '}
        <span className="text-gray-600 font-bold font-mono">
          {trackCount}
          <span className="text-gray-400 text-sm">
            {trackFilter ? ' (filtered)' : ''}
          </span>
        </span>
      </h2>
    </div>
  );
};

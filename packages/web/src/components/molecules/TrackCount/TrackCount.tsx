import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { libraryActions } from '~/store/slices/library/library';
import { librarySelectors } from '~/store/slices/library/selectors';

export const TrackCount = ({ loading }: { loading?: boolean }) => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const trackCount = useAppSelector(
    librarySelectors.selectFilteredTrackIdCount,
  );
  const trackFilter = useAppSelector(librarySelectors.selectLibraryFilter);

  // Check for active filter
  const activeFilter = searchParams.get('filter');
  const searchQuery = searchParams.get('q');

  useEffect(() => {
    // Sync URL filter with Redux state
    if (activeFilter) {
      dispatch(libraryActions.setLibraryFilter({ filter: activeFilter }));
    } else if (searchQuery) {
      dispatch(libraryActions.setLibraryFilter({ filter: searchQuery }));
    }
  }, [activeFilter, searchQuery, dispatch]);

  const clearFilter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchParams({});
    dispatch(libraryActions.setLibraryFilter({ filter: '' }));
  };

  const getFilterDisplay = () => {
    if (activeFilter) {
      const [field, ...value] = activeFilter.split('-');
      return `${field}: ${decodeURIComponent(value.join('-'))}`;
    }
    if (searchQuery) {
      return `search: ${searchQuery}`;
    }
    if (trackFilter) {
      return `search: ${trackFilter}`;
    }
    return null;
  };

  const filterDisplay = getFilterDisplay();

  return (
    <div className="flex-1 flex-grow-0 pl-5 px-4 py-4 sm:px-6 lg:px-8 items-center justify-end w-full hidden sm:flex gap-2">
      {loading && (
        <ArrowPathIcon className="animate-spin h-5 w-5 text-gray-400" />
      )}
      <h2 className="text-sm leading-6 text-gray-500 font-semibold flex items-center gap-2">
        {filterDisplay && (
          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md flex items-center gap-1">
            {filterDisplay}
            <button
              onClick={clearFilter}
              className="hover:bg-blue-100 rounded p-0.5"
              title="Clear filter"
              type="button"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </span>
        )}
        Tracks:{' '}
        <span className="text-gray-600 font-bold font-mono">{trackCount}</span>
      </h2>
    </div>
  );
};

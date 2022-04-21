import { SearchIcon } from '@heroicons/react/outline';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { libraryActions } from '~/store/slices/library/library';
import { librarySelectors } from '~/store/slices/library/selectors';

export function TrackSearch() {
  const dispatch = useAppDispatch();
  const libraryFilter = useAppSelector(librarySelectors.selectLibraryFilter);
  const [localFilter, setLocalFilter] = useState(libraryFilter);
  const dSetFilter = useCallback(
    debounce((filter: string) => {
      dispatch(libraryActions.setLibraryFilter({ filter }));
    }, 300),
    [],
  );
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const value = e.target.value;

      setLocalFilter(value);
      dSetFilter(value);
    },
    [dSetFilter, setLocalFilter],
  );

  useEffect(() => {
    if (localFilter !== libraryFilter) {
      setLocalFilter(libraryFilter);
    }
  }, [libraryFilter]);

  return (
    <div className="flex-1 flex">
      <form className="w-full flex md:ml-0" action="#" method="GET">
        <label htmlFor="search_field" className="sr-only">
          Search library
        </label>
        <div className="relative w-full text-gray-400 focus-within:text-gray-600">
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5" />
          </div>
          <input
            id="search_field"
            name="search_field"
            className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent focus:placeholder-gray-400 sm:text-sm"
            placeholder="Search your library"
            type="search"
            value={localFilter}
            onChange={onChange}
          />
        </div>
      </form>
    </div>
  );
}

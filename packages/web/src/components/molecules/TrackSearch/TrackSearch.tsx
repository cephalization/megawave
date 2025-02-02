import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect } from 'react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useAppDispatch } from '~/hooks';
import { libraryActions } from '~/store/slices/library/library';

export function TrackSearch() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('q') || '';

  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchParams(
        (p) => {
          p.set('q', value);
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return (
    <div className="flex-1 flex">
      <form
        className="w-full flex md:ml-0"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch(libraryActions.setLibraryFilter({ search: filter }));
        }}
      >
        <label htmlFor="search_field" className="sr-only">
          Search library
        </label>
        <div className="relative w-full text-gray-400 focus-within:text-gray-600">
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </div>
          <input
            id="search_field"
            name="search_field"
            className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent focus:placeholder-gray-400 sm:text-sm"
            placeholder="Search your library"
            type="search"
            value={filter}
            onChange={onChange}
          />
        </div>
      </form>
    </div>
  );
}

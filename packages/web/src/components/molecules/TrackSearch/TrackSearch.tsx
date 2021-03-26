import debounce from 'lodash.debounce';
import React, { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { libraryActions, librarySelectors } from '~/store/slices/library';

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
  const onChange = useCallback(
    (e) => {
      const value = e.target.value;

      setLocalFilter(value);
      dSetFilter(value);
    },
    [dSetFilter, setLocalFilter],
  );

  return (
    <input
      id="search_field"
      name="search_field"
      className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent focus:placeholder-gray-400 sm:text-sm"
      placeholder="Search your library"
      type="search"
      value={localFilter}
      onChange={onChange}
    />
  );
}

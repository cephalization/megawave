import React, { useCallback, useContext, useState } from 'react';
import debounce from 'lodash.debounce';

import { PlayerContext } from '~/context/PlayerContext';

export function TrackSearch() {
  const { trackFilter, setTrackFilter } = useContext(PlayerContext);
  const [localFilter, setLocalFilter] = useState(trackFilter);
  const dSetFilter = useCallback(
    debounce((value: string) => {
      setTrackFilter(value);
    }, 300),
    [setTrackFilter],
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

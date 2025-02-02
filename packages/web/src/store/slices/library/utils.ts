import { EntityId } from '@reduxjs/toolkit';

import { Track } from '~/types/library';
import { stringSanitizer } from '~/utils/stringSanitizer';
import { getArrayString } from '~/utils/trackMeta';

import { LibraryState } from './library';

export function filterTracksByValue(
  filter: LibraryState['search'],
  tracks: Track[],
  trackIDs: EntityId[],
) {
  if (filter === '') return trackIDs;

  return tracks
    .filter((t) =>
      (['name', 'artist', 'album'] as (keyof Track)[]).some((p) =>
        stringSanitizer(
          // @ts-expect-error
          Array.isArray(t[p]) ? getArrayString(t?.[p]) : t[p],
        ).includes(stringSanitizer(filter)),
      ),
    )
    .map((t) => t.id);
}

/**
 * A filter key is a string that uniquely identifies a filter based on all
 * the filters currently applied.
 *
 * Combine all defined filters into a single string.
 */
export const makeFilterKey = (
  search: string,
  subkeyfilter: string,
  sort: string,
) => {
  return [search, subkeyfilter, sort].filter(Boolean).join('|');
};

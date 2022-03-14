import { EntityId } from '@reduxjs/toolkit';

import { Track } from '~/types/library';
import { stringSanitizer } from '~/utils/stringSanitizer';
import { getArrayString } from '~/utils/trackMeta';

import { LibraryState } from './library';

export function filterTracksByValue(
  filter: LibraryState['filter'],
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

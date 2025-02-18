import { createSelector, EntityId } from '@reduxjs/toolkit';

import { makeFilterKey } from '~/store/slices/library/utils';
import { RootState } from '~/store/store';
import { Track } from '~/types/library';

import { libraryAdapter } from './adapter';

const EMPTY_ARRAY: EntityId[] = [];

const {
  selectById: selectTrackById,
  selectIds: selectTrackIds,
  selectEntities: selectTrackEntities,
  selectAll: selectAllTracks,
  selectTotal: selectTotalTracks,
} = libraryAdapter.getSelectors<RootState>((state) => state.library);

const selectLibraryInitialized = (state: RootState) =>
  state.library.initialized;
const selectLibraryLoading = (state: RootState) => state.library.loading;
const selectLibrarySearch = (state: RootState) => state.library.search;
const selectLibrarySubkeyfilter = (state: RootState) =>
  state.library.subkeyfilter;
const selectLibrarySort = (state: RootState) => state.library.sort;
const selectLibraryQueue = (state: RootState) => state.library.queue;
const selectLibraryActiveTrackIndex = (state: RootState) =>
  state.library.activeTrackIndex;
const selectLibraryTracksByFilter = (state: RootState) =>
  state.library.tracksByFilter;
const selectLibraryHistory = (state: RootState) => state.library.history;
const selectLibraryScrollPositions = (state: RootState) =>
  state.library.scrollPositions;

const selectFilteredTrackIds = createSelector(
  selectLibrarySearch,
  selectLibrarySubkeyfilter,
  selectLibrarySort,
  selectLibraryTracksByFilter,
  selectTrackIds,
  (search, subkeyfilter, sort, trackIDsByFilter, trackIDs) => {
    const filterKey = makeFilterKey(search, subkeyfilter, sort);

    return trackIDsByFilter[filterKey] || EMPTY_ARRAY;
  },
);

const selectAlbumGroups = createSelector(
  selectFilteredTrackIds,
  selectTrackEntities,
  (trackIds, trackEntities) => {
    const albumGroups = new Map<
      string,
      {
        name: string;
        artist: string[];
        art: string[] | undefined;
        trackIds: EntityId[];
      }
    >();

    trackIds.forEach((id) => {
      const track = trackEntities[id];
      if (!track) return;

      const albumKey = track.album?.[0] || 'Unknown Album';
      const existingGroup = albumGroups.get(albumKey);
      const group = existingGroup || {
        name: albumKey,
        artist: track.artist || [],
        art: track.art || undefined,
        trackIds: [],
      };

      group.trackIds.push(id);
      if (!existingGroup) {
        albumGroups.set(albumKey, group);
      }
    });

    return Array.from(albumGroups.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  },
);

const selectFilteredTrackIdCount = createSelector(
  selectFilteredTrackIds,
  (filteredTrackIds) => filteredTrackIds?.length ?? 0,
);
const selectLibraryActiveTrackId = createSelector(
  selectLibraryActiveTrackIndex,
  selectLibraryQueue,
  (index, queue) =>
    index !== null ? (queue[index] as EntityId | undefined) : null,
);

const selectCurrentScrollPosition = createSelector(
  selectLibrarySearch,
  selectLibrarySubkeyfilter,
  selectLibrarySort,
  selectLibraryScrollPositions,
  (search, subkeyfilter, sort, scrollPositions) => {
    const filterKey = makeFilterKey(search, subkeyfilter, sort);

    return scrollPositions[filterKey] || 0;
  },
);

const selectLibraryFilterKey = createSelector(
  selectLibrarySearch,
  selectLibrarySubkeyfilter,
  selectLibrarySort,
  (search, subkeyfilter, sort) => makeFilterKey(search, subkeyfilter, sort),
);

export const librarySelectors = {
  // entity selectors
  selectTrackById,
  selectTrackIds,
  selectTrackEntities,
  selectAllTracks,
  selectTotalTracks,
  // normal selectors
  selectLibraryInitialized,
  selectLibraryLoading,
  selectLibrarySearch,
  selectLibrarySubkeyfilter,
  selectLibrarySort,
  selectLibraryQueue,
  selectLibraryActiveTrackIndex,
  selectLibraryTracksByFilter,
  selectLibraryHistory,
  selectLibraryScrollPositions,
  // memoized selectors
  selectFilteredTrackIds,
  selectLibraryActiveTrackId,
  selectFilteredTrackIdCount,
  selectCurrentScrollPosition,
  selectLibraryFilterKey,
  selectLibraryError: (state: RootState) => state.library.error,
  selectLibraryViewMode: (state: RootState) => state.library.viewMode,
  selectTracksByIds: (state: RootState, ids: EntityId[]) => {
    const entities = libraryAdapter
      .getSelectors()
      .selectEntities(state.library);
    return ids
      .map((id) => entities[id])
      .filter((track): track is Track => track != null);
  },
  selectSelectedTracks: (state: RootState) => state.library.selectedTracks,
  selectAlbumGroups,
};

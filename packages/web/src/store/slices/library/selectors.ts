import { createSelector, EntityId } from '@reduxjs/toolkit';

import { RootState } from '~/store';
import { makeFilterKey } from '~/store/slices/library/utils';

import { libraryAdapter } from './adapter';

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

    return trackIDsByFilter[filterKey] || [];
  },
);
const selectFilteredTrackIdCount = createSelector(
  selectFilteredTrackIds,
  (filteredTrackIds) => filteredTrackIds?.length ?? 0,
);
const selectLibraryActiveTrackId = createSelector(
  selectLibraryActiveTrackIndex,
  selectLibraryQueue,
  (index, queue) => (index !== null ? queue[index] : null),
);
const selectLibraryActiveTrack = createSelector(
  selectLibraryActiveTrackId,
  (state: RootState) => (id: EntityId) => selectTrackById(state, id),
  (trackId, tracksById) => {
    if (trackId === null) return null;

    const track = tracksById(trackId);

    if (!track) return null;

    return track;
  },
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
  selectLibraryActiveTrack,
  selectFilteredTrackIdCount,
  selectCurrentScrollPosition,
  selectLibraryFilterKey,
};

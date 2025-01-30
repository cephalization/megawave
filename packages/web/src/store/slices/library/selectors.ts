import { createSelector, EntityId } from '@reduxjs/toolkit';

import { RootState } from '~/store';

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
const selectLibraryFilter = (state: RootState) => state.library.filter;
const selectLibraryQueue = (state: RootState) => state.library.queue;
const selectLibraryActiveTrackIndex = (state: RootState) =>
  state.library.activeTrackIndex;
const selectLibraryTracksByFilter = (state: RootState) =>
  state.library.tracksByFilter;
const selectLibraryHistory = (state: RootState) => state.library.history;
const selectLibraryScrollPositions = (state: RootState) =>
  state.library.scrollPositions;

const selectFilteredTrackIds = createSelector(
  selectLibraryFilter,
  selectLibraryTracksByFilter,
  selectTrackIds,
  (filter, trackIDsByFilter, trackIDs) => {
    // Check for subkeyfilter first
    const subkeyfilterKey = Object.keys(trackIDsByFilter).find(
      (key) => key.startsWith('artist-') || key.startsWith('album-'),
    );
    if (subkeyfilterKey) {
      return trackIDsByFilter[subkeyfilterKey];
    }

    // Then check for regular filter
    if (filter && trackIDsByFilter[filter]) {
      return trackIDsByFilter[filter];
    }

    // If no filter active, return all tracks
    if (!filter) {
      return trackIDs;
    }

    // If filter is active but no matches found, return empty array
    return [];
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
  selectLibraryFilter,
  selectLibraryTracksByFilter,
  selectLibraryScrollPositions,
  (filter, tracksByFilter, scrollPositions) => {
    // Check for subkeyfilter first
    const subkeyfilterKey = Object.keys(tracksByFilter).find(
      (key) => key.startsWith('artist-') || key.startsWith('album-'),
    );
    // Use the appropriate key to get the scroll position
    const key = subkeyfilterKey || filter || '';
    return scrollPositions[key] || 0;
  },
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
  selectLibraryFilter,
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
};

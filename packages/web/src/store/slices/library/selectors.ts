import {
  createDraftSafeSelector,
  createSelector,
  EntityId,
} from '@reduxjs/toolkit';

import { RootState } from '~/store';

import { libraryAdapter } from './adapter';
import { filterTracksByValue } from './utils';

const {
  selectById: selectTrackById,
  selectIds: selectTrackIds,
  selectEntities: selectTrackEntities,
  selectAll: selectAllTracks,
  selectTotal: selectTotalTracks,
} = libraryAdapter.getSelectors<RootState>((state) => state.library);

const selectLibraryLoading = (state: RootState) => state.library.loading;
const selectLibraryFilter = (state: RootState) => state.library.filter;
const selectLibraryQueue = (state: RootState) => state.library.queue;
const selectLibraryActiveTrackIndex = (state: RootState) =>
  state.library.activeTrackIndex;

const selectFilteredTrackIds = createDraftSafeSelector(
  selectLibraryFilter,
  selectAllTracks,
  selectTrackIds,
  filterTracksByValue,
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

export const librarySelectors = {
  // entity selectors
  selectTrackById,
  selectTrackIds,
  selectTrackEntities,
  selectAllTracks,
  selectTotalTracks,
  // normal selectors
  selectLibraryLoading,
  selectLibraryFilter,
  selectLibraryQueue,
  selectLibraryActiveTrackIndex,
  // memoized selectors
  selectFilteredTrackIds,
  selectLibraryActiveTrackId,
  selectLibraryActiveTrack,
  selectFilteredTrackIdCount,
};

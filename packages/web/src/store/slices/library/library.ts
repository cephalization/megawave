import {
  createAsyncThunk,
  createDraftSafeSelector,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityId,
  SerializedError,
} from '@reduxjs/toolkit';

import { libraryApi } from '~/queries/library';
import { RootState } from '~/store/store';
import { Track } from '~/types/library';
import { stringSanitizer } from '~/utils/stringSanitizer';
import { getArrayString } from '~/utils/trackMeta';

import { playerActions } from '../player';

export const fetchLibrary = createAsyncThunk('/library/fetchAll', async () => {
  const tracks = await libraryApi.fetchAll();

  return tracks;
});

const libraryAdapter = createEntityAdapter<Track>();

export type LibraryState = {
  loading: boolean;
  error: SerializedError | null;
  filter: string;
  activeTrackIndex: number | null;
  queue: EntityId[];
  history: EntityId[];
};

const initialState = libraryAdapter.getInitialState<LibraryState>({
  loading: false,
  error: null,
  filter: '',
  // queue
  activeTrackIndex: null,
  queue: [],
  // history
  history: [],
});

function filterTracksByValue(
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

export const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setLibraryFilter(state, { payload: { filter } }) {
      if (typeof filter !== 'string') return state;

      state.filter = filter.toLocaleLowerCase();
    },
  },
  extraReducers: (builder) => {
    // library reducers
    builder.addCase(fetchLibrary.fulfilled, (state, { payload }) => {
      state.loading = false;
      libraryAdapter.upsertMany(state, payload);
    });
    builder.addCase(fetchLibrary.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchLibrary.rejected, (state, rejectedPayload) => {
      state.loading = false;
      state.error = rejectedPayload.error;
      console.error(rejectedPayload.error);
    });
    // player reducers
    builder.addCase(playerActions.play, (state, { payload }) => {
      const { trackId, requeue } = payload;

      // if there does not already exist a queue of tracks, create one
      if (!state.queue.length || requeue) {
        state.queue = filterTracksByValue(
          state.filter,
          libraryAdapter.getSelectors().selectAll(state),
          libraryAdapter.getSelectors().selectIds(state),
        );
      }

      if (trackId != null) {
        // if a track was provided, seek its position in the queue
        state.activeTrackIndex = state.queue.findIndex((id) => id === trackId);
      } else {
        // if a track was not provided, just start from the top of the queue
        state.activeTrackIndex = 0;
      }

      // add the track to the history if it is not the active track
      const activeTrackId = state.queue[state.activeTrackIndex];
      if (state.history[state.history.length - 1] !== activeTrackId) {
        state.history.push(activeTrackId);
      }
    });
    builder.addCase(playerActions.stop, (state) => {
      state.activeTrackIndex = null;
      state.queue = [];
    });
  },
});

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
  (state) => (id: EntityId) => selectTrackById(state, id),
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

export const libraryActions = librarySlice.actions;

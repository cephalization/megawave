import { createSlice, EntityId, SerializedError } from '@reduxjs/toolkit';

import { playerActions } from '../player';
import { libraryAdapter } from './adapter';
import { fetchLibrary } from './thunks';

export type LibraryState = {
  loading: boolean;
  initialized: boolean;
  error: SerializedError | null;
  filter: string;
  activeTrackIndex: number | null;
  queue: EntityId[];
  history: EntityId[];
  tracksByFilter: Record<string, EntityId[]>;
};

const initialState = libraryAdapter.getInitialState<LibraryState>({
  loading: false,
  initialized: false,
  error: null,
  filter: '',
  tracksByFilter: {},
  // queue
  activeTrackIndex: null,
  queue: [],
  // history
  history: [],
});

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
      state.initialized = true;
      libraryAdapter.upsertMany(state, payload.tracks);

      if (payload.filter) {
        state.tracksByFilter[payload.filter] = payload.tracks.map((t) => t.id);
      }
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
      const { trackId, requeue, trackContext } = payload;

      // if there does not already exist a queue of tracks, create one
      if (!state.queue.length || requeue) {
        state.queue = trackContext;
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

export const libraryActions = librarySlice.actions;

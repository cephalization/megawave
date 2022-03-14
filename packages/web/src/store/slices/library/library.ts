import { createSlice, EntityId, SerializedError } from '@reduxjs/toolkit';

import { playerActions } from '../player';
import { libraryAdapter } from './adapter';
import { fetchLibrary } from './thunks';
import { filterTracksByValue } from './utils';

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
      if (payload.filter) {
        libraryAdapter.setAll(state, payload.tracks);
      } else {
        libraryAdapter.upsertMany(state, payload.tracks);
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

export const libraryActions = librarySlice.actions;

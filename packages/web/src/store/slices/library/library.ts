import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  SerializedError,
} from '@reduxjs/toolkit';
import { libraryApi } from '~/queries/library';
import { RootState } from '~/store/store';
import { Track } from '~/types/library';
import { stringSanitizer } from '~/utils/stringSanitizer';

export const fetchLibrary = createAsyncThunk('/library/fetchAll', async () => {
  const tracks = await libraryApi.fetchAll();

  return tracks;
});

const libraryAdapter = createEntityAdapter<Track>();

type LibraryState = {
  loading: boolean;
  error: SerializedError | null;
  filter: string;
};

const initialState = libraryAdapter.getInitialState<LibraryState>({
  loading: false,
  error: null,
  filter: '',
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

const selectFilteredTrackIds = createSelector(
  selectLibraryFilter,
  selectAllTracks,
  selectTrackIds,
  (filter, tracks, trackIDs) => {
    if (filter === '') return trackIDs;

    return tracks
      .filter((t) =>
        (['name', 'artist', 'album'] as (keyof Track)[]).some((p) =>
          stringSanitizer(Array.isArray(t[p]) ? t?.[p]?.[0] : t[p]).includes(
            stringSanitizer(filter),
          ),
        ),
      )
      .map((t) => t.id);
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
  // memoized selectors
  selectFilteredTrackIds,
};

export const libraryActions = librarySlice.actions;

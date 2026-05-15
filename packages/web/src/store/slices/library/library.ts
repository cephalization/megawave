import { createSlice, EntityId, SerializedError } from '@reduxjs/toolkit';

import { makeFilterKey } from '~/store/slices/library/utils';
import type { Album, Artist } from '~/types/library';

import { playerActions } from '../player';
import { libraryAdapter } from './adapter';
import { fetchAlbums, fetchArtists, fetchLibrary } from './thunks';

export type LibraryState = {
  loading: boolean;
  initialized: boolean;
  error: SerializedError | null;
  search: string;
  subkeyfilter: string;
  albumId: number | null;
  artistId: number | null;
  sort: string;
  viewMode: 'tracks' | 'albums' | 'artists';
  albums: Album[];
  artists: Artist[];
  activeTrackIndex: number | null;
  queue: EntityId[];
  history: EntityId[];
  tracksByFilter: Record<string, EntityId[]>;
  scrollPositions: Record<string, number>; // Store scroll positions by filter key
  selectedTracks: EntityId[]; // Track selection state
};

const initialState = libraryAdapter.getInitialState<LibraryState>({
  loading: false,
  initialized: false,
  error: null,
  search: '',
  subkeyfilter: '',
  albumId: null,
  artistId: null,
  sort: '',
  viewMode: 'tracks', // Default to tracks view
  albums: [],
  artists: [],
  tracksByFilter: {},
  scrollPositions: {},
  // queue
  activeTrackIndex: null,
  queue: [],
  // history
  history: [],
  selectedTracks: [], // Initialize empty selection
});

export const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setLibraryFilter(
      state,
      {
        payload: { search, subkeyfilter, albumId, artistId, sort },
      }: {
        payload: {
          search?: string;
          subkeyfilter?: string;
          albumId?: number | null;
          artistId?: number | null;
          sort?: string;
        };
      },
    ) {
      state.search = search ?? state.search;
      state.subkeyfilter = subkeyfilter ?? state.subkeyfilter;
      state.albumId = albumId === undefined ? state.albumId : albumId;
      state.artistId = artistId === undefined ? state.artistId : artistId;
      state.sort = sort ?? state.sort;
    },
    setViewMode(
      state,
      { payload: viewMode }: { payload: 'tracks' | 'albums' | 'artists' },
    ) {
      state.viewMode = viewMode;
    },
    setScrollPosition(
      state,
      { payload: { position } }: { payload: { position: number } },
    ) {
      // Use empty string as key for unfiltered state
      const filterKey = makeFilterKey(
        state.search,
        state.subkeyfilter,
        state.albumId,
        state.artistId,
        state.sort,
      );
      state.scrollPositions[filterKey] = position;
    },
    setSelectedTracks(
      state,
      { payload: { trackIds } }: { payload: { trackIds: EntityId[] } },
    ) {
      state.selectedTracks = trackIds;
    },
    toggleTrackSelection(
      state,
      { payload: { trackId } }: { payload: { trackId: EntityId } },
    ) {
      const index = state.selectedTracks.indexOf(trackId);
      if (index === -1) {
        state.selectedTracks.push(trackId);
      } else {
        state.selectedTracks.splice(index, 1);
      }
    },
    clearTrackSelection(state) {
      state.selectedTracks = [];
    },
  },
  extraReducers: (builder) => {
    // library reducers
    builder.addCase(fetchLibrary.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.initialized = true;

      // Clear existing entities and replace with new sorted/filtered results
      libraryAdapter.upsertMany(state, payload.tracks);

      // Store filtered tracks in tracksByFilter using either filter or subkeyfilter as the key
      const filterKey = makeFilterKey(
        payload.search ?? '',
        payload.subkeyfilter ?? '',
        payload.albumId ?? null,
        payload.artistId ?? null,
        payload.sort ?? '',
      );
      state.tracksByFilter[filterKey] = payload.tracks.map((t) => t.id);
    });
    builder.addCase(fetchAlbums.fulfilled, (state, { payload }) => {
      state.albums = payload.albums;
    });
    builder.addCase(fetchArtists.fulfilled, (state, { payload }) => {
      state.artists = payload.artists;
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
      const { trackId, requeue, trackContext, addHistory = true } = payload;

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
      if (
        state.history[state.history.length - 1] !== activeTrackId &&
        addHistory
      ) {
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

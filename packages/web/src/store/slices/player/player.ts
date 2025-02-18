import {
  createAction,
  createAsyncThunk,
  createSlice,
  EntityId,
} from '@reduxjs/toolkit';

import { RootState } from '~/store/store';

import { librarySelectors } from '../library/selectors';

export const enum PLAYER_STATUS {
  PLAYING,
  PAUSED,
  STOPPED,
}

type PlayerState = {
  status: PLAYER_STATUS;
  seekTime: number;
  duration: number;
  volume: number;
};

const initialState: PlayerState = {
  status: PLAYER_STATUS.STOPPED,
  seekTime: 0,
  duration: 0,
  volume: 0.1,
};

type PlayerActionPayload = {
  // the current track context. required to generate a queue.
  trackContext: EntityId[];
  // the track to play. if not provided, the first track in the queue will be chosen
  trackId?: EntityId | null;
  // should the queue get rebuilt?
  requeue?: boolean;
  // should the current track be added to the history?
  addHistory?: boolean;
  // the index to requeue from
  requeueIndex?: number;
};

const sharedPlayerActions = {
  play: createAction<PlayerActionPayload>('player/play'),
  nextTrack: createAction('player/nextTrack'),
  prevTrack: createAction('player/prevTrack'),
  pause: createAction('player/pause'),
  stop: createAction('player/stop'),
};

export const playTrack = createAsyncThunk<
  EntityId[],
  Omit<PlayerActionPayload, 'trackContext'> & {
    context?: 'library' | 'history' | 'queue' | 'album';
  }
>(
  'player/play_thunk',
  async (
    { trackId, requeue, context = 'library', addHistory, requeueIndex },
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;

    // what was the user looking at when they hit play
    // the next and previous tracks will be determined by this
    let trackContext: EntityId[] = [];
    switch (context) {
      case 'library':
        trackContext =
          librarySelectors.selectFilteredTrackIds(state) ||
          librarySelectors.selectTrackIds(state);
        break;
      case 'history':
        trackContext = librarySelectors.selectLibraryHistory(state);
        if (trackId) {
          trackContext = trackContext.slice(
            requeueIndex != null ? requeueIndex : trackContext.indexOf(trackId),
          );
        }
        break;
      case 'queue':
        trackContext = librarySelectors.selectLibraryQueue(state);
        break;
      case 'album':
        // When playing from album view, find the album group and use its tracks
        const albums = librarySelectors.selectAlbumGroups(state);
        // TODO: this is a hack to get the album group. we should use add IDs to albums, and use that
        const album = albums.find((a) => a.trackIds.includes(trackId!));
        if (album) {
          trackContext = album.trackIds;
        }
        break;
    }

    dispatch(
      sharedPlayerActions.play({ trackId, requeue, trackContext, addHistory }),
    );

    return trackContext;
  },
);

export type PlayTrack = typeof playTrack;

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setSeekTime(state, { payload }) {
      if (isNaN(payload)) return;

      // this action is blacklisted redux devtools and will not appear there
      state.seekTime = payload;
    },
    setDuration(state, { payload }) {
      if (isNaN(payload)) return;

      state.duration = payload;
    },
    setVolume(state, { payload }) {
      if (isNaN(payload)) return;
      state.volume = Math.max(0, Math.min(1, payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sharedPlayerActions.play, (state) => {
        state.status = PLAYER_STATUS.PLAYING;
      })
      .addCase(sharedPlayerActions.pause, (state) => {
        state.status = PLAYER_STATUS.PAUSED;
      })
      .addCase(sharedPlayerActions.stop, (state) => {
        state.status = PLAYER_STATUS.STOPPED;
        state.seekTime = 0;
        state.duration = 0;
      });
  },
});

// Shared Actions
export const playerActions = {
  ...sharedPlayerActions,
  ...playerSlice.actions,
};

const selectPlayerStatus = (state: RootState) => state.player.status;
const selectPlayerSeekTime = (state: RootState) => state.player.seekTime;
const selectPlayerDuration = (state: RootState) => state.player.duration;
const selectPlayerVolume = (state: RootState) => state.player.volume;

export const playerSelectors = {
  selectPlayerStatus,
  selectPlayerSeekTime,
  selectPlayerDuration,
  selectPlayerVolume,
};

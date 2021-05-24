import { createAction, createSlice, EntityId } from '@reduxjs/toolkit';

import { RootState } from '~/store/store';

export const enum PLAYER_STATUS {
  PLAYING,
  PAUSED,
  STOPPED,
}

type PlayerState = {
  status: PLAYER_STATUS;
  seekTime: number;
  duration: number;
};

const initialState: PlayerState = {
  status: PLAYER_STATUS.STOPPED,
  seekTime: 0,
  duration: 0,
};

const sharedPlayerActions = {
  play: createAction<{ trackId?: EntityId | null; requeue?: boolean }>(
    'player/play',
  ),
  nextTrack: createAction('player/nextTrack'),
  prevTrack: createAction('player/prevTrack'),
  pause: createAction('player/pause'),
  stop: createAction('player/stop'),
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setSeekTime(state, { payload }) {
      state.seekTime = payload;
    },
    setDuration(state, { payload }) {
      state.duration = payload;
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

export const playerSelectors = {
  selectPlayerStatus,
  selectPlayerSeekTime,
  selectPlayerDuration,
};

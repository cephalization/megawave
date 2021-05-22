import { createAction, createSlice, EntityId } from '@reduxjs/toolkit';

import { RootState } from '~/store/store';

export const enum PLAYER_STATUS {
  PLAYING,
  PAUSED,
  STOPPED,
}

type PlayerState = {
  status: PLAYER_STATUS;
};

// Shared Actions
export const playerActions = {
  play: createAction<EntityId | null | undefined>('player/play'),
  nextTrack: createAction('player/nextTrack'),
  prevTrack: createAction('player/prevTrack'),
  pause: createAction('player/pause'),
  stop: createAction('player/stop'),
};

const initialState: PlayerState = {
  status: PLAYER_STATUS.STOPPED,
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(playerActions.play, (state) => {
        state.status = PLAYER_STATUS.PLAYING;
      })
      .addCase(playerActions.pause, (state) => {
        state.status = PLAYER_STATUS.PAUSED;
      })
      .addCase(playerActions.stop, (state) => {
        state.status = PLAYER_STATUS.STOPPED;
      });
  },
});

const selectPlayerStatus = (state: RootState) => state.player.status;

export const playerSelectors = {
  selectPlayerStatus,
};

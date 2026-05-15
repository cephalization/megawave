import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Track } from '~/types/library';

export const enum PLAYER_STATUS {
  PLAYING,
  PAUSED,
  STOPPED,
}

type PlayArgs = {
  trackId?: Track['id'] | null;
  queue?: Track[];
  requeue?: boolean;
  addHistory?: boolean;
};

type PlayerState = {
  status: PLAYER_STATUS;
  seekTime: number;
  duration: number;
  volume: number;
  currentTrackId: Track['id'] | null;
  queue: Track[];
  history: Track[];
  selectedTrackIds: Track['id'][];
  play: (args?: PlayArgs) => void;
  pause: () => void;
  stop: () => void;
  setSeekTime: (seekTime: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setSelectedTrackIds: (trackIds: Track['id'][]) => void;
  clearSelectedTrackIds: () => void;
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      status: PLAYER_STATUS.STOPPED,
      seekTime: 0,
      duration: 0,
      volume: 1,
      currentTrackId: null,
      queue: [],
      history: [],
      selectedTrackIds: [],
      play: ({ trackId, queue, requeue, addHistory = true } = {}) => {
        const currentQueue = get().queue;
        const nextQueue =
          queue && (requeue || currentQueue.length === 0)
            ? queue
            : currentQueue;
        const nextTrackId = trackId ?? nextQueue[0]?.id ?? null;
        const nextTrack =
          nextQueue.find((track) => track.id === nextTrackId) ?? null;

        set((state) => ({
          status: PLAYER_STATUS.PLAYING,
          queue: nextQueue,
          currentTrackId: nextTrackId,
          history:
            addHistory && nextTrack && state.history.at(-1)?.id !== nextTrack.id
              ? [...state.history, nextTrack]
              : state.history,
        }));
      },
      pause: () => set({ status: PLAYER_STATUS.PAUSED }),
      stop: () =>
        set({ status: PLAYER_STATUS.STOPPED, currentTrackId: null, queue: [] }),
      setSeekTime: (seekTime) => {
        if (!Number.isNaN(seekTime)) set({ seekTime });
      },
      setDuration: (duration) => {
        if (!Number.isNaN(duration)) set({ duration });
      },
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      setSelectedTrackIds: (trackIds) => set({ selectedTrackIds: trackIds }),
      clearSelectedTrackIds: () => set({ selectedTrackIds: [] }),
    }),
    {
      name: 'megawave-player',
      partialize: (state) => ({ volume: state.volume }),
    },
  ),
);

export const selectCurrentTrack = (state: PlayerState) =>
  state.queue.find((track) => track.id === state.currentTrackId) ??
  state.history.find((track) => track.id === state.currentTrackId) ??
  null;

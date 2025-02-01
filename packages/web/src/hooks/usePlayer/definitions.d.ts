import type { EntityId } from '@reduxjs/toolkit';

import type { PlayTrack } from '~/store/slices/player/player';

// functions bound to redux that are used to synchronize redux with the audio player
export type _Player = {
  _play: (...args: Parameters<PlayTrack>) => void;
  _pause: () => void;
  _stop: () => void;
  playNext: () => void;
  playPrev: () => void;
};

// functions and data bound to redux AND the audio player
type RegisteredPlayer = {
  play: (arg0?: EntityId | null) => void;
  pause: () => void;
  scrub: (percentage: number) => void;

  duration: number;
  track?: Track | null;
};

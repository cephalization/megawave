import type { Track } from '~/types/library';

export type _Player = {
  _play: (args?: { trackId?: Track['id'] | null }) => void;
  _pause: () => void;
  _stop: () => void;
  playNext: () => void;
  playPrev: () => void;
};

// functions and data bound to app state and the audio player
type RegisteredPlayer = {
  play: (arg0?: Track['id'] | null) => void;
  pause: () => void;
  scrub: (percentage: number) => void;

  duration: number;
  track?: Track | null;
};

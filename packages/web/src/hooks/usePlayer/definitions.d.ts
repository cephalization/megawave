// functions bound to redux that are used to synchronize redux with the audio player
export type _Player = {
  _play: (arg0?: EntityId | null) => void;
  _pause: () => void;
  _stop: () => void;
  playNext: () => void;
  playPrev: () => void;
};

// functions and data bound to redux AND the audio player
type RegisteredPlayer = {
  play: (arg0?: EntityId | null) => void;
  pause: () => void;
  scrub: (arg0: React.MouseEvent) => void;

  durationPercentage: number;
  seekTime: number;
  track?: Track | null;
};

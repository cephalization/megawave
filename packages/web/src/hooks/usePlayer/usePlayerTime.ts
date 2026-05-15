import { RefObject } from 'react';

import { usePlayerStore } from '~/store/playerStore';

export const usePlayerTime = (audioRef: RefObject<HTMLAudioElement | null>) => {
  const seekTime = usePlayerStore((state) => state.seekTime);
  const duration = usePlayerStore((state) => state.duration);
  const durationPercentage = isNaN(audioRef?.current?.duration ?? 0)
    ? 0
    : (seekTime / (audioRef?.current?.duration ?? 1)) * 100;

  return {
    durationPercentage,
    seekTime,
    duration,
  };
};

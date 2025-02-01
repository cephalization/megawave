import { RefObject } from 'react';

import { useAppSelector } from '~/hooks/useAppSelector';
import { playerSelectors } from '~/store/slices/player/player';

export const usePlayerTime = (audioRef: RefObject<HTMLAudioElement | null>) => {
  const seekTime = useAppSelector(playerSelectors.selectPlayerSeekTime);
  const duration = useAppSelector(playerSelectors.selectPlayerDuration);
  const durationPercentage = isNaN(audioRef?.current?.duration ?? 0)
    ? 0
    : (seekTime / (audioRef?.current?.duration ?? 1)) * 100;

  return {
    durationPercentage,
    seekTime,
    duration,
  };
};

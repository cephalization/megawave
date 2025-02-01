import React, { RefObject } from 'react';

import { ProgressBar } from '~/components/atoms/ProgressBar/ProgressBar';
import { usePlayerTime } from '~/hooks/usePlayer/usePlayerTime';
import { formatTime } from '~/utils/formatTime';

export const Seeker = ({
  audioRef,
  handleScrub,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  handleScrub: (percentage: number) => void;
}) => {
  const { durationPercentage, seekTime, duration } = usePlayerTime(audioRef);
  return (
    <div className="flex w-full items-center justify-center max-w-2xl gap-1">
      <div className="text-sm tabular-nums">{formatTime(seekTime)}</div>
      <ProgressBar onChange={handleScrub} percentage={durationPercentage} />
      <div className="text-sm tabular-nums">{formatTime(duration)}</div>
    </div>
  );
};

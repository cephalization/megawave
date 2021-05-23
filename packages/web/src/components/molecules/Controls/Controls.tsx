import React, { useRef } from 'react';

import { CurrentTrack } from '~/components/atoms/CurrentTrack/CurrentTrack';
import { NextButton } from '~/components/atoms/NextButton';
import { PlayPauseButton } from '~/components/atoms/PlayPauseButton/PlayPauseButton';
import { PrevButton } from '~/components/atoms/PrevButton';
import { ProgressBar } from '~/components/atoms/ProgressBar';
import { usePlayer } from '~/hooks/usePlayer';
import { PLAYER_STATUS } from '~/store/slices/player/player';

/**
 * From seconds, return '00:00:00' or '00:00' depending on the size
 *
 * @param seconds number of seconds to convert
 * @returns string formatted in common song length duration format
 */
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) {
    return '0:00';
  }
  if (seconds < 3600) {
    return new Date(seconds * 1000).toISOString().substr(14, 5);
  }

  return new Date(seconds * 1000).toISOString().substr(11, 8);
};

// VERY EXPENSIVE COMPONENT
// RE-RENDERS ONCE PER TRACK SECOND
export function Controls() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const {
    track,
    status,
    play: handlePlay,
    pause: handlePause,
    scrub: handleScrub,
    playNext: handleNext,
    playPrev: handlePrev,
    seekTime: currentTime,
    durationPercentage,
  } = usePlayer(audioRef, progressBarRef);
  const playing = status === PLAYER_STATUS.PLAYING;

  return (
    <div className="flex w-full justify-start bg-gray-100 dark:bg-gray-900 h-20  border-t border-gray-200 relative bottom-0 z-50 py-1">
      <div className="flex w-1/4">
        <CurrentTrack
          title={track?.name}
          album={track?.album}
          artist={track?.artist}
        />
      </div>
      <div className="flex w-2/4 flex-wrap">
        <audio
          ref={audioRef}
          title={`${track?.name} ${track?.artist ? `- ${track?.artist}` : ''}`}
        ></audio>
        <div className="text-gray-600 dark:text-white lg:rounded-b-xl px-1 sm:px-3 lg:px-1 xl:px-3 flex w-full justify-center items-center">
          <PrevButton onClick={handlePrev} />
          <PlayPauseButton
            playing={playing}
            onPause={handlePause}
            onPlay={handlePlay}
          />
          <NextButton onClick={handleNext} />
        </div>

        <div className="flex w-full items-center px-12">
          <div className="text-sm mr-1">{formatTime(currentTime)}</div>
          <ProgressBar
            ref={progressBarRef}
            onScrub={handleScrub}
            percentage={durationPercentage}
          />
          <div className="text-sm ml-1">
            {formatTime(audioRef?.current?.duration ?? 0)}
          </div>
        </div>
      </div>
    </div>
  );
}

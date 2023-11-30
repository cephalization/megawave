import { Bars3Icon } from '@heroicons/react/24/outline';
import React, { useRef, useState } from 'react';

import { CurrentTrack } from '~/components/atoms/CurrentTrack/CurrentTrack';
import { NextButton } from '~/components/atoms/NextButton';
import { PlayPauseButton } from '~/components/atoms/PlayPauseButton/PlayPauseButton';
import { PrevButton } from '~/components/atoms/PrevButton';
import { ProgressBar } from '~/components/atoms/ProgressBar';
import { usePlayer } from '~/hooks/usePlayer';
import { PLAYER_STATUS } from '~/store/slices/player/player';
import { formatTime } from '~/utils/formatTime';

import { PlayHistory } from '../PlayHistory';

// VERY EXPENSIVE COMPONENT
// RE-RENDERS ONCE PER TRACK SECOND
export function Controls() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    track,
    status,
    play: handlePlay,
    pause: handlePause,
    scrub: handleScrub,
    playNext: handleNext,
    playPrev: handlePrev,
    seekTime: currentTime,
    duration,
    durationPercentage,
  } = usePlayer(audioRef);
  const [open, setOpen] = useState(false);
  const playing = status === PLAYER_STATUS.PLAYING;

  return (
    <>
      <div className="grid grid-rows-2 w-full bg-gray-100 dark:bg-gray-900 h-20  border-t border-gray-200 relative bottom-0 z-50 py-1">
        <div className="flex basis-3/4 w-full justify-between">
          <div className="flex w-full justify-start pl-4 pr-1">
            <CurrentTrack
              title={track?.name}
              art={track?.art?.[0]}
              artist={track?.artist}
            />
          </div>
          <div className="flex w-full flex-shrink">
            <audio
              ref={audioRef}
              title={`${track?.name} ${
                track?.artist ? `- ${track?.artist}` : ''
              }`}
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
          </div>
          <div className="flex flex-shrink w-full justify-center items-center">
            <button
              className="sm:block mx-1 hover:text-gray-900"
              onClick={() => setOpen((o) => !o)}
            >
              <Bars3Icon height={24} />
            </button>
          </div>
        </div>
        <PlayHistory open={open} setOpen={setOpen} />
        <div className="flex w-full basis-1/4 items-center justify-center px-4">
          <div className="flex w-full items-center justify-center max-w-2xl gap-1">
            <div className="text-sm tabular-nums">
              {formatTime(currentTime)}
            </div>
            <ProgressBar
              onChange={handleScrub}
              percentage={durationPercentage}
            />
            <div className="text-sm tabular-nums">{formatTime(duration)}</div>
          </div>
        </div>
      </div>
    </>
  );
}

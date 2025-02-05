import { Bars3Icon } from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

import { CurrentTrack } from '~/components/atoms/CurrentTrack/CurrentTrack';
import { NextButton } from '~/components/atoms/NextButton';
import { PlayPauseButton } from '~/components/atoms/PlayPauseButton/PlayPauseButton';
import { PrevButton } from '~/components/atoms/PrevButton';
import { Seeker } from '~/components/molecules/Controls/Seeker';
import { PlayHistory } from '~/components/molecules/PlayHistory';
import { VolumeControl } from '~/components/molecules/VolumeControl';
import { usePlayer } from '~/hooks/usePlayer';
import { PLAYER_STATUS } from '~/store/slices/player/player';

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
    volume,
    setVolume,
  } = usePlayer(audioRef);
  const [open, setOpen] = useState(false);
  const playing = status === PLAYER_STATUS.PLAYING;

  return (
    <>
      <div className="grid grid-rows-2 w-full bg-card transition-colors text-card-foreground h-20 border-t border-border relative bottom-0 z-50 py-1 sm:px-2">
        <div className="flex basis-3/4 w-full justify-between gap-2 px-2 max-w-full overflow-hidden">
          <div className="flex w-full justify-start flex-shrink min-w-0">
            <CurrentTrack
              title={track?.name}
              art={track?.art?.[0]}
              artist={track?.artist}
              onScrollToTrack={
                track
                  ? () =>
                      window.dispatchEvent(
                        new CustomEvent('scrollToTrack', { detail: track.id }),
                      )
                  : undefined
              }
            />
          </div>
          <div className="flex w-full justify-center">
            <audio
              className="hidden"
              ref={audioRef}
              title={`${track?.name} ${
                track?.artist ? `- ${track?.artist}` : ''
              }`}
            ></audio>
            <div className="text-muted-foreground basis-2/3 lg:rounded-b-xl px-1 sm:px-3 lg:px-1 xl:px-3 flex w-full justify-center items-center">
              <PrevButton onClick={handlePrev} />
              <PlayPauseButton
                playing={playing}
                onPause={handlePause}
                onPlay={handlePlay}
              />
              <NextButton onClick={handleNext} />
            </div>
          </div>
          <div className="flex flex-shrink w-full justify-end items-center gap-4">
            <VolumeControl volume={volume} onChange={setVolume} />
            <button
              className="sm:block text-muted-foreground hover:text-foreground"
              onClick={() => setOpen((o) => !o)}
            >
              <Bars3Icon height={24} />
            </button>
          </div>
        </div>
        <PlayHistory open={open} setOpen={setOpen} />
        <div className="flex w-full basis-1/4 items-center justify-center px-4">
          <Seeker audioRef={audioRef} handleScrub={handleScrub} />
        </div>
      </div>
    </>
  );
}

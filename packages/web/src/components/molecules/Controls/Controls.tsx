import React, { useRef } from 'react';

import { usePlayer } from '~/hooks/usePlayer';
import { PLAYER_STATUS } from '~/store/slices/player/player';

const iconSizeScalar = 1.6;

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
    currentTime,
    durationPercentage,
  } = usePlayer(audioRef, progressBarRef);
  const playing = status === PLAYER_STATUS.PLAYING;

  return (
    <div className="flex w-full flex-wrap bg-gray-100 dark:bg-gray-900 h-20  border-t border-gray-200 relative bottom-0 z-50 py-1">
      <audio
        ref={audioRef}
        title={`${track?.name} ${track?.artist ? `- ${track?.artist}` : ''}`}
      ></audio>
      <div className="text-gray-600 dark:text-white lg:rounded-b-xl px-1 sm:px-3 lg:px-1 xl:px-3 flex w-full justify-center items-center">
        {/* Prev button */}
        <button
          type="button"
          className="hidden sm:block mx-1  hover:text-gray-900"
          onClick={handlePrev}
        >
          <svg
            width={8 * iconSizeScalar}
            height={9 * iconSizeScalar}
            viewBox="0 0 17 18"
          >
            <path d="M0 0h2v18H0V0zM4 9l13-9v18L4 9z" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className="mx-8 hover:text-gray-900"
          onClick={playing ? () => handlePause() : () => handlePlay()}
        >
          {playing ? (
            // pause button
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              height={25 * iconSizeScalar}
              width={25 * iconSizeScalar}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            // play button
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              height={25 * iconSizeScalar}
              stroke="currentColor"
              width={25 * iconSizeScalar}
            >
              {/* arrow */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              {/* circle */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </button>
        {/* Next Button */}
        <button
          type="button"
          className="hidden sm:block mx-1  hover:text-gray-900"
          onClick={handleNext}
        >
          <svg
            width={8 * iconSizeScalar}
            height={9 * iconSizeScalar}
            viewBox="0 0 17 18"
            fill="none"
          >
            <path d="M17 0H15V18H17V0Z" fill="currentColor" />
            <path d="M13 9L0 0V18L13 9Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="flex w-full items-center px-12">
        <div className="text-sm mr-1">{formatTime(currentTime)}</div>
        <div
          className="w-full bg-gray-300 dark:bg-black rounded-full overflow-hidden h-1/6"
          onClick={handleScrub}
          ref={progressBarRef}
        >
          <div
            className="bg-gray-400 dark:bg-lime-400 h-full"
            role="progressbar"
            aria-valuenow={1456}
            aria-valuemin={0}
            aria-valuemax={4550}
            style={{
              width: `${isNaN(durationPercentage) ? 0 : durationPercentage}%`,
            }}
          />
        </div>
        <div className="text-sm ml-1">
          {formatTime(audioRef?.current?.duration ?? 0)}
        </div>
      </div>
    </div>
  );
}

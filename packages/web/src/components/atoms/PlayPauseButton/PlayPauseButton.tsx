import React from 'react';

import { ICON_SIZE_SCALAR } from '~/constants/controls';

type PlayPauseButtonProps = {
  onPlay?: () => void;
  onPause?: () => void;
  playing?: boolean;
};

export const PlayPauseButton = ({
  playing = false,
  onPlay,
  onPause,
}: PlayPauseButtonProps) => {
  return (
    <button
      type="button"
      className="mx-8 hover:text-gray-900"
      onClick={playing ? () => onPause?.() : () => onPlay?.()}
    >
      {playing ? (
        // pause button
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          height={25 * ICON_SIZE_SCALAR}
          width={25 * ICON_SIZE_SCALAR}
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
          height={25 * ICON_SIZE_SCALAR}
          stroke="currentColor"
          width={25 * ICON_SIZE_SCALAR}
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
  );
};

import React, { useContext } from 'react';

import { PlayerContext } from '~/context/PlayerContext';

export function Controls() {
  const { track } = useContext(PlayerContext);

  return (
    <div className="bg-gray-100 h-20 flex-grow-0 border-t border-gray-200 w-screen relative bottom-0 z-50">
      <div className="flex h-full items-center pl-5 sm:pl-6 lg:pl-8">
        <div
          style={{ minWidth: '15%' }}
          className="flex-grow-0 justify-self-start flex-col text-gray-900 font-bold"
        >
          {track ? (
            <>
              <p>{track.name}</p>
              <p className="text-gray-500">{track.artist}</p>
            </>
          ) : null}
        </div>
        <audio
          className="flex-grow justify-self-center"
          src={track?.link}
          controls
          autoPlay
        />
        <div
          className="flex-grow justify-self-end"
          style={{ minWidth: '15%' }}
        ></div>
      </div>
    </div>
  );
}

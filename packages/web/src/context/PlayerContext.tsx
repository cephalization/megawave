import React, { useState } from 'react';

import { Track } from '~/types/library';

export const PlayerContext = React.createContext<{
  track: Track | null;
  trackFilter: string;
  setTrack: (track: Track | null) => void;
  setTrackFilter: (trackFilter: string) => void;
}>({
  track: null,
  trackFilter: '',
  setTrack: () => {},
  setTrackFilter: () => {},
});

export const PlayerProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [trackFilter, setTrackFilter] = useState('');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  return (
    <PlayerContext.Provider
      value={{
        track: currentTrack,
        setTrack: setCurrentTrack,
        setTrackFilter,
        trackFilter,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

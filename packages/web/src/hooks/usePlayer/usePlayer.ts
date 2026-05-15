import React, { Ref, RefObject, useCallback, useMemo } from 'react';

import { useCurrentTrack } from '~/hooks/useCurrentTrack';
import { PLAYER_STATUS, usePlayerStore } from '~/store/playerStore';

import { _Player } from './definitions';
import { useRegisteredAudioComponent } from './useRegisteredAudioComponent';

const handleVolume = (
  audioRef: RefObject<HTMLAudioElement | null>,
  newVolume: number,
) => {
  if (audioRef.current) {
    audioRef.current.volume = newVolume;
  }
};

export const usePlayer = (audioRef: RefObject<HTMLAudioElement | null>) => {
  const queue = usePlayerStore((state) => state.queue);
  const currentTrackId = usePlayerStore((state) => state.currentTrackId);
  const status = usePlayerStore((state) => state.status);
  const track = useCurrentTrack();
  const volume = usePlayerStore((state) => state.volume);
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const stop = usePlayerStore((state) => state.stop);
  const updateVolume = usePlayerStore((state) => state.setVolume);

  const activeTrackIndex =
    currentTrackId == null
      ? -1
      : queue.findIndex((queuedTrack) => queuedTrack.id === currentTrackId);

  const prevTrackId =
    activeTrackIndex > 0 ? queue[activeTrackIndex - 1]?.id : null;
  const nextTrackId =
    activeTrackIndex >= 0 ? queue[activeTrackIndex + 1]?.id : null;

  // Create internal player handlers
  const _play = useCallback<_Player['_play']>(
    (arg) => {
      play(arg);
    },
    [play],
  );
  const _pause = useCallback<_Player['_stop']>(() => {
    pause();
  }, [pause]);
  const _stop = useCallback<_Player['_stop']>(() => {
    stop();
  }, [stop]);

  const setVolume = useCallback(
    (newVolume: number) => {
      if (audioRef.current) {
        handleVolume(audioRef, newVolume);
      }
      updateVolume(newVolume);
    },
    [audioRef, updateVolume],
  );

  // Create external player handlers
  const playNext = useCallback<_Player['playNext']>(() => {
    if (nextTrackId) {
      play({ trackId: nextTrackId });
    } else {
      stop();
    }
  }, [nextTrackId, play, stop]);
  const playPrev = useCallback<_Player['playPrev']>(() => {
    if (prevTrackId) {
      play({ trackId: prevTrackId });
    } else {
      stop();
    }
  }, [prevTrackId, play, stop]);

  // Prep handlers for consumption by audio ref
  const _player: _Player = useMemo(
    () => ({
      _play,
      _pause,
      _stop,
      playNext,
      playPrev,
    }),
    [_pause, _play, _stop, playNext, playPrev],
  );

  // Bind player handlers to audio ref event handlers
  const registeredPlayer = useRegisteredAudioComponent(audioRef, _player);

  return {
    ...registeredPlayer,
    status,
    playNext,
    playPrev,
    track,
    volume,
    setVolume,
  };
};

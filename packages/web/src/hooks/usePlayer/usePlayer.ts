import React, { Ref, RefObject, useCallback } from 'react';

import { useAppDispatch } from '~/hooks/useAppDispatch';
import { useAppSelector } from '~/hooks/useAppSelector';
import { useCurrentTrack } from '~/hooks/useCurrentTrack';
import { playerActions } from '~/store/slices';
import { librarySelectors } from '~/store/slices/library/selectors';
import { playerSelectors, playTrack } from '~/store/slices/player/player';

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
  const dispatch = useAppDispatch();
  const queue = useAppSelector(librarySelectors.selectLibraryQueue);
  const activeTrackIndex = useAppSelector(
    librarySelectors.selectLibraryActiveTrackIndex,
  );
  const status = useAppSelector(playerSelectors.selectPlayerStatus);
  const track = useCurrentTrack();
  const volume = useAppSelector(playerSelectors.selectPlayerVolume);

  const prevTrackId =
    activeTrackIndex !== null ? queue[activeTrackIndex - 1] : null;
  const nextTrackId =
    activeTrackIndex !== null ? queue[activeTrackIndex + 1] : null;

  // Create internal handlers into redux
  const _play = useCallback<_Player['_play']>(
    (arg) => {
      dispatch(playTrack(arg));
    },
    [dispatch],
  );
  const _pause = useCallback<_Player['_stop']>(() => {
    dispatch(playerActions.pause());
  }, [dispatch]);
  const _stop = useCallback<_Player['_stop']>(() => {
    dispatch(playerActions.stop());
  }, [dispatch]);

  const setVolume = useCallback(
    (newVolume: number) => {
      if (audioRef.current) {
        handleVolume(audioRef, newVolume);
      }
      dispatch(playerActions.setVolume(newVolume));
    },
    [dispatch, audioRef],
  );

  // create external handlers into redux
  const playNext = useCallback<_Player['playNext']>(() => {
    if (nextTrackId) {
      dispatch(playTrack({ trackId: nextTrackId }));
    } else {
      dispatch(playerActions.stop());
    }
  }, [dispatch, nextTrackId]);
  // TODO:
  // You were trying to fix forward/back buttons
  // The issue is that you want to requeue from history[last] + queue when you hit back
  // but when you do that, it doesn't work due to assumptions made in the library slice handling of playTrack
  const playPrev = useCallback<_Player['playPrev']>(() => {
    if (prevTrackId) {
      dispatch(
        playTrack({
          trackId: prevTrackId,
          requeueIndex: activeTrackIndex ?? undefined,
        }),
      );
    } else {
      dispatch(playerActions.stop());
    }
  }, [dispatch, prevTrackId, activeTrackIndex]);

  // prep handlers into redux for consumption by audio ref
  const _player: _Player = {
    _play,
    _pause,
    _stop,
    playNext,
    playPrev,
  };

  // bind redux handlers to audio ref event handlers
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

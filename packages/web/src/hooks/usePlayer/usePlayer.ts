import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '~/hooks/useAppSelector';
import { playerActions } from '~/store/slices';
import { librarySelectors } from '~/store/slices/library';
import { playerSelectors } from '~/store/slices/player/player';

import { _Player } from './definitions';
import { useRegisteredAudioComponent } from './useRegisteredAudioComponent';

export const usePlayer = (
  audioRef: React.RefObject<HTMLAudioElement>,
  progressBarRef: React.RefObject<HTMLDivElement>,
) => {
  const dispatch = useDispatch();
  const queue = useAppSelector(librarySelectors.selectLibraryQueue);
  const activeTrackIndex = useAppSelector(
    librarySelectors.selectLibraryActiveTrackIndex,
  );
  const status = useAppSelector(playerSelectors.selectPlayerStatus);
  const track = useAppSelector(librarySelectors.selectLibraryActiveTrack);

  const prevTrackId =
    activeTrackIndex !== null ? queue[activeTrackIndex - 1] : null;
  const nextTrackId =
    activeTrackIndex !== null ? queue[activeTrackIndex + 1] : null;

  // Create internal handlers into redux
  const _play = useCallback<_Player['_play']>(
    (...args) => {
      dispatch(playerActions.play(...args));
    },
    [dispatch],
  );
  const _pause = useCallback<_Player['_stop']>(() => {
    dispatch(playerActions.pause());
  }, [dispatch]);
  const _stop = useCallback<_Player['_stop']>(() => {
    dispatch(playerActions.stop());
  }, [dispatch]);
  // create external handlers into redux
  const playNext = useCallback<_Player['playNext']>(() => {
    if (nextTrackId) {
      dispatch(playerActions.play({ trackId: nextTrackId }));
    } else {
      dispatch(playerActions.stop());
    }
  }, [dispatch, nextTrackId]);
  const playPrev = useCallback<_Player['playPrev']>(() => {
    if (prevTrackId) {
      dispatch(playerActions.play({ trackId: prevTrackId }));
    } else {
      dispatch(playerActions.stop());
    }
  }, [dispatch, prevTrackId]);

  // prep handlers into redux for consumption by audio ref
  const _player: _Player = {
    _play,
    _pause,
    _stop,
    playNext,
    playPrev,
  };

  // bind redux handlers to audio ref event handlers
  const registeredPlayer = useRegisteredAudioComponent(
    audioRef,
    progressBarRef,
    _player,
  );

  return { ...registeredPlayer, status, playNext, playPrev, track };
};

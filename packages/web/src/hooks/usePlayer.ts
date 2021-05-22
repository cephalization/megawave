import { EntityId } from '@reduxjs/toolkit';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { playerActions } from '~/store/slices';
import { librarySelectors } from '~/store/slices/library';

import { useAppSelector } from './useAppSelector';

type _Player = {
  play: (arg0?: EntityId | null) => void;
  pause: () => void;
  stop: () => void;
  playNext: () => void;
  playPrev: () => void;

  prevTrackId: EntityId | null;
  nextTrackId: EntityId | null;
  activeTrackId: EntityId | null;
};

type RegisteredPlayer = {
  play: (arg0?: EntityId | null) => void;
  pause: () => void;
  scrub: (arg0: React.MouseEvent) => void;
};

const useRegisteredAudioComponent = (
  audioRef: React.RefObject<HTMLAudioElement>,
  progressBarRef: React.RefObject<HTMLDivElement>,
  player: _Player,
) => {
  const { activeTrackId, nextTrackId } = player;
  const track = useAppSelector((state) =>
    activeTrackId !== null
      ? librarySelectors.selectTrackById(state, activeTrackId)
      : null,
  );
  const [currentTime, setCurrentTime] = useState(0);

  const durationPercentage =
    (currentTime / (audioRef?.current?.duration ?? 0)) * 100;

  const handleScrub: RegisteredPlayer['scrub'] = (e) => {
    if (audioRef?.current !== null && progressBarRef?.current !== null) {
      const audio = audioRef?.current;
      const progressBar = progressBarRef?.current;
      const sideNavWidth =
        document.getElementById('side-nav')?.offsetWidth ?? 0;

      const clickPosition =
        (e.pageX - progressBar.offsetLeft - sideNavWidth) /
        progressBar.offsetWidth;
      const clickTime = clickPosition * audio.duration;

      setCurrentTime(clickTime);
      audio.currentTime = clickTime;
    }
  };

  const handlePause = () => {
    if (audioRef?.current !== null) {
      const audio = audioRef.current;

      audio.pause();
      player.pause();
    }
  };

  const handlePlay = () => {
    if (audioRef?.current !== null) {
      const audio = audioRef?.current;

      if (audio.getAttribute('src') !== '' && audio.paused) {
        audio.play();
        player.play();
      }
    }
  };

  // register new audio element handlers when track changes
  useEffect(() => {
    if (track != null) {
      const handleCurrentTimeChange = () => {
        if (audioRef?.current !== null) {
          const audio = audioRef.current;

          setCurrentTime(audio.currentTime);
        }
      };

      const handleCanPlay = () => {
        if (audioRef?.current !== null) {
          const audio = audioRef.current;

          audio.play();
          player.play(activeTrackId);
        }
      };

      const handleTrackEnd = () => {
        if (audioRef?.current !== null) {
          nextTrackId != null ? player.playNext() : player.stop();
        }
      };

      // const handlerEvents = [];
      const addEventToAudio = (eventTuple: [string, EventListener]) => {
        if (audioRef?.current !== null) {
          // handlerEvents.push(eventTuple);
          audioRef.current.addEventListener(...eventTuple);
        }
      };

      if (audioRef?.current !== null && track?.link) {
        const audio = audioRef.current;

        audio.setAttribute('src', track.link);
        const canplayEventArgs: [string, EventListener] = [
          'canplay',
          handleCanPlay,
        ];
        const timeupdateEventArgs: [string, EventListener] = [
          'timeupdate',
          handleCurrentTimeChange,
        ];
        const endedEventArgs: [string, EventListener] = [
          'ended',
          handleTrackEnd,
        ];
        addEventToAudio(canplayEventArgs);
        addEventToAudio(timeupdateEventArgs);
        addEventToAudio(endedEventArgs);
        audio.load();
      } else if (audioRef?.current !== null && !track?.link) {
        const audio = audioRef.current;

        audio.setAttribute('src', '');
        audio.load();
      }
    }
  }, [track]);

  return {
    play: handlePlay,
    pause: handlePause,
    scrub: handleScrub,
    durationPercentage,
  };
};

export const usePlayer = (
  audioRef: React.RefObject<HTMLAudioElement>,
  progressBarRef: React.RefObject<HTMLDivElement>,
): RegisteredPlayer => {
  const dispatch = useDispatch();
  const queue = useAppSelector(librarySelectors.selectLibraryQueue);
  const activeTrackId = useAppSelector(
    librarySelectors.selectLibraryActiveTrack,
  );

  const prevTrackId = activeTrackId !== null ? queue[activeTrackId - 1] : null;
  const nextTrackId = activeTrackId !== null ? queue[activeTrackId + 1] : null;

  // Create handlers into redux
  const play = useCallback<_Player['play']>(
    (trackId) => {
      dispatch(playerActions.play(trackId));
    },
    [dispatch],
  );

  const pause = useCallback<_Player['stop']>(() => {
    dispatch(playerActions.pause());
  }, [dispatch]);

  const stop = useCallback<_Player['stop']>(() => {
    dispatch(playerActions.stop());
  }, [dispatch]);

  const playNext = useCallback<_Player['playNext']>(() => {
    if (nextTrackId) {
      dispatch(playerActions.play(nextTrackId));
    } else {
      dispatch(playerActions.stop());
    }
  }, [dispatch, nextTrackId]);

  const playPrev = useCallback<_Player['playPrev']>(() => {
    if (prevTrackId) {
      dispatch(playerActions.play(prevTrackId));
    } else {
      dispatch(playerActions.stop());
    }
  }, [dispatch, prevTrackId]);

  const _player: _Player = {
    play,
    pause,
    stop,
    playNext,
    playPrev,

    nextTrackId,
    prevTrackId,
    activeTrackId,
  };

  const registeredPlayer = useRegisteredAudioComponent(
    audioRef,
    progressBarRef,
    _player,
  );

  return registeredPlayer;
};

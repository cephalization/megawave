import { bindActionCreators } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { librarySelectors } from '~/store/slices/library/selectors';
import { playerActions, playerSelectors } from '~/store/slices/player/player';

import { useAppSelector } from '../useAppSelector';
import { RegisteredPlayer, _Player } from './definitions';

export const useRegisteredAudioComponent = (
  audioRef: React.RefObject<HTMLAudioElement>,
  _player: _Player,
): RegisteredPlayer => {
  const dispatch = useDispatch();
  const activeTrackId = useAppSelector(
    librarySelectors.selectLibraryActiveTrackId,
  );
  const track = useAppSelector(librarySelectors.selectLibraryActiveTrack);
  const seekTime = useAppSelector(playerSelectors.selectPlayerSeekTime);
  const duration = useAppSelector(playerSelectors.selectPlayerDuration);
  const setSeekTime = bindActionCreators(playerActions.setSeekTime, dispatch);
  const setDuration = bindActionCreators(playerActions.setDuration, dispatch);
  const trackLink = track?.link ?? null;

  const durationPercentage =
    isNaN(audioRef?.current?.duration ?? 0) ? 0 : Math.floor((seekTime / (audioRef?.current?.duration ?? 1)) * 100);

  const handleScrub: RegisteredPlayer['scrub'] = (e) => {
    if (audioRef?.current !== null) {
      const audio = audioRef?.current;
      if (audio.duration) {
        const progress = e / 100;
        const clickTime = Math.floor(progress * audio.duration);
  
        setSeekTime(clickTime);
        audio.currentTime = clickTime;
      }
    }
  };

  const handlePause = () => {
    if (audioRef?.current !== null) {
      const audio = audioRef.current;

      audio.pause();
      _player._pause();
    }
  };

  const handlePlay = () => {
    if (audioRef?.current !== null) {
      const audio = audioRef?.current;

      _player._play({ trackId: activeTrackId });

      if (audio.paused && activeTrackId != null) {
        audio.play();
      }
    }
  };

  // register new audio element handlers when track changes
  useEffect(() => {
    if (trackLink != null) {
      const handleCurrentTimeChange = () => {
        if (audioRef?.current !== null) {
          const audio = audioRef.current;

          setSeekTime(audio.currentTime);
        }
      };

      const handleCanPlay = async () => {
        if (audioRef?.current !== null) {
          const audio = audioRef.current;

          audio.play();
        }
      };

      const handlePlay = async () => {
        if (audioRef?.current !== null) {
          const audio = audioRef.current;

          if (audio.paused) {
            audio.play();
          }
        }
      };

      const handleTrackEnd = () => {
        if (audioRef?.current !== null) {
          _player.playNext();
        }
      };

      const handleDurationChange = () => {
        if (audioRef?.current !== null) {
          setDuration(audioRef.current.duration);
        }
      };

      const addEventToAudio = (eventTuple: [string, EventListener]) => {
        if (audioRef?.current !== null) {
          audioRef.current.addEventListener(...eventTuple);
        }
      };

      if (audioRef?.current !== null && trackLink) {
        const audio = audioRef.current;

        audio.setAttribute('src', trackLink);
        const canplayEventArgs: [string, EventListener] = [
          'canplay',
          handleCanPlay,
        ];
        const playEventArgs: [string, EventListener] = [
          'play',
          handlePlay,
        ];
        const timeupdateEventArgs: [string, EventListener] = [
          'timeupdate',
          handleCurrentTimeChange,
        ];
        const endedEventArgs: [string, EventListener] = [
          'ended',
          handleTrackEnd,
        ];
        const durationChangeEventArgs: [string, EventListener] = [
          'durationchange',
          handleDurationChange,
        ];
        const pauseEventArgs: [string, EventListener] = [
          'pause',
          handlePause,
        ]
        addEventToAudio(canplayEventArgs);
        addEventToAudio(timeupdateEventArgs);
        addEventToAudio(endedEventArgs);
        addEventToAudio(durationChangeEventArgs);
        addEventToAudio(pauseEventArgs);
        addEventToAudio(playEventArgs);
        audio.load();
      }
    } else if (audioRef?.current != null) {
      console.log('no track');
      const audio = audioRef.current;

      audio.setAttribute('src', '');
      audio.load();
    }
  }, [trackLink]);

  return {
    play: handlePlay,
    pause: handlePause,
    scrub: handleScrub,
    duration,
    durationPercentage,
    seekTime,
  };
};

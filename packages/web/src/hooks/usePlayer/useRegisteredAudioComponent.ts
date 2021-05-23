import { bindActionCreators } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { librarySelectors } from '~/store/slices/library';
import { playerActions, playerSelectors } from '~/store/slices/player/player';

import { useAppSelector } from '../useAppSelector';
import { RegisteredPlayer, _Player } from './definitions';

export const useRegisteredAudioComponent = (
  audioRef: React.RefObject<HTMLAudioElement>,
  progressBarRef: React.RefObject<HTMLDivElement>,
  _player: _Player,
): RegisteredPlayer => {
  const dispatch = useDispatch();
  const activeTrackId = useAppSelector(
    librarySelectors.selectLibraryActiveTrackId,
  );
  const track = useAppSelector(librarySelectors.selectLibraryActiveTrack);
  const seekTime = useAppSelector(playerSelectors.selectPlayerSeekTime);
  const setSeekTime = bindActionCreators(playerActions.setSeekTime, dispatch);

  const durationPercentage =
    (seekTime / (audioRef?.current?.duration ?? 0)) * 100;

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

      setSeekTime(clickTime);
      audio.currentTime = clickTime;
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

      if (audio.getAttribute('src') !== '' && audio.paused) {
        audio.play();
        _player._play(activeTrackId);
      }
    }
  };

  // register new audio element handlers when track changes
  useEffect(() => {
    if (track != null) {
      console.log(track.id);
      const handleCurrentTimeChange = () => {
        if (audioRef?.current !== null) {
          const audio = audioRef.current;

          setSeekTime(audio.currentTime);
        }
      };

      const handleCanPlay = async () => {
        console.log('canplay');
        if (audioRef?.current !== null) {
          const audio = audioRef.current;

          audio.play();
        }
      };

      const handleTrackEnd = () => {
        if (audioRef?.current !== null) {
          _player.playNext();
        }
      };

      const addEventToAudio = (eventTuple: [string, EventListener]) => {
        if (audioRef?.current !== null) {
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
    seekTime,
    track,
  };
};

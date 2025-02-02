import { bindActionCreators } from '@reduxjs/toolkit';
import { RefObject, useEffect } from 'react';

import { useAppDispatch } from '~/hooks/useAppDispatch';
import { useCurrentTrack } from '~/hooks/useCurrentTrack';
import { librarySelectors } from '~/store/slices/library/selectors';
import { playerActions, playerSelectors } from '~/store/slices/player/player';
import { getArrayString } from '~/utils/trackMeta';

import { useAppSelector } from '../useAppSelector';
import { RegisteredPlayer, _Player } from './definitions';

const updateVolume = (
  audioRef: RefObject<HTMLAudioElement | null>,
  volume: number,
) => {
  if (audioRef?.current) {
    audioRef.current.volume = volume;
  }
};

const scrub = (audioRef: RefObject<HTMLAudioElement | null>, e: number) => {
  if (audioRef?.current) {
    audioRef.current.currentTime = e;
  }
};
export const useRegisteredAudioComponent = (
  audioRef: RefObject<HTMLAudioElement | null>,
  _player: _Player,
): RegisteredPlayer => {
  const dispatch = useAppDispatch();
  const activeTrackId = useAppSelector(
    librarySelectors.selectLibraryActiveTrackId,
  );
  const track = useCurrentTrack();
  const duration = useAppSelector(playerSelectors.selectPlayerDuration);
  const volume = useAppSelector(playerSelectors.selectPlayerVolume);
  const setSeekTime = bindActionCreators(playerActions.setSeekTime, dispatch);
  const setDuration = bindActionCreators(playerActions.setDuration, dispatch);
  const trackLink = track?.link ?? null;

  // Initialize volume when audio element is created
  useEffect(() => {
    updateVolume(audioRef, volume);
  }, [audioRef, volume]);

  const handleScrub: RegisteredPlayer['scrub'] = (e) => {
    if (audioRef?.current !== null) {
      const audio = audioRef?.current;
      if (audio.duration) {
        const progress = e / 100;
        const clickTime = Math.floor(progress * audio.duration);

        setSeekTime(clickTime);
        scrub(audioRef, clickTime);
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

  const updateMediaSession = () => {
    if ('mediaSession' in navigator) {
      const title = track?.name;
      const artist = track?.artist ? getArrayString(track?.artist) : undefined;
      const album = track?.album ? getArrayString(track?.album) : undefined;
      const artwork = track?.art?.[0]
        ? [
            {
              src: track?.art?.[0],
              sizes: '512x512',
              type: 'image/png',
            },
          ]
        : undefined;
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork,
      });
    }
  };

  // register new audio element handlers when track changes
  useEffect(() => {
    if (trackLink != null) {
      const handleCurrentTimeChange = () => {
        if (audioRef?.current !== null) {
          const audio = audioRef.current;

          setSeekTime(audio.currentTime);
          if ('mediaSession' in navigator) {
            if (!isNaN(audio.currentTime) && !isNaN(audio.duration)) {
              navigator.mediaSession.setPositionState({
                position: audio.currentTime,
                duration: audio.duration,
                playbackRate: audio.playbackRate,
              });
            }
          }
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

          _player._play({ trackId: activeTrackId });

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

      const updateMediaHandlers = () => {
        if (audioRef?.current !== null) {
          const audio = audioRef.current;

          if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', handlePlay);
            navigator.mediaSession.setActionHandler('pause', handlePause);
            navigator.mediaSession.setActionHandler('stop', handlePause);
            navigator.mediaSession.setActionHandler(
              'nexttrack',
              _player.playNext,
            );
            navigator.mediaSession.setActionHandler(
              'previoustrack',
              _player.playPrev,
            );
          }
        }
      };

      const addEventToAudio = (eventTuple: [string, EventListener]) => {
        if (audioRef?.current !== null) {
          audioRef.current.addEventListener(...eventTuple);
          return () => {
            audioRef.current?.removeEventListener(...eventTuple);
          };
        }
      };

      if (audioRef?.current !== null && trackLink) {
        const audio = audioRef.current;

        audio.setAttribute('src', trackLink);
        const canplayEventArgs: [string, EventListener] = [
          'canplay',
          handleCanPlay,
        ];
        const playEventArgs: [string, EventListener] = ['play', handlePlay];
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
        const pauseEventArgs: [string, EventListener] = ['pause', handlePause];
        const unsubscribers: ((() => void) | undefined)[] = [];
        unsubscribers.push(addEventToAudio(durationChangeEventArgs));
        unsubscribers.push(addEventToAudio(timeupdateEventArgs));
        unsubscribers.push(addEventToAudio(canplayEventArgs));
        unsubscribers.push(addEventToAudio(endedEventArgs));
        unsubscribers.push(addEventToAudio(pauseEventArgs));
        unsubscribers.push(addEventToAudio(playEventArgs));
        updateMediaSession();
        updateMediaHandlers();
        audio.load();
        return () => {
          unsubscribers.forEach((unsubscriber) => unsubscriber?.());
        };
      }
    } else if (audioRef?.current != null) {
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
  };
};

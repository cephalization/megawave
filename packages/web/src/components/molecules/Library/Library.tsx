import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { bindActionCreators } from 'redux';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { playerActions } from '~/store/slices';
import { fetchLibrary, librarySelectors } from '~/store/slices/library';
import { getArrayString } from '~/utils/trackMeta';
import { TrackList } from '../TrackList';

import { WaveLoader } from '../WaveLoader';

export function Library() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchLibrary());
  }, []);

  const trackIDs = useAppSelector(librarySelectors.selectFilteredTrackIds);
  const isLoading = useAppSelector(librarySelectors.selectLibraryLoading);
  const currentTrack = useAppSelector(
    librarySelectors.selectLibraryActiveTrack,
  );
  const play = bindActionCreators(playerActions.play, useAppDispatch());

  if (isLoading) return <WaveLoader />;

  return (
    <>
      {currentTrack && (
        <Helmet defer={false}>
          <title>
            {currentTrack.name}
            {getArrayString(currentTrack.artist)
              ? ` - ${getArrayString(currentTrack.artist)}`
              : ''}
            &nbsp;| Megawave
          </title>
        </Helmet>
      )}
      <TrackList
        trackIDs={trackIDs}
        onPlayTrackId={play}
        currentTrack={currentTrack}
      />
    </>
  );
}

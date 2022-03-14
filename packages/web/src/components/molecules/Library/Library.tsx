import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { bindActionCreators } from 'redux';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { playerActions } from '~/store/slices';
import { librarySelectors } from '~/store/slices/library/selectors';
import {
  fetchFilteredLibrary,
  fetchLibrary,
} from '~/store/slices/library/thunks';
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
  const play = bindActionCreators(playerActions.play, dispatch);
  const filterByArtist = bindActionCreators(fetchFilteredLibrary, dispatch);

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
        onFilterLibrary={(field, trackId) => filterByArtist({ field, trackId })}
        currentTrack={currentTrack}
      />
    </>
  );
}

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { bindActionCreators } from 'redux';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { usePrevious } from '~/hooks/usePrevious';
import { librarySelectors } from '~/store/slices/library/selectors';
import {
  fetchFilteredLibrary,
  fetchLibrary,
} from '~/store/slices/library/thunks';
import { playTrack } from '~/store/slices/player/player';
import { getArrayString } from '~/utils/trackMeta';

import { TrackList } from '../TrackList';
import { WaveLoader } from '../WaveLoader';

export function Library() {
  const dispatch = useAppDispatch();

  const tracksFilter = useAppSelector(librarySelectors.selectLibraryFilter);
  const trackIDs = useAppSelector(librarySelectors.selectFilteredTrackIds);
  const isInitialized = useAppSelector(
    librarySelectors.selectLibraryInitialized,
  );
  const isLoading = useAppSelector(librarySelectors.selectLibraryLoading);
  const currentTrack = useAppSelector(
    librarySelectors.selectLibraryActiveTrack,
  );
  const play = bindActionCreators(playTrack, dispatch);
  const filterByField = bindActionCreators(fetchFilteredLibrary, dispatch);

  const lastTracksFilter = usePrevious(tracksFilter);

  useEffect(() => {
    if (tracksFilter !== lastTracksFilter && !isLoading) {
      dispatch(fetchLibrary());
    }
  }, [tracksFilter, lastTracksFilter, isLoading]);

  if (!isInitialized) return <WaveLoader />;

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
        onFilterLibrary={(field, trackId) => {
          filterByField({ field, trackId, resetFilter: true });
        }}
        currentTrack={currentTrack}
      />
    </>
  );
}

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { bindActionCreators } from 'redux';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { usePrevious } from '~/hooks/usePrevious';
import { playerActions } from '~/store/slices';
import { libraryActions } from '~/store/slices/library';
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

  const tracksFilter = useAppSelector(librarySelectors.selectLibraryFilter);
  const trackIDs = useAppSelector(librarySelectors.selectTrackIds);
  const isLoading = useAppSelector(librarySelectors.selectLibraryLoading);
  const currentTrack = useAppSelector(
    librarySelectors.selectLibraryActiveTrack,
  );
  const play = bindActionCreators(playerActions.play, dispatch);
  const filterByField = bindActionCreators(fetchFilteredLibrary, dispatch);

  const lastTracksFilter = usePrevious(tracksFilter);

  useEffect(() => {
    if (tracksFilter !== lastTracksFilter && !isLoading) {
      dispatch(fetchLibrary({ filter: tracksFilter, sort: '' }));
    }
  }, [tracksFilter, lastTracksFilter, isLoading]);

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
        onFilterLibrary={(field, trackId) => {
          filterByField({ field, trackId, resetFilter: true });
        }}
        currentTrack={currentTrack}
      />
    </>
  );
}

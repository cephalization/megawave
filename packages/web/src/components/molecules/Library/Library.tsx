import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router';
import { bindActionCreators } from 'redux';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { useCurrentTrack } from '~/hooks/useCurrentTrack';
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
  const [scrollToTrack, setScrollToTrack] = useState<string | number | null>(
    null,
  );

  const filterKey = useAppSelector(librarySelectors.selectLibraryFilterKey);
  const trackIDs = useAppSelector(librarySelectors.selectFilteredTrackIds);
  const isInitialized = useAppSelector(
    librarySelectors.selectLibraryInitialized,
  );
  const isLoading = useAppSelector(librarySelectors.selectLibraryLoading);
  const currentTrack = useCurrentTrack();
  const play = bindActionCreators(playTrack, dispatch);
  const filterByField = bindActionCreators(fetchFilteredLibrary, dispatch);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    const handleScrollToTrack = (e: CustomEvent<string | number>) => {
      setScrollToTrack(e.detail);
      // Reset the scroll target after a short delay
      setTimeout(() => setScrollToTrack(null), 100);
    };

    window.addEventListener(
      'scrollToTrack',
      handleScrollToTrack as EventListener,
    );
    return () => {
      window.removeEventListener(
        'scrollToTrack',
        handleScrollToTrack as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!isLoadingRef.current) {
      dispatch(fetchLibrary({ fallback: true }));
    }
  }, [dispatch, filterKey]);

  if (!isInitialized) return <WaveLoader />;

  const title = currentTrack
    ? `${currentTrack.name} - ${getArrayString(currentTrack.artist)} | Megawave`
    : 'Megawave';

  return (
    <>
      {currentTrack ? <title>{title}</title> : null}
      <TrackList
        trackIDs={trackIDs}
        onPlayTrackId={play}
        onFilterLibrary={(field, trackId) => {
          filterByField({ field, trackId, resetFilter: true });
        }}
        currentTrack={currentTrack}
        scrollToTrack={scrollToTrack}
      />
    </>
  );
}

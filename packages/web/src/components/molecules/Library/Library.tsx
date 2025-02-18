import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { bindActionCreators } from 'redux';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { useCurrentTrack } from '~/hooks/useCurrentTrack';
import { libraryActions } from '~/store/slices/library/library';
import { librarySelectors } from '~/store/slices/library/selectors';
import {
  fetchFilteredLibrary,
  fetchLibrary,
} from '~/store/slices/library/thunks';
import { playTrack } from '~/store/slices/player/player';
import { getArrayString } from '~/utils/trackMeta';

import { TrackList } from '../TrackList';
import { WaveLoader } from '../WaveLoader';
import { AlbumList } from './AlbumList';

export function Library() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [scrollToTrack, setScrollToTrack] = useState<string | number | null>(
    null,
  );

  const filterKey = useAppSelector(librarySelectors.selectLibraryFilterKey);
  const trackIDs = useAppSelector(librarySelectors.selectFilteredTrackIds);
  const isInitialized = useAppSelector(
    librarySelectors.selectLibraryInitialized,
  );
  const isLoading = useAppSelector(librarySelectors.selectLibraryLoading);
  const viewMode = searchParams.get('view') || 'tracks';
  const currentTrack = useCurrentTrack();
  const play = bindActionCreators(playTrack, dispatch);
  const filterByField = bindActionCreators(fetchFilteredLibrary, dispatch);
  const setViewMode = bindActionCreators(libraryActions.setViewMode, dispatch);
  const isLoadingRef = useRef(isLoading);
  // Keep redux state in sync with URL params
  useEffect(() => {
    setViewMode(viewMode as 'tracks' | 'albums');
  }, [viewMode, setViewMode]);

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
    ? `${[currentTrack.name, getArrayString(currentTrack.artist)].join(
        ' - ',
      )} | Megawave`
    : 'Megawave';

  return (
    <>
      {currentTrack ? <title>{title}</title> : null}
      {/* TODO: These need to always be full height, even if there is no content */}
      {viewMode === 'tracks' ? (
        <TrackList
          containerId="library-container"
          trackIDs={trackIDs}
          onPlayTrackId={play}
          onFilterLibrary={(field, trackId) => {
            filterByField({ field, trackId, resetFilter: true });
          }}
          currentTrack={currentTrack}
          scrollToTrack={scrollToTrack}
        />
      ) : (
        <AlbumList onPlayTrackId={play} containerId="library-container" />
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useCurrentTrack } from '~/hooks/useCurrentTrack';
import { useTracksQuery } from '~/queries/hooks';
import { usePlayerStore } from '~/store/playerStore';
import type { Track } from '~/types/library';
import { getArrayString } from '~/utils/trackMeta';

import { TrackList } from '../TrackList';
import { WaveLoader } from '../WaveLoader';
import { AlbumList } from './AlbumList';
import { ArtistList } from './ArtistList';

export function Library() {
  const [searchParams] = useSearchParams();
  const [scrollToTrack, setScrollToTrack] = useState<string | number | null>(
    null,
  );

  const queryParams = {
    search: searchParams.get('q') || undefined,
    sort: searchParams.get('sort') || undefined,
    subkeyfilter: searchParams.get('subkeyfilter') || undefined,
    albumId: searchParams.get('albumId')
      ? Number(searchParams.get('albumId'))
      : undefined,
    artistId: searchParams.get('artistId')
      ? Number(searchParams.get('artistId'))
      : undefined,
  };
  const tracksQuery = useTracksQuery(queryParams);
  const tracks = tracksQuery.data ?? [];
  const viewMode = searchParams.get('view') || 'tracks';
  const currentTrack = useCurrentTrack();
  const play = usePlayerStore((state) => state.play);
  const [, setSearchParams] = useSearchParams();

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

  if (tracksQuery.isPending && viewMode === 'tracks') return <WaveLoader />;

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
          tracks={tracks}
          onPlayTrackId={play}
          onFilterLibrary={(field, track) => {
            setSearchParams({
              view: 'tracks',
              ...(field === 'album' && track.albumId != null
                ? { albumId: track.albumId.toString() }
                : {}),
              ...(field === 'artist' && track.artistId != null
                ? { artistId: track.artistId.toString() }
                : {}),
              ...(field === 'album' && track.albumId == null && track.album?.[0]
                ? {
                    subkeyfilter: `album-${encodeURIComponent(track.album[0])}`,
                  }
                : {}),
              ...(field === 'artist' &&
              track.artistId == null &&
              track.artist?.[0]
                ? {
                    subkeyfilter: `artist-${encodeURIComponent(track.artist[0])}`,
                  }
                : {}),
            });
          }}
          currentTrack={currentTrack}
          scrollToTrack={scrollToTrack}
        />
      ) : viewMode === 'artists' ? (
        <ArtistList containerId="library-container" />
      ) : (
        <AlbumList containerId="library-container" />
      )}
    </>
  );
}

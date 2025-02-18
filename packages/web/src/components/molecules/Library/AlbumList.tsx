import { EntityId } from '@reduxjs/toolkit';
import { useRef } from 'react';
import { useSearchParams } from 'react-router';

import { AlbumArt } from '~/components/atoms/AlbumArt/AlbumArt';
import { useAppSelector } from '~/hooks';
import { useAvailableDimensions } from '~/hooks';
import { librarySelectors } from '~/store/slices/library/selectors';
import { getArrayString } from '~/utils/trackMeta';

type AlbumListProps = {
  onPlayTrackId: (arg: {
    trackId?: EntityId | null;
    requeue?: boolean;
    context?: 'library' | 'history' | 'queue' | 'album';
    addHistory?: boolean;
  }) => void;
  containerId?: string;
};

export function AlbumList({
  onPlayTrackId,
  containerId = 'library-container',
}: AlbumListProps) {
  const albums = useAppSelector(librarySelectors.selectAlbumGroups);
  const { refToMeasure: libraryRef, height } =
    useAvailableDimensions(containerId);
  const [, setSearchParams] = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleAlbumClick = (e: React.MouseEvent, album: string) => {
    e.stopPropagation();
    setSearchParams((params) => {
      params.set('view', 'tracks');
      params.set('subkeyfilter', `album-${encodeURIComponent(album)}`);
      return params;
    });
  };

  const handleArtistClick = (e: React.MouseEvent, artist: string[]) => {
    e.stopPropagation();
    setSearchParams((params) => {
      params.set('view', 'tracks');
      params.set(
        'subkeyfilter',
        `artist-${encodeURIComponent(getArrayString(artist))}`,
      );
      return params;
    });
  };

  const handlePlayAlbum = (album: { trackIds: EntityId[] }) => {
    onPlayTrackId({
      trackId: album.trackIds[0],
      requeue: true,
      context: 'album',
      addHistory: true,
    });
  };

  return (
    <div
      className="border-t border-border relative bg-card transition-colors"
      style={{ height }}
      ref={libraryRef}
    >
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto"
      >
        <div className="grid grid-cols-1 @md:grid-cols-3 @xl:grid-cols-4 @2xl:grid-cols-6 @7xl:grid-cols-8 @10xl:grid-cols-10 @12xl:grid-cols-12 gap-6 p-6">
          {albums.map((album) => (
            <div
              key={album.name}
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => handlePlayAlbum(album)}
            >
              <div className="relative w-full aspect-square mb-4">
                <AlbumArt
                  className="w-full h-full rounded-lg shadow-lg transition-transform duration-200 group-hover:scale-105"
                  src={album.art?.[0]}
                  alt={`Album art for ${album.name}`}
                />
                <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3
                className="text-foreground font-medium text-center line-clamp-1 w-full hover:text-primary cursor-pointer"
                onClick={(e) => handleAlbumClick(e, album.name)}
              >
                {album.name}
              </h3>
              <p
                className="text-muted-foreground text-sm text-center line-clamp-1 w-full hover:text-primary cursor-pointer"
                onClick={(e) => handleArtistClick(e, album.artist)}
              >
                {getArrayString(album.artist)}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {album.trackIds.length} track
                {album.trackIds.length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

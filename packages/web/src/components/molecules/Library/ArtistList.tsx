import { useRef } from 'react';
import { useSearchParams } from 'react-router';

import { AlbumArt } from '~/components/atoms/AlbumArt/AlbumArt';
import { useAppSelector } from '~/hooks';
import { useAvailableDimensions } from '~/hooks';
import { librarySelectors } from '~/store/slices/library/selectors';
import type { Artist } from '~/types/library';

type ArtistListProps = {
  containerId?: string;
};

export function ArtistList({ containerId = 'library-container' }: ArtistListProps) {
  const artists = useAppSelector(librarySelectors.selectArtists);
  const { refToMeasure: libraryRef, height } =
    useAvailableDimensions(containerId);
  const [, setSearchParams] = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleArtistClick = (artist: Artist) => {
    setSearchParams((params) => {
      params.set('view', 'tracks');
      params.set('artistId', artist.id.toString());
      params.delete('albumId');
      params.delete('subkeyfilter');
      return params;
    });
  };

  return (
    <div
      className="border-t border-border relative bg-card transition-colors"
      style={{ height }}
      ref={libraryRef}
    >
      <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto">
        <div className="grid grid-cols-1 @md:grid-cols-3 @xl:grid-cols-4 @2xl:grid-cols-6 @7xl:grid-cols-8 @10xl:grid-cols-10 @12xl:grid-cols-12 gap-6 p-6">
          {artists.map((artist) => (
            <button
              key={artist.id}
              type="button"
              className="flex flex-col items-center group cursor-pointer text-left"
              onClick={() => handleArtistClick(artist)}
            >
              <div className="relative w-full aspect-square mb-4">
                <AlbumArt
                  className="w-full h-full rounded-full shadow-lg transition-transform duration-200 group-hover:scale-105"
                  src={artist.art?.[0]}
                  alt={`Representative art for ${artist.name}`}
                />
              </div>
              <h3 className="text-foreground font-medium text-center line-clamp-1 w-full group-hover:text-primary">
                {artist.name}
              </h3>
              <p className="text-muted-foreground text-xs mt-1">
                {artist.albumCount} album{artist.albumCount !== 1 ? 's' : ''} ·{' '}
                {artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

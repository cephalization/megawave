import {
  ArrowPathIcon,
  ListBulletIcon,
  UserGroupIcon,
  RectangleStackIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { useSearchParams } from 'react-router';

import {
  useAlbumsQuery,
  useArtistsQuery,
  useTracksQuery,
} from '~/queries/hooks';

type Filter = {
  field: string;
  value: string;
};

export const TrackCount = ({ loading }: { loading?: boolean }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Pull filters from URL
  const subkeyfilter = searchParams.get('subkeyfilter');
  const searchQuery = searchParams.get('q');
  const sort = searchParams.get('sort');
  const viewMode = searchParams.get('view') || 'tracks';
  const albumId = searchParams.get('albumId');
  const artistId = searchParams.get('artistId');
  const search = searchQuery ?? undefined;
  const tracksQuery = useTracksQuery({
    search,
    sort: sort ?? undefined,
    subkeyfilter: subkeyfilter ?? undefined,
    albumId: albumId == null ? undefined : Number(albumId),
    artistId: artistId == null ? undefined : Number(artistId),
  });
  const albumsQuery = useAlbumsQuery(search);
  const artistsQuery = useArtistsQuery(search);
  const trackCount = tracksQuery.data?.length ?? 0;
  const albumCount = albumsQuery.data?.length ?? 0;
  const artistCount = artistsQuery.data?.length ?? 0;

  // only clear the filter based on the filter field
  const clearFilter = (e: React.MouseEvent, filter: Filter) => {
    e.preventDefault();
    e.stopPropagation();
    if (filter.field === 'search') {
      setSearchParams((p) => {
        p.delete('q');
        return p;
      });
    } else if (filter.field === 'sort') {
      setSearchParams((p) => {
        p.delete('sort');
        return p;
      });
    } else {
      setSearchParams((p) => {
        p.delete('subkeyfilter');
        p.delete('albumId');
        p.delete('artistId');
        return p;
      });
    }
  };

  const getFilterDisplay = () => {
    const filters: Filter[] = [];
    if (subkeyfilter) {
      const [field, ...value] = subkeyfilter.split('-');
      filters.push({ field, value: decodeURIComponent(value.join('-')) });
    }
    if (albumId) filters.push({ field: 'album', value: `#${albumId}` });
    if (artistId) filters.push({ field: 'artist', value: `#${artistId}` });
    if (searchQuery) {
      filters.push({ field: 'search', value: searchQuery });
    }
    return filters;
  };

  const filterDisplay: Filter[] = getFilterDisplay();

  // TODO: Break this up into multiple components
  // TODO: Make it a scrollable header on mobile, you should be able to scroll past this stuff
  return (
    <div className="bg-card transition-colors flex-1 grow-0 px-2 sm:px-4 py-4 items-center justify-between w-full flex gap-2">
      <div className="flex items-center gap-2">
        {loading && (
          <ArrowPathIcon className="animate-spin h-5 w-5 text-muted-foreground" />
        )}
        <h2 className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
          {filterDisplay.length > 0 &&
            filterDisplay.map((f) => (
              <span
                key={f.field}
                className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1"
              >
                {f.field}: {f.value}
                <button
                  onClick={(e) => clearFilter(e, f)}
                  className="hover:bg-primary/20 hover:text-primary rounded-sm p-0.5"
                  title="Clear filter"
                  type="button"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          {viewMode === 'albums'
            ? 'Albums'
            : viewMode === 'artists'
              ? 'Artists'
              : 'Tracks'}
          :{' '}
          <span className="text-foreground font-bold font-mono text-end">
            {viewMode === 'albums'
              ? albumCount
              : viewMode === 'artists'
                ? artistCount
                : trackCount}
          </span>
        </h2>
      </div>
      <div className="flex items-center gap-1 bg-accent rounded-lg p-1">
        <button
          onClick={() =>
            setSearchParams((p) => {
              p.set('view', 'tracks');
              p.delete('albumId');
              p.delete('artistId');
              return p;
            })
          }
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'tracks'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10'
          }`}
          title="Track view"
        >
          <ListBulletIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() =>
            setSearchParams((p) => {
              p.set('view', 'albums');
              p.delete('albumId');
              p.delete('artistId');
              return p;
            })
          }
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'albums'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10'
          }`}
          title="Album view"
        >
          <RectangleStackIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() =>
            setSearchParams((p) => {
              p.set('view', 'artists');
              p.delete('albumId');
              p.delete('artistId');
              return p;
            })
          }
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'artists'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10'
          }`}
          title="Artist view"
        >
          <UserGroupIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

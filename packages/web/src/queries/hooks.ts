import { useQuery } from '@tanstack/react-query';

import { libraryApi } from './library';

export type TrackQueryParams = {
  search?: string;
  sort?: string;
  subkeyfilter?: string;
  albumId?: number;
  artistId?: number;
};

export const libraryQueryKeys = {
  status: ['library', 'status'] as const,
  tracks: (params: TrackQueryParams) => ['library', 'tracks', params] as const,
  albums: (search?: string) => ['library', 'albums', { search }] as const,
  artists: (search?: string) => ['library', 'artists', { search }] as const,
};

export function useLibraryStatusQuery() {
  return useQuery({
    queryKey: libraryQueryKeys.status,
    queryFn: libraryApi.getStatus,
    refetchInterval: (query) => (query.state.data?.scanActive ? 2_500 : false),
  });
}

export function useTracksQuery(params: TrackQueryParams) {
  return useQuery({
    queryKey: libraryQueryKeys.tracks(params),
    queryFn: () => libraryApi.get(params),
  });
}

export function useAlbumsQuery(search?: string) {
  return useQuery({
    queryKey: libraryQueryKeys.albums(search),
    queryFn: () => libraryApi.getAlbums({ search }),
  });
}

export function useArtistsQuery(search?: string) {
  return useQuery({
    queryKey: libraryQueryKeys.artists(search),
    queryFn: () => libraryApi.getArtists({ search }),
  });
}

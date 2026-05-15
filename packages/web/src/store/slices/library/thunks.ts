import { createAsyncThunk, EntityId } from '@reduxjs/toolkit';

import { libraryApi } from '~/queries/library';
import { RootState } from '~/store';
import { Album, Artist, Track } from '~/types/library';

import { libraryActions } from './library';
import { librarySelectors } from './selectors';

export const fetchLibrary = createAsyncThunk<
  {
    tracks: Track[];
    search?: string;
    sort?: string;
    subkeyfilter?: string;
    albumId?: number | null;
    artistId?: number | null;
  },
  | {
      search?: string;
      sort?: string;
      subkeyfilter?: string;
      albumId?: number | null;
      artistId?: number | null;
      fallback?: boolean;
    }
  | undefined
>(
  '/library/fetchAll',
  async (
    { search, sort, subkeyfilter, albumId, artistId, fallback = false } = {},
    { getState },
  ) => {
    const state = getState() as RootState;
    let searchParam = search;
    let sortParam = sort;
    let subkeyfilterParam = subkeyfilter;
    let albumIdParam = albumId;
    let artistIdParam = artistId;

    if (fallback) {
      searchParam = librarySelectors.selectLibrarySearch(state);
      sortParam = librarySelectors.selectLibrarySort(state);
      subkeyfilterParam = librarySelectors.selectLibrarySubkeyfilter(state);
      albumIdParam = librarySelectors.selectLibraryAlbumId(state);
      artistIdParam = librarySelectors.selectLibraryArtistId(state);
    }

    const tracks = await libraryApi.get({
      search: searchParam,
      sort: sortParam,
      subkeyfilter: subkeyfilterParam,
      albumId: albumIdParam ?? undefined,
      artistId: artistIdParam ?? undefined,
    });

    return {
      tracks,
      search: searchParam,
      sort: sortParam,
      subkeyfilter: subkeyfilterParam,
      albumId: albumIdParam ?? null,
      artistId: artistIdParam ?? null,
    };
  },
);

export const fetchAlbums = createAsyncThunk<
  { albums: Album[]; search?: string },
  { search?: string; fallback?: boolean } | undefined
>('/library/fetchAlbums', async ({ search, fallback = false } = {}, { getState }) => {
  const state = getState() as RootState;
  const searchParam = fallback
    ? librarySelectors.selectLibrarySearch(state)
    : search;
  const albums = await libraryApi.getAlbums({ search: searchParam });
  return { albums, search: searchParam };
});

export const fetchArtists = createAsyncThunk<
  { artists: Artist[]; search?: string },
  { search?: string; fallback?: boolean } | undefined
>('/library/fetchArtists', async ({ search, fallback = false } = {}, { getState }) => {
  const state = getState() as RootState;
  const searchParam = fallback
    ? librarySelectors.selectLibrarySearch(state)
    : search;
  const artists = await libraryApi.getArtists({ search: searchParam });
  return { artists, search: searchParam };
});

export const fetchFilteredLibrary = createAsyncThunk<
  void,
  { field: keyof Track; trackId: EntityId; resetFilter: true }
>(
  '/library/fetchFilteredLibrary',
  async ({ field, trackId }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const track = librarySelectors.selectTrackById(state, trackId);
    const trackField = track?.[field];

    if (trackField) {
      const albumId = field === 'album' ? track?.albumId : null;
      const artistId = field === 'artist' ? track?.artistId : null;
      const filterValue = Array.isArray(trackField)
        ? trackField[0]
        : trackField;

      // Clear the main filter
      dispatch(
        libraryActions.setLibraryFilter({
          search: '',
          subkeyfilter:
            albumId == null && artistId == null ? `${field}-${filterValue}` : '',
          albumId,
          artistId,
          sort: '',
        }),
      );

      dispatch(
        fetchLibrary({
          fallback: true,
        }),
      );
    }
  },
);

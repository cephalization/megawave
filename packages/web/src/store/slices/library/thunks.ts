import { createAsyncThunk, EntityId } from '@reduxjs/toolkit';

import { libraryApi } from '~/queries/library';
import { RootState } from '~/store';
import { Track } from '~/types/library';

import { libraryActions } from './library';
import { librarySelectors } from './selectors';

export const fetchLibrary = createAsyncThunk<
  { tracks: Track[]; search?: string; sort?: string; subkeyfilter?: string },
  | {
      search?: string;
      sort?: string;
      subkeyfilter?: string;
      fallback?: boolean;
    }
  | undefined
>(
  '/library/fetchAll',
  async (
    { search, sort, subkeyfilter, fallback = false } = {},
    { getState },
  ) => {
    const state = getState() as RootState;
    let searchParam = search;
    let sortParam = sort;
    let subkeyfilterParam = subkeyfilter;

    if (fallback) {
      searchParam = librarySelectors.selectLibrarySearch(state);
      sortParam = librarySelectors.selectLibrarySort(state);
      subkeyfilterParam = librarySelectors.selectLibrarySubkeyfilter(state);
    }

    const tracks = await libraryApi.get({
      search: searchParam,
      sort: sortParam,
      subkeyfilter: subkeyfilterParam,
    });

    return {
      tracks,
      search: searchParam,
      sort: sortParam,
      subkeyfilter: subkeyfilterParam,
    };
  },
);

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
      const filterValue = Array.isArray(trackField)
        ? trackField[0]
        : trackField;

      // Clear the main filter
      dispatch(
        libraryActions.setLibraryFilter({
          search: '',
          subkeyfilter: `${field}-${filterValue}`,
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

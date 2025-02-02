import { createAsyncThunk, EntityId } from '@reduxjs/toolkit';

import { libraryApi } from '~/queries/library';
import { RootState } from '~/store';
import { Track } from '~/types/library';

import { libraryActions } from './library';
import { librarySelectors } from './selectors';

export const fetchLibrary = createAsyncThunk<
  { tracks: Track[]; filter?: string; sort?: string; subkeyfilter?: string },
  { filter?: string; sort?: string; subkeyfilter?: string } | undefined
>(
  '/library/fetchAll',
  async ({ filter, sort, subkeyfilter } = {}, { getState }) => {
    console.log('fetching library', filter, sort, subkeyfilter);
    const state = getState() as RootState;
    const stateFilter = librarySelectors.selectLibraryFilter(state);
    const newFilter = filter;
    const tracks = await libraryApi.get({
      filter: newFilter,
      sort,
      subkeyfilter,
    });

    return { tracks, filter: newFilter, sort, subkeyfilter };
  },
);

export const fetchFilteredLibrary = createAsyncThunk<
  void,
  { field: keyof Track; trackId: EntityId; resetFilter: true }
>(
  '/library/fetchFilteredLibrary',
  async ({ field, trackId }, { getState, dispatch }) => {
    console.log('fetching filtered library', field, trackId);
    const state = getState() as RootState;
    const track = librarySelectors.selectTrackById(state, trackId);
    const trackField = track?.[field];

    if (trackField) {
      const filterValue = Array.isArray(trackField)
        ? trackField[0]
        : trackField;

      // Clear the main filter
      dispatch(libraryActions.setLibraryFilter({ filter: '' }));

      // Use the subkeyfilter format that matches the URL
      const subkeyfilter = `${field}-${filterValue}`;

      dispatch(
        fetchLibrary({
          filter: '',
          sort: field,
          subkeyfilter,
        }),
      );
    }
  },
);

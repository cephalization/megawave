import { createAsyncThunk, EntityId } from '@reduxjs/toolkit';

import { libraryApi } from '~/queries/library';
import { RootState } from '~/store';
import { Track } from '~/types/library';
import { getArrayString } from '~/utils/trackMeta';

import { libraryActions } from './library';
import { librarySelectors } from './selectors';

export const fetchLibrary = createAsyncThunk<
  { tracks: Track[]; filter?: string; sort?: string; subkeyfilter?: string },
  { filter?: string; sort?: string; subkeyfilter?: string } | undefined
>(
  '/library/fetchAll',
  async ({ filter, sort, subkeyfilter } = {}, { getState }) => {
    const state = getState() as RootState;
    const stateFilter = librarySelectors.selectLibraryFilter(state);
    const newFilter = filter || stateFilter;
    const newSort = sort || 'artist';
    const tracks = await libraryApi.fetch({
      filter: newFilter,
      sort: newSort,
      subkeyfilter,
    });

    return { tracks, filter: newFilter, sort: newSort, subkeyfilter };
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
    const trackField = getArrayString(track?.[field]);

    if (trackField) {
      dispatch(libraryActions.setLibraryFilter({ filter: '' }));
      dispatch(
        fetchLibrary({
          filter: '',
          sort: field,
          subkeyfilter: `${field}-${encodeURIComponent(trackField)}`,
        }),
      );
    }
  },
);

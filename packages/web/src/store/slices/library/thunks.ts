import { createAsyncThunk, EntityId } from '@reduxjs/toolkit';

import { libraryApi } from '~/queries/library';
import { RootState } from '~/store';
import { Track } from '~/types/library';
import { getArrayString } from '~/utils/trackMeta';

import { librarySelectors } from './selectors';

export const fetchLibrary = createAsyncThunk<
  { tracks: Track[]; filter?: string },
  { filter?: string } | undefined
>('/library/fetchAll', async ({ filter } = {}) => {
  const tracks = await libraryApi.fetch(filter);

  return { tracks, filter };
});

export const fetchFilteredLibrary = createAsyncThunk<
  void,
  { field: keyof Track; trackId: EntityId }
>(
  '/library/fetchFilteredLibrary',
  async ({ field, trackId }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const track = librarySelectors.selectTrackById(state, trackId);

    dispatch(
      fetchLibrary({
        filter: `${field}-${encodeURIComponent(getArrayString(track?.artist))}`,
      }),
    );
  },
);

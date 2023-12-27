import axios from 'axios';

import { Track } from '~/types/library';

import { library, track } from './urls';

export type getLibraryResponse = {
  data: {
    songs: Track[];
  };
};

export async function fetchStatus() {
  const res = await axios.get<{ data: 'loading' | 'idle' | 'error' }>(
    '/api/library/status',
  );

  return res.data.data;
}

export async function fetch({
  filter,
  sort,
  subkeyfilter,
}: { filter?: string; sort?: string; subkeyfilter?: string } = {}) {
  const filterString = filter ? `filter=${filter}` : '';
  const sortString = sort ? `sort=${sort}` : '';
  const subkeyfilterString = subkeyfilter ? `subkeyfilter=${subkeyfilter}` : '';
  const params = [filterString, sortString, subkeyfilterString].filter(
    (p) => !!p,
  );
  const res = await axios.get<getLibraryResponse>(
    `${library()}${params.length ? `?${params.join('&')}` : ''}`,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const tracks = res.data.data.songs;

  return tracks;
}

export function fetchOne(trackId: string) {
  return axios.get(track(trackId));
}

export const libraryApi = {
  fetch,
  fetchOne,
};

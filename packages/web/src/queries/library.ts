import { Track } from '~/types/library';

import { library, track } from './urls';

export const libraryAbortController = new AbortController();

export type getLibraryResponse = {
  data: {
    songs: Track[];
  };
};

export async function getStatus() {
  const res = await fetch('/api/library/status');
  const data = await res.json();

  return data as { data: 'loading' | 'idle' | 'error' };
}

export async function get({
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
  const res = await fetch(
    `${library()}${params.length ? `?${params.join('&')}` : ''}`,
  );

  const data = await res.json();
  const tracks = data.data.songs as Track[];

  return tracks;
}

export async function getOne(trackId: string) {
  const res = await fetch(track(trackId));
  const data = await res.json();
  return data.data as Track;
}

export const libraryApi = {
  get,
  getOne,
};

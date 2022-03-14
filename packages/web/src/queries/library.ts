import axios from 'axios';

import { Track } from '~/types/library';

import { library, track } from './urls';

export type getLibraryResponse = {
  data: {
    songs: Track[];
  };
};

export async function fetch(filter?: string) {
  const filterString = filter ? `&subkeyfilter=${filter}` : '';
  const res = await axios.get<getLibraryResponse>(
    `${library()}?sort=artist${filterString}`,
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

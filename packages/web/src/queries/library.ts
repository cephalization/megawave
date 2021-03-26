import axios from 'axios';
import { Track } from '~/types/library';
import { library, track } from './urls';

export type getLibraryResponse = {
  data: {
    songs: Track[];
  };
};

export async function fetchAll() {
  const res = await axios.get<getLibraryResponse>(library());

  const tracks = res.data.data.songs;

  return tracks;
}

export function fetchOne(trackId: string) {
  return axios.get(track(trackId));
}

export const libraryApi = {
  fetchAll,
  fetchOne,
};

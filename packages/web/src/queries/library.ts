import { client } from '~/client';

export async function getStatus() {
  const res = await client.api.library.status.$get();
  if (res.status === 500) {
    const error = await res.json();
    throw new Error(error.error);
  } else {
    const data = await res.json();
    return data;
  }
}

export async function get({
  search,
  sort,
  subkeyfilter,
  albumId,
  artistId,
}: {
  search?: string;
  sort?: string;
  subkeyfilter?: string;
  albumId?: number;
  artistId?: number;
} = {}) {
  const res = await client.api.library.songs.$get({
    query: {
      filter: !!search ? search : undefined,
      sort: !!sort ? sort : undefined,
      subkeyfilter: !!subkeyfilter ? subkeyfilter : undefined,
      albumId: albumId?.toString(),
      artistId: artistId?.toString(),
    },
  });

  if (res.status === 500) {
    const error = await res.json();
    throw new Error(error.error);
  } else {
    const data = await res.json();
    return data.data;
  }
}

export async function getAlbums({ search }: { search?: string } = {}) {
  const res = await client.api.library.albums.$get({
    query: { filter: !!search ? search : undefined },
  });

  if (res.status === 500) {
    const error = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}

export async function getArtists({ search }: { search?: string } = {}) {
  const res = await client.api.library.artists.$get({
    query: { filter: !!search ? search : undefined },
  });

  if (res.status === 500) {
    const error = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}

export const libraryApi = {
  get,
  getStatus,
  getAlbums,
  getArtists,
};

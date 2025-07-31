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
}: { search?: string; sort?: string; subkeyfilter?: string } = {}) {
  const res = await client.api.library.songs.$get({
    query: {
      filter: !!search ? search : undefined,
      sort: !!sort ? sort : undefined,
      subkeyfilter: !!subkeyfilter ? subkeyfilter : undefined,
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

export const libraryApi = {
  get,
};

export function getNextUrl(
  url: string,
  limit: number,
  offset: number,
  total: number,
) {
  const nextOffset = offset + limit;
  if (nextOffset >= total) {
    return null;
  }
  const nextUrl = new URL(url);
  nextUrl.searchParams.set('offset', nextOffset.toString());
  nextUrl.searchParams.set('limit', limit.toString());
  return nextUrl.toString();
}

export function getPreviousUrl(url: string, limit: number, offset: number) {
  const previousOffset = offset - limit;
  if (previousOffset < 0) {
    return null;
  }
  const previousUrl = new URL(url);
  previousUrl.searchParams.set('offset', previousOffset.toString());
  previousUrl.searchParams.set('limit', limit.toString());
  return previousUrl.toString();
}

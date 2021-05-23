// Can be used to extract artist and album info for a track
export const getArrayString = (maybeArray?: string | string[] | null) => {
  if (maybeArray == null) return '';

  if (typeof maybeArray === 'string') return maybeArray;

  return maybeArray.join(', ');
};

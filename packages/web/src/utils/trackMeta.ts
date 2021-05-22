// Can be used to extract artist and album info for a track
export const getArrayString = (array: string[] | null) => {
  if (array === null) return '';

  return array.join(', ');
};

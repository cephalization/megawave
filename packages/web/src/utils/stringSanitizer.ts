export const stringSanitizer = (s: string | null | undefined) =>
  !s ? '' : s?.toLocaleLowerCase?.() ?? '';

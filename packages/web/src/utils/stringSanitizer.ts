export const stringSanitizer = (s: string | undefined) =>
  s?.toLocaleLowerCase?.() ?? '';

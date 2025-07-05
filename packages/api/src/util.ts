import { HOST, PORT, PROTOCOL } from './env.js';

export const getServerUrl = (path: string = '') => {
  const url = new URL(path, `${PROTOCOL}://${HOST}:${PORT}`);
  return url;
};

export function getMediaType(ext: string): string {
  if (ext === 'mp3') {
    return 'audio/mpeg';
  } else if (ext === 'wav') {
    return 'audio/wav';
  }
  return '';
}

export function getAudioFileExtension(
  fileName: string,
  validExtensions?: string[],
): string | null {
  const parts = fileName.split('.');
  if (parts.length < 2) return null;
  const fileExt = parts.pop()!.toLowerCase();
  if (fileExt.length === 0) return null;
  if (validExtensions && validExtensions.includes(fileExt)) {
    return fileExt;
  } else if (!validExtensions) {
    return fileExt;
  }
  return null;
}

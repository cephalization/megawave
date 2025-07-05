import type { ReadStream } from 'node:fs';

export const MAX_BYTES_PER_RESPONSE = 100000;
export const MAX_CHUNK_SIZE = 50000;

export function getByteRangeBounds(
  byteRange: string,
  totalSize: number,
): [start: number, end: number, chunksize: number] {
  const parts = byteRange.replace(/bytes=/, '').split('-', 2);
  const start = parts[0] ? parseInt(parts[0], 10) : 0;
  let end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
  if (totalSize < end - start + 1) {
    end = totalSize - 1;
  }

  const chunksize = end - start + 1;
  return [start, end, chunksize];
}

export const createStreamBody = (stream: ReadStream) => {
  const body = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on('end', () => {
        controller.close();
      });
    },

    cancel() {
      stream.destroy();
    },
  });
  return body;
};

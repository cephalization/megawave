import { Hono } from 'hono';
import { createReadStream, statSync } from 'node:fs';
import { z } from 'zod';

import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/zod';

import { getArtFromCache, AudioTrack } from './audio.js';
import { audioLibraryStatusSchema } from './library.js';
import { getNextUrl, getPreviousUrl } from './pagination.js';
import {
  getContentTypeFromExtension,
  paginatedJSONResponse,
  strictJSONResponse,
} from './responses.js';
import { paginatedResponseSchema, trackSchema, type Track } from './schemas.js';
import { createStreamBody, getByteRangeBounds } from './stream.js';

export const statusRouter = new Hono().basePath('/status').get(
  '/',
  describeRoute({
    tags: ['status'],
    summary: 'Get status',
    description: 'Get status',
    responses: {
      200: {
        description: 'Status',
        content: {
          'application/json': {
            schema: resolver(audioLibraryStatusSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const library = c.get('library');
    return strictJSONResponse(c, audioLibraryStatusSchema, library.status);
  },
);

export const songsRouter = new Hono()
  .basePath('/songs')
  .get(
    '/',
    describeRoute({
      tags: ['songs'],
      summary: 'List songs',
      description: `
    /songs?[sort]=[-]sortKeyStr&[filter]=filterStr&[subkeyfilter]=filterKeyStr-filterValueStr

    ex: /songs
      returns a list of songs, sorted by album name and track number by default
    ex: /songs?sort=artist
      returns a list of songs, sorted by artist alphabetically ascending
    ex: /songs?sort=-album
      returns a list of songs, sorted by album alphabetically descending, with songs in album sorted by track number, with non-album tracks at the end
    ex: /songs?filter=Daft%20Punk
      returns a list of songs, filtered by any whose keys contain the string "daft punk" (case insensitive)
    ex: /songs?subkeyfilter=artist-Daft%20Punk
      returns a list of songs, filtered by the artist key "daft punk" (case insensitive)
    ex: /songs?filter=never&subkeyfilter=album-nevermind
      returns a list of songs, filtered by the album key "nevermind" and the filter "never" (case insensitive), with songs in album sorted by track number
    `,
      responses: {
        200: {
          description: 'Songs',
          content: {
            'application/json': {
              schema: resolver(paginatedResponseSchema(trackSchema)),
            },
          },
        },
      },
    }),
    validator(
      'query',
      z.object({
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
        filter: z.string().optional(),
        sort: z.string().optional(),
        subkeyfilter: z.string().optional(),
      }),
    ),
    async (c) => {
      const library = c.get('library');
      const query = c.req.valid('query');
      let tracks = await library.getEntries({
        limit: query.limit,
        offset: query.offset,
        filter: query.filter,
        sort: query.sort,
        subkeyfilter: query.subkeyfilter,
      });

      return paginatedJSONResponse(c, trackSchema, tracks.data, {
        ...tracks.meta,
        next: getNextUrl(
          c.req.url,
          tracks.meta.limit,
          tracks.meta.offset,
          tracks.meta.total,
        ),
        previous: getPreviousUrl(
          c.req.url,
          tracks.meta.limit,
          tracks.meta.offset,
        ),
      });
    },
  )
  .get(
    '/:id',
    describeRoute({
      tags: ['songs'],
      summary: 'Stream song',
      description: 'Stream song',
      responses: {
        200: {
          description: 'Binary stream of audio data',
          content: {
            'audio/mpeg': {
              schema: resolver(z.string()),
            },
          },
        },
        404: {
          description: 'Song not found',
          content: {
            'application/json': {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    validator('param', z.object({ id: z.string() })),
    validator('header', z.object({ range: z.string() })),
    async (c) => {
      const id = c.req.valid('param').id;
      const range = c.req.valid('header').range;
      const library = c.get('library');
      const song = await library.getById(id);
      if (!song) {
        return c.json({ error: 'Song not found' }, 404);
      }

      const totalSize = statSync(song.filePath).size;
      const [start, end, chunksize] = getByteRangeBounds(range, totalSize);
      const songStream = createReadStream(song.filePath, {
        start,
        end,
      });

      c.header('Content-Type', getContentTypeFromExtension(song.fileType));
      c.header('Accept-Ranges', 'bytes');
      c.header('Content-Length', chunksize.toString());
      c.header('Content-Range', `bytes ${start}-${end}/${totalSize}`);

      return c.body(createStreamBody(songStream), 206);
    },
  );

export const artRouter = new Hono().basePath('/art').get(
  '/:id',
  describeRoute({
    tags: ['art'],
    summary: 'Get art',
    description: 'Get art',
    responses: {
      200: {
        description: 'Binary image data in the original format',
        content: {
          'image/jpeg': {
            schema: resolver(z.string()),
          },
          'image/png': {
            schema: resolver(z.string()),
          },
          'image/gif': {
            schema: resolver(z.string()),
          },
          'image/webp': {
            schema: resolver(z.string()),
          },
        },
      },
      404: {
        description: 'Art not found',
        content: {
          'application/json': {
            schema: resolver(z.object({ error: z.string() })),
          },
        },
      },
    },
  }),
  validator('param', z.object({ id: z.string() })),
  async (c) => {
    const id = c.req.valid('param').id;
    const art = getArtFromCache(id);
    if (!art) {
      return c.json({ error: 'Art not found' }, 404);
    }

    return c.body(art.buffer, 200, {
      'Content-Type': art.mime,
      'Cache-Control': 'max-age=31536000',
    });
  },
);

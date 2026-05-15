import { z } from 'zod';

export const paginationMetaSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: paginationMetaSchema,
  });
}

export type PaginatedResponse<T> = {
  data: T[];
  meta: z.infer<typeof paginationMetaSchema>;
};

export const trackSchema = z.object({
  id: z.number(),
  albumId: z.number().nullable(),
  artistId: z.number().nullable(),
  name: z.string(),
  link: z.string(),
  artist: z.array(z.string()).nullable(),
  album: z.array(z.string()).nullable(),
  lastPlayed: z.string().optional(),
  length: z.string(),
  art: z.array(z.string()).nullable(),
  track: z
    .object({
      no: z.number(),
    })
    .optional(),
  fileType: z.string(),
  status: z.enum(['active', 'missing']),
  meta: z.any().optional(),
});

export type Track = z.infer<typeof trackSchema>;

export const albumSchema = z.object({
  id: z.number(),
  name: z.string(),
  artist: z.array(z.string()).nullable(),
  art: z.array(z.string()).nullable(),
  trackCount: z.number(),
});

export type Album = z.infer<typeof albumSchema>;

export const artistSchema = z.object({
  id: z.number(),
  name: z.string(),
  art: z.array(z.string()).nullable(),
  trackCount: z.number(),
  albumCount: z.number(),
});

export type Artist = z.infer<typeof artistSchema>;

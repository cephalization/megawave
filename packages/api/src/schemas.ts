import { z } from "zod";

export const paginationSchema = z.object({
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const trackSchema = z.object({
  id: z.union([z.string(), z.number()]),
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
});

export type Track = z.infer<typeof trackSchema>;

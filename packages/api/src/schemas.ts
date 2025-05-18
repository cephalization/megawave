import { z } from "zod";

export const paginationMetaSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
});

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

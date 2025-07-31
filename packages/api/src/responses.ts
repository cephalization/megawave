import type { Context } from 'hono';
import type { TypedResponse } from 'hono/types';
import type {
  ContentfulStatusCode,
  SuccessStatusCode,
} from 'hono/utils/http-status';
import type { z, ZodSchema } from 'zod';

import { paginatedResponseSchema, paginationMetaSchema } from './schemas.js';

/**
 * Return a hono JSON response with strict IDE type inference and runtime validation.
 *
 * @param c - The hono context
 * @param schema - The zod schema to validate the response against
 * @param data - The data to return in the response
 * @param statusCode - The status code to return in the response
 * @returns The hono response
 */
export function strictJSONResponse<
  C extends Context,
  S extends ZodSchema,
  D extends Parameters<Context['json']>[0] & z.infer<S>,
  U extends Extract<ContentfulStatusCode, SuccessStatusCode>,
>(
  c: C,
  schema: S,
  data: D,
  statusCode?: U,
): TypedResponse<D, U, 'json'> | TypedResponse<{ error: string }, 500, 'json'> {
  const validatedResponse = schema.safeParse(data);

  if (!validatedResponse.success) {
    return c.json(
      {
        error: 'Strict response validation failed',
      },
      500,
    );
  }

  return c.json(validatedResponse.data, statusCode);
}

export function paginatedJSONResponse<
  C extends Context,
  T extends z.ZodTypeAny,
  U extends Extract<ContentfulStatusCode, SuccessStatusCode>,
>(
  c: C,
  itemSchema: T,
  data: z.infer<T>[],
  meta: z.infer<typeof paginationMetaSchema>,
  statusCode?: U,
) {
  const schema = paginatedResponseSchema(itemSchema);
  const response = { data, meta };
  return strictJSONResponse(c, schema, response, statusCode);
}

export function getContentTypeFromExtension(extension: string): string {
  if (extension === 'mp3') {
    return 'audio/mpeg';
  } else if (extension === 'wav') {
    return 'audio/wav';
  }
  return '';
}

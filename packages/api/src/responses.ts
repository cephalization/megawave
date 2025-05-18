import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { z, ZodSchema } from "zod";

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
  D extends Parameters<Context["json"]>[0] & z.infer<S>,
  U extends ContentfulStatusCode
>(c: C, schema: S, data: D, statusCode?: U) {
  const validatedResponse = schema.safeParse(data);

  if (!validatedResponse.success) {
    return c.json(
      {
        message: "Strict response validation failed",
      },
      500
    );
  }

  return c.json(validatedResponse.data, statusCode);
}

import { z } from "zod";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";

import { paginatedResponseSchema, trackSchema } from "./schemas.js";
import { paginatedJSONResponse } from "./responses.js";
import { getNextUrl, getPreviousUrl } from "./pagination.js";

export const tracksRouter = new Hono().get(
  "/",
  describeRoute({
    tags: ["tracks"],
    summary: "List tracks",
    description: "List tracks",
    responses: {
      200: {
        description: "Tracks",
        content: {
          "application/json": {
            schema: resolver(paginatedResponseSchema(trackSchema)),
          },
        },
      },
    },
  }),
  validator(
    "query",
    z.object({
      limit: z.coerce.number().optional().default(10),
      offset: z.coerce.number().optional().default(0),
    })
  ),
  async (c) => {
    const library = c.get("library");
    const query = c.req.valid("query");
    const tracks = library.getTracks({
      limit: query.limit,
      offset: query.offset,
    });
    return paginatedJSONResponse(c, trackSchema, tracks.data, {
      ...tracks.meta,
      next: getNextUrl(c.req.url, query.limit, query.offset, tracks.meta.total),
      previous: getPreviousUrl(c.req.url, query.limit, query.offset),
    });
  }
);

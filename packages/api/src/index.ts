import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { openAPISpecs } from "hono-openapi";
import { makeDb } from "db";

import { HOST, MUSIC_LIBRARY_PATH, PORT, DATABASE_PATH } from "./env.js";
import { getServerUrl } from "./util.js";
import { artRouter, statusRouter, songsRouter } from "./router.js";
import { Scalar } from "@scalar/hono-api-reference";
import { Library } from "./library.js";
import { logger } from "hono/logger";

declare module "hono" {
  interface ContextVariableMap {
    library: Library;
  }
}

const db = makeDb(DATABASE_PATH);
const library = new Library(db);

const app = new Hono().basePath("/api");
app.use(cors());
app.use(logger());
app.use(async (c, next) => {
  c.set("library", library);
  await next();
});

// chain new routers to the end of this for proper type inference
const libraryRouter = new Hono().basePath("/library");
const router = app.route(
  "/",
  libraryRouter
    .route("/", statusRouter)
    .route("/", songsRouter)
    .route("/", artRouter)
);

export type AppType = typeof router;

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Megawave API",
        version: "1.0.0",
        description: "Search and stream music",
      },
      servers: [
        { url: getServerUrl().toString(), description: "Local Server" },
      ],
    },
  })
);

app.get("/docs", Scalar({ url: "openapi", theme: "saturn" }));

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  },
  (info) => {
    console.log("");
    console.log(`Server:              ${getServerUrl("/api")}`);
    console.log(`API Reference:       ${getServerUrl("/api/docs")}`);
    console.log(`OpenAPI Schema:      ${getServerUrl("/api/openapi")}`);
    console.log("");
    library.load(MUSIC_LIBRARY_PATH.split(","));
  }
);

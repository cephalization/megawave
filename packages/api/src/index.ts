import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { openAPISpecs } from "hono-openapi";

import { HOST, PORT } from "./env.js";
import { getServerUrl } from "./util.js";
import { tracksRouter } from "./router.js";
import { Scalar } from "@scalar/hono-api-reference";
import { Library } from "./library.js";

declare module "hono" {
  interface ContextVariableMap {
    library: Library;
  }
}

const library = new Library();

const app = new Hono();
app.use(cors());
app.use(async (c, next) => {
  c.set("library", library);
  await next();
});

// chain new routers to the end of this for proper type inference
const router = app.route("/tracks", tracksRouter);

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

app.get("/docs", Scalar({ url: "/openapi", theme: "saturn" }));

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  },
  (info) => {
    console.log(`Server:              ${getServerUrl()}`);
    console.log(`API Reference:       ${getServerUrl("/docs")}`);
    console.log(`OpenAPI Schema:      ${getServerUrl("/openapi")}`);
  }
);

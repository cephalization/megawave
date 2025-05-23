import { hc } from "hono/client";

import type { AppType } from "./index.js";

// this is a trick to calculate the type when compiling
const client = hc<AppType>("");
export type Client = typeof client;

export const makeMegawaveClient = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);

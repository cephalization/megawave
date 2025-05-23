import { parseEnv } from "znv";
import { z } from "zod";
import "dotenv/config";

const DATABASE_NAME = "megawave.db";

export const { PORT, HOST, PROTOCOL, MUSIC_LIBRARY_PATH, DATABASE_PATH } =
  parseEnv(process.env, {
    PORT: z.number().int().positive().default(5001),
    HOST: z.string().default("0.0.0.0"),
    PROTOCOL: z.enum(["http", "https"]).default("http"),
    MUSIC_LIBRARY_PATH: z.string(),
    DATABASE_PATH: z
      .string()
      .transform((val) => (val.endsWith("/") ? val : `${val}/`))
      .transform((val) => `file:${val}${DATABASE_NAME}`),
  });

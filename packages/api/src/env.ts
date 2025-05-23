import { parseEnv } from "znv";
import { z } from "zod";
import "dotenv/config";

export const { PORT, HOST, PROTOCOL, MUSIC_LIBRARY_PATH } = parseEnv(
  process.env,
  {
    PORT: z.number().int().positive().default(5001),
    HOST: z.string().default("0.0.0.0"),
    PROTOCOL: z.enum(["http", "https"]).default("http"),
    MUSIC_LIBRARY_PATH: z.string(),
  }
);

import { HOST, PORT, PROTOCOL } from "./env.js";

export const getServerUrl = (path: string = "") => {
  const url = new URL(path, `${PROTOCOL}://${HOST}:${PORT}`);
  return url;
};

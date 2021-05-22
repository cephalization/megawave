export type Track = {
  id: string;
  name: string;
  link: string;
  artist: string[] | null;
  album: string[] | null;
  lastPlayed?: string;
  length: string;
};

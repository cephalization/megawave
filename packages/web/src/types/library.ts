export type Track = {
  id: string | number;
  name: string;
  link: string;
  artist: string[] | null;
  album: string[] | null;
  lastPlayed?: string;
  length: string;
  art: string[] | null;
  track?: {
    no: number;
  };
};

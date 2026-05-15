export type Track = {
  id: string | number;
  albumId: number | null;
  artistId: number | null;
  name: string;
  link: string;
  artist: string[] | null;
  album: string[] | null;
  lastPlayed?: string;
  length: string;
  art: string[] | null;
  fileType: string;
  status: 'active' | 'missing';
  track?: {
    no: number;
  };
};

export type Album = {
  id: number;
  name: string;
  artist: string[] | null;
  art: string[] | null;
  trackCount: number;
};

export type Artist = {
  id: number;
  name: string;
  art: string[] | null;
  trackCount: number;
  albumCount: number;
};

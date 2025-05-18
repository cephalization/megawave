import type { Track } from "./schemas.js";

const makeFakeTrack = (index: number): Track => ({
  id: index.toString(),
  name: `test ${index}`,
  link: `https://example.com/${index}`,
  artist: ["test"],
  album: ["test"],
  length: `${Math.floor(Math.random() * 59)}:${Math.floor(Math.random() * 59)}`,
  art: ["https://example.com"],
  lastPlayed: "2021-01-01",
  track: { no: Math.floor(Math.random() * 100) },
});

export class Library {
  tracks: Track[] = [];
  constructor() {
    this.initialize();
  }

  async initialize() {
    this.tracks = [
      ...Array.from({ length: 100 }, (_, index) => makeFakeTrack(index)),
    ];
  }

  getTracks({ limit, offset }: { limit?: number; offset?: number }) {
    return this.tracks.slice(
      offset ?? 0,
      (offset ?? 0) + (limit ?? this.tracks.length)
    );
  }

  getTrack(id: string) {
    return this.tracks.find((track) => track.id === id);
  }
}

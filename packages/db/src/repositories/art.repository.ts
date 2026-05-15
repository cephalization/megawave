import { eq } from 'drizzle-orm';

import type { DB } from '../index.js';
import { trackArt } from '../schema.js';

type CachedArt = typeof trackArt.$inferSelect;

export class ArtRepository {
  private readonly cache = new Map<number, CachedArt>();

  constructor(private readonly db: DB) {}

  async findByTrackId(trackId: number) {
    return this.db.select().from(trackArt).where(eq(trackArt.trackId, trackId));
  }

  async findById(id: number) {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const rows = await this.db
      .select()
      .from(trackArt)
      .where(eq(trackArt.id, id))
      .limit(1);
    const art = rows[0] ?? null;
    if (art) this.cache.set(id, art);
    return art;
  }

  async replaceForTrack(
    trackId: number,
    art: Pick<typeof trackArt.$inferInsert, 'mime' | 'data' | 'description'>[],
  ) {
    await this.db.delete(trackArt).where(eq(trackArt.trackId, trackId));
    for (const item of art) {
      await this.db.insert(trackArt).values({ ...item, trackId });
    }
  }
}

import { count, eq, inArray } from 'drizzle-orm';

import type { DB } from '../index.js';
import { trackArt, tracks } from '../schema.js';

export type TrackRow = typeof tracks.$inferSelect;
export type TrackInsert = typeof tracks.$inferInsert;

export class TrackRepository {
  constructor(private readonly db: DB) {}

  async count() {
    const rows = await this.db.select({ value: count() }).from(tracks);
    return rows[0]?.value ?? 0;
  }

  async findById(id: number) {
    const rows = await this.db
      .select()
      .from(tracks)
      .where(eq(tracks.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByContentHash(contentHash: string) {
    const rows = await this.db
      .select()
      .from(tracks)
      .where(eq(tracks.contentHash, contentHash))
      .limit(1);
    return rows[0] ?? null;
  }

  async allWithArtIds() {
    return this.db
      .select({ track: tracks, artId: trackArt.id })
      .from(tracks)
      .leftJoin(trackArt, eq(trackArt.trackId, tracks.id));
  }

  async upsertByContentHash(values: TrackInsert) {
    const existing = await this.findByContentHash(values.contentHash);
    if (existing) {
      const updated = await this.db
        .update(tracks)
        .set({ ...values, id: existing.id, status: 'active' })
        .where(eq(tracks.id, existing.id))
        .returning();
      return { track: updated[0], created: false };
    }

    const inserted = await this.db
      .insert(tracks)
      .values({ ...values, status: 'active' })
      .returning();
    return { track: inserted[0], created: true };
  }

  async markMissing(ids: number[]) {
    if (ids.length === 0) return;
    await this.db
      .update(tracks)
      .set({ status: 'missing', dateModified: Date.now() })
      .where(inArray(tracks.id, ids));
  }
}

import { and, eq, isNull } from 'drizzle-orm';

import type { DB } from '../index.js';
import { albums } from '../schema.js';

export class AlbumRepository {
  constructor(private readonly db: DB) {}

  async findOrCreate(title: string, primaryArtistId?: number, year?: number) {
    const where = primaryArtistId
      ? and(eq(albums.title, title), eq(albums.primaryArtistId, primaryArtistId))
      : and(eq(albums.title, title), isNull(albums.primaryArtistId));
    const existing = await this.db.select().from(albums).where(where).limit(1);

    if (existing[0]) return existing[0];

    const inserted = await this.db
      .insert(albums)
      .values({ title, primaryArtistId, year })
      .returning();
    return inserted[0];
  }
}

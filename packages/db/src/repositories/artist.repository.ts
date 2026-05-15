import { eq } from 'drizzle-orm';

import type { DB } from '../index.js';
import { artists } from '../schema.js';

export class ArtistRepository {
  constructor(private readonly db: DB) {}

  async findOrCreate(name: string) {
    const existing = await this.db
      .select()
      .from(artists)
      .where(eq(artists.name, name))
      .limit(1);

    if (existing[0]) return existing[0];

    const inserted = await this.db.insert(artists).values({ name }).returning();
    return inserted[0];
  }
}

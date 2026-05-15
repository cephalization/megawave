import { eq } from 'drizzle-orm';

import type { DB } from '../index.js';
import { genres } from '../schema.js';

export class GenreRepository {
  constructor(private readonly db: DB) {}

  async findOrCreate(name: string) {
    const existing = await this.db
      .select()
      .from(genres)
      .where(eq(genres.name, name))
      .limit(1);

    if (existing[0]) return existing[0];

    const inserted = await this.db.insert(genres).values({ name }).returning();
    return inserted[0];
  }
}

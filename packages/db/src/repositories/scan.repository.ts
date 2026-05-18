import { and, eq, notExists, sql } from 'drizzle-orm';

import type { DB } from '../index.js';
import { scanSessions, trackScans, tracks } from '../schema.js';

export type ScanStats = {
  tracksFound: number;
  tracksAdded: number;
  tracksUpdated: number;
  tracksMissing: number;
  tracksErrored: number;
  lastError?: string;
  status: 'completed' | 'failed' | 'cancelled';
};

export class ScanRepository {
  constructor(private readonly db: DB) {}

  async startSession(paths: string[]) {
    const inserted = await this.db
      .insert(scanSessions)
      .values({
        startTime: Date.now(),
        pathsScanned: JSON.stringify(paths),
        status: 'running',
        tracksFound: 0,
        tracksAdded: 0,
        tracksUpdated: 0,
        tracksMissing: 0,
        tracksErrored: 0,
      })
      .returning();
    return inserted[0];
  }

  async recordTrackSeen(
    scanSessionId: number,
    trackId: number,
    filePath: string,
  ) {
    await this.db
      .insert(trackScans)
      .values({ scanSessionId, trackId, filePath });
  }

  async getTracksNotInScan(scanSessionId: number) {
    const rows = await this.db
      .select({ id: tracks.id })
      .from(tracks)
      .where(
        and(
          eq(tracks.status, 'active'),
          notExists(
            this.db
              .select({ one: sql`1` })
              .from(trackScans)
              .where(
                and(
                  eq(trackScans.trackId, tracks.id),
                  eq(trackScans.scanSessionId, scanSessionId),
                ),
              ),
          ),
        ),
      );
    return rows.map((row) => row.id);
  }

  async endSession(id: number, stats: ScanStats) {
    await this.db
      .update(scanSessions)
      .set({ ...stats, endTime: Date.now() })
      .where(eq(scanSessions.id, id));
  }
}

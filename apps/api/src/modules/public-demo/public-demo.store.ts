import {
  GoneException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  PublicDemoModuleId,
  PublicDemoScenarioId,
} from './public-demo.seed';

export type PublicDemoPreviewRecord = {
  id: string;
  moduleId: PublicDemoModuleId;
  reportId: string;
  totalRows: number;
  createdAt: string;
};

export type PublicDemoOverlay = {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  activeScenario: PublicDemoScenarioId;
  reportPreviews: PublicDemoPreviewRecord[];
  resetVersion: number;
};

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const DEFAULT_MAX_SESSIONS = 5000;
const MAX_PREVIEW_HISTORY = 12;

function boundedInteger(
  raw: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(raw);
  return Number.isInteger(parsed)
    ? Math.min(Math.max(parsed, minimum), maximum)
    : fallback;
}

@Injectable()
export class PublicDemoStore {
  private readonly overlays = new Map<string, PublicDemoOverlay>();
  private readonly expiredSessions = new Map<string, number>();
  private readonly ttlMs = boundedInteger(
    process.env.PUBLIC_DEMO_OVERLAY_TTL_MS,
    DEFAULT_TTL_MS,
    1000,
    2 * 60 * 60 * 1000,
  );
  private readonly maxSessions = boundedInteger(
    process.env.PUBLIC_DEMO_MAX_SESSIONS,
    DEFAULT_MAX_SESSIONS,
    1,
    100_000,
  );

  get(sessionId: string): PublicDemoOverlay {
    const now = Date.now();
    this.removeExpiredTombstones(now);
    if (this.expiredSessions.has(sessionId)) {
      throw new GoneException('The public demo session has expired.');
    }

    const existing = this.overlays.get(sessionId);
    if (existing && Date.parse(existing.expiresAt) <= now) {
      this.expire(sessionId, now);
      throw new GoneException('The public demo session has expired.');
    }
    if (existing) return this.copy(existing);

    this.expireInactiveOverlays(now);
    if (this.overlays.size >= this.maxSessions) {
      throw new ServiceUnavailableException(
        'The public demo is at capacity. Try again later.',
      );
    }

    const createdAt = new Date(now).toISOString();
    const overlay: PublicDemoOverlay = {
      sessionId,
      createdAt,
      expiresAt: new Date(now + this.ttlMs).toISOString(),
      activeScenario: 'baseline',
      reportPreviews: [],
      resetVersion: 0,
    };
    this.overlays.set(sessionId, overlay);
    return this.copy(overlay);
  }

  selectScenario(
    sessionId: string,
    scenario: PublicDemoScenarioId,
  ): PublicDemoOverlay {
    const overlay = this.requireMutable(sessionId);
    overlay.activeScenario = scenario;
    return this.copy(overlay);
  }

  recordPreview(
    sessionId: string,
    preview: Omit<PublicDemoPreviewRecord, 'id' | 'createdAt'>,
  ): PublicDemoPreviewRecord {
    const overlay = this.requireMutable(sessionId);
    const record: PublicDemoPreviewRecord = {
      ...preview,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    overlay.reportPreviews.unshift(record);
    overlay.reportPreviews = overlay.reportPreviews.slice(
      0,
      MAX_PREVIEW_HISTORY,
    );
    return { ...record };
  }

  reset(sessionId: string): PublicDemoOverlay {
    const overlay = this.requireMutable(sessionId);
    overlay.activeScenario = 'baseline';
    overlay.reportPreviews = [];
    overlay.resetVersion += 1;
    return this.copy(overlay);
  }

  private requireMutable(sessionId: string): PublicDemoOverlay {
    this.get(sessionId);
    return this.overlays.get(sessionId)!;
  }

  private expireInactiveOverlays(now: number) {
    for (const [sessionId, overlay] of this.overlays) {
      if (Date.parse(overlay.expiresAt) <= now) this.expire(sessionId, now);
    }
  }

  private expire(sessionId: string, now: number) {
    this.overlays.delete(sessionId);
    this.expiredSessions.set(sessionId, now + this.ttlMs);
  }

  private removeExpiredTombstones(now: number) {
    for (const [sessionId, expiresAt] of this.expiredSessions) {
      if (expiresAt <= now) this.expiredSessions.delete(sessionId);
    }
  }

  private copy(overlay: PublicDemoOverlay): PublicDemoOverlay {
    return {
      ...overlay,
      reportPreviews: overlay.reportPreviews.map((preview) => ({ ...preview })),
    };
  }
}

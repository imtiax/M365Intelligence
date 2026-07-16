import { GoneException } from '@nestjs/common';
import { PublicDemoReportPreviewDto } from './public-demo.dto';
import {
  PUBLIC_DEMO_ENTERPRISE,
  PUBLIC_DEMO_SEED,
} from './public-demo.seed';
import { PublicDemoService } from './public-demo.service';
import { PublicDemoStore } from './public-demo.store';

const SESSION_A = '11111111-1111-4111-8111-111111111111';
const SESSION_B = '22222222-2222-4222-8222-222222222222';

function moduleQuery(search = '', risk = '', limit = 100) {
  return { search, risk, limit };
}

describe('PublicDemoService', () => {
  it('uses a frozen sanitized seed with reserved example domains', () => {
    expect(Object.isFrozen(PUBLIC_DEMO_SEED)).toBe(true);
    expect(Object.isFrozen(PUBLIC_DEMO_ENTERPRISE)).toBe(true);
    expect(Object.isFrozen(PUBLIC_DEMO_ENTERPRISE.users)).toBe(true);
    expect(PUBLIC_DEMO_SEED.tenant.primaryDomain).toBe('northstar.example');
    expect(PUBLIC_DEMO_ENTERPRISE.users[0].username).toMatch(
      /@northstar\.example$/,
    );
    expect(JSON.stringify(PUBLIC_DEMO_ENTERPRISE).toLowerCase()).not.toContain(
      'globalholdings',
    );
  });

  it('isolates scenarios, previews, and reset state by demo session', () => {
    const service = new PublicDemoService(new PublicDemoStore());
    service.selectScenario(SESSION_A, 'identity-risk');

    const preview = Object.assign(new PublicDemoReportPreviewDto(), {
      moduleId: 'reporting' as const,
      reportId: 'reporting-posture',
      columns: ['displayName', 'owner', 'status', 'risk'],
      filters: [{ field: 'risk' as const, operator: 'gte' as const, value: '50' }],
      limit: 10,
    });
    const report = service.reportPreview(SESSION_A, preview) as {
      rows: string[][];
      description: string;
    };
    expect(report.rows.length).toBeGreaterThan(0);
    expect(report.description).toContain('Synthetic demonstration data only');

    const first = service.bootstrap(SESSION_A, 'security');
    const second = service.bootstrap(SESSION_B, 'executive');
    expect(first.activeScenario.id).toBe('identity-risk');
    expect(first.recentReportPreviews).toHaveLength(1);
    expect(second.activeScenario.id).toBe('baseline');
    expect(second.recentReportPreviews).toHaveLength(0);

    const reset = service.reset(SESSION_B);
    expect(reset).toMatchObject({
      demoSessionId: SESSION_B,
      resetVersion: 1,
      activeScenario: 'baseline',
    });
    expect(service.bootstrap(SESSION_A, 'security').activeScenario.id).toBe(
      'identity-risk',
    );
  });

  it('returns legacy-compatible synthetic module projections', () => {
    const service = new PublicDemoService(new PublicDemoStore());
    const overview = service.module(
      SESSION_A,
      'overview',
      moduleQuery(),
    ) as { tenant: { name: string }; objectCounts: { users: number } };
    const users = service.module(
      SESSION_A,
      'users',
      moduleQuery('', 'High', 50),
    ) as { total: number; items: Array<{ username: string }> };
    const operations = service.module(
      SESSION_A,
      'report-operations',
      moduleQuery(),
    ) as { summary: { views: number }; views: unknown[] };

    expect(overview.tenant.name).toBe('Northstar Example Group');
    expect(overview.objectCounts.users).toBe(5000);
    expect(users.total).toBe(24);
    expect(users.items.every((user) => user.username.endsWith('.example'))).toBe(
      true,
    );
    expect(operations.summary.views).toBe(3);
    expect(operations.views).toHaveLength(3);
  });

  it('returns deterministic AI output without exposing customer data', () => {
    const service = new PublicDemoService(new PublicDemoStore());
    const request = Object.assign(new PublicDemoReportPreviewDto(), {
      kind: 'ai' as const,
      question: 'Show security risk',
    });
    const result = service.reportPreview(SESSION_A, request) as {
      answer: string;
      sources: string[];
    };
    expect(result.answer).toContain('No customer evidence was queried');
    expect(result.sources).toHaveLength(3);
    expect(JSON.stringify(result)).toContain('synthetic');
  });

  it('expires an overlay without changing another active session', () => {
    const original = process.env.PUBLIC_DEMO_OVERLAY_TTL_MS;
    process.env.PUBLIC_DEMO_OVERLAY_TTL_MS = '1000';
    jest.useFakeTimers().setSystemTime(new Date('2026-07-17T00:00:00.000Z'));
    try {
      const store = new PublicDemoStore();
      store.get(SESSION_A);
      jest.advanceTimersByTime(1001);
      expect(() => store.get(SESSION_A)).toThrow(GoneException);
      expect(store.get(SESSION_B).activeScenario).toBe('baseline');
    } finally {
      jest.useRealTimers();
      if (original === undefined) delete process.env.PUBLIC_DEMO_OVERLAY_TTL_MS;
      else process.env.PUBLIC_DEMO_OVERLAY_TTL_MS = original;
    }
  });
});

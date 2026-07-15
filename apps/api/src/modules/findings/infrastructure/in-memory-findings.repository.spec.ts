import { InMemoryFindingsRepository } from './in-memory-findings.repository';

describe('InMemoryFindingsRepository', () => {
  const repository = new InMemoryFindingsRepository();

  it('projects every result into the active tenant boundary', async () => {
    const findings = await repository.list('tenant-under-test', { limit: 100 });
    expect(findings).not.toHaveLength(0);
    expect(findings.every((finding) => finding.tenantId === 'tenant-under-test')).toBe(true);
  });

  it('applies severity and bounded list filters', async () => {
    const findings = await repository.list('tenant-under-test', { severity: 'high', limit: 1 });
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('high');
  });

  it('does not return an unknown finding', async () => {
    await expect(repository.get('tenant-under-test', 'not-present')).resolves.toBeUndefined();
  });
});


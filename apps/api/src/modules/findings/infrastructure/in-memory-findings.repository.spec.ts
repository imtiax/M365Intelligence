import { InMemoryFindingsRepository } from "./in-memory-findings.repository";

describe("InMemoryFindingsRepository", () => {
  const repository = new InMemoryFindingsRepository();

  it("starts with no findings until a tenant collector persists evidence", async () => {
    const findings = await repository.list("tenant-under-test", { limit: 100 });
    expect(findings).toEqual([]);
  });

  it("does not manufacture records for a filter", async () => {
    const findings = await repository.list("tenant-under-test", {
      severity: "high",
      limit: 1,
    });
    expect(findings).toEqual([]);
  });

  it("does not return an unknown finding", async () => {
    await expect(
      repository.get("tenant-under-test", "not-present"),
    ).resolves.toBeUndefined();
  });
});

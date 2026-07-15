import { ForbiddenException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LocalStateService, DEMO_TENANT } from "../runtime/local-state.service";
import { OperationsService } from "./operations.service";

const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

describe("OperationsService acceptance logic", () => {
  const path = join(tmpdir(), `m365-runtime-${process.pid}-${Date.now()}.json`);
  let store: LocalStateService;
  let service: OperationsService;

  beforeAll(() => {
    process.env.RUNTIME_DATA_PATH = path;
    store = new LocalStateService();
    service = new OperationsService(store);
  });

  afterAll(() => rmSync(path, { force: true }));

  it("seeds ten admin centers and thousands of persistent resources", () => {
    const response = service.adminCenters(DEMO_TENANT);
    expect(response.items).toHaveLength(10);
    expect(response.items.reduce((total, item) => total + item.total, 0)).toBe(
      7850,
    );
  });

  it("executes a custom-column report job to completion", async () => {
    const job = service.createReport(
      DEMO_TENANT,
      "report.author@apex.local",
      randomUUID(),
      {
        name: "Identity acceptance report",
        workload: "Microsoft Entra ID",
        columns: ["Display name", "Risk score", "Owner"],
      },
    );
    await pause(900);
    const completed = service.getReport(DEMO_TENANT, job.id);
    expect(completed.status).toBe("completed");
    expect(completed.result?.totalRows).toBe(1400);
    expect(completed.result?.columns).toEqual([
      "Display name",
      "Risk score",
      "Owner",
    ]);
    expect(completed.result?.rows).toHaveLength(250);
  });

  it("enforces separation of duties and completes an approved workflow", async () => {
    const workflow = service.createWorkflow(
      DEMO_TENANT,
      "requester@apex.local",
      randomUUID(),
      {
        title: "Reclaim inactive licenses",
        type: "license-remediation",
        targetScope: "87 validated test assignments",
        justification: "End-to-end acceptance test",
      },
    );
    service.submitWorkflow(
      DEMO_TENANT,
      workflow.id,
      "requester@apex.local",
      randomUUID(),
    );
    expect(() =>
      service.approveWorkflow(
        DEMO_TENANT,
        workflow.id,
        "requester@apex.local",
        randomUUID(),
      ),
    ).toThrow(ForbiddenException);
    service.approveWorkflow(
      DEMO_TENANT,
      workflow.id,
      "approver@apex.local",
      randomUUID(),
    );
    service.executeWorkflow(
      DEMO_TENANT,
      workflow.id,
      "engine@apex.local",
      randomUUID(),
    );
    await pause(800);
    const completed = service.getWorkflow(DEMO_TENANT, workflow.id);
    expect(completed.state).toBe("completed");
    expect(completed.execution?.failed).toBe(0);
    expect(completed.steps.every((step) => step.status === "passed")).toBe(
      true,
    );
  });

  it("records injected failure paths without committing target changes", async () => {
    const workflow = service.createWorkflow(
      DEMO_TENANT,
      "requester@apex.local",
      randomUUID(),
      {
        title: "Failure-path validation",
        type: "acceptance-failure",
        targetScope: "failure-test scope",
        justification: "Prove deterministic failure handling",
      },
    );
    service.submitWorkflow(
      DEMO_TENANT,
      workflow.id,
      "requester@apex.local",
      randomUUID(),
    );
    service.approveWorkflow(
      DEMO_TENANT,
      workflow.id,
      "approver@apex.local",
      randomUUID(),
    );
    service.executeWorkflow(
      DEMO_TENANT,
      workflow.id,
      "engine@apex.local",
      randomUUID(),
    );
    await pause(800);
    const failed = service.getWorkflow(DEMO_TENANT, workflow.id);
    expect(failed.state).toBe("failed");
    expect(failed.execution?.succeeded).toBe(0);
    expect(failed.execution?.message).toContain("no target changes");
  });

  it("maintains a verifiable chained audit history", () => {
    const audit = service.audit(DEMO_TENANT);
    expect(audit.length).toBeGreaterThan(10);
    expect(
      audit.every(
        (item, index) =>
          index === audit.length - 1 ||
          item.previousHash === audit[index + 1].hash,
      ),
    ).toBe(true);
  });
});

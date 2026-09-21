import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { randomUUID } from "node:crypto";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Request } from "express";
import {
  DEMO_TENANT,
  LocalStateService,
} from "../runtime/local-state.service";
import type { RuntimeState } from "../runtime/runtime.types";
import type { PlatformRole } from "../../shared/security/tenant-context";
import { OperationsController } from "./operations.controller";
import {
  CreateReportAlertDto,
  CreateReportScheduleDto,
  CreateReportViewDto,
} from "./operations.dto";
import { OperationsService } from "./operations.service";

const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

describe("Persistent enterprise reporting operations", () => {
  let path: string;
  let store: LocalStateService;
  let service: OperationsService;

  beforeEach(() => {
    path = join(tmpdir(), `m365-reporting-${randomUUID()}.json`);
    process.env.RUNTIME_DATA_PATH = path;
    store = new LocalStateService();
    service = new OperationsService(store);
  });

  afterEach(() => rmSync(path, { force: true }));

  it("persists a filtered saved view, schedule, alert, run history, and audit evidence", async () => {
    const actorId = "report.author@local.invalid";
    const view = service.createReportView(
      DEMO_TENANT,
      actorId,
      randomUUID(),
      {
        reportId: "identity-risk-detail",
        name: "Finance identity risk",
        reportName: "Identity Risk Operations",
        workload: "Microsoft Entra ID",
        description: "Finance resources at or above the governed risk threshold.",
        columns: ["Display name", "Department", "Risk score", "Region"],
        filters: [
          {
            field: "department",
            operator: "equals",
            value: "Finance",
            logic: "and",
          },
          {
            field: "risk",
            operator: "gte",
            value: "60",
            logic: "and",
          },
        ],
        visibility: "team",
        favorite: true,
      },
    );
    expect(view).toMatchObject({
      tenantId: DEMO_TENANT,
      status: "active",
      createdBy: actorId,
      favorite: true,
    });

    expect(() =>
      service.createReportSchedule(
        DEMO_TENANT,
        actorId,
        randomUUID(),
        view.id,
        {
          name: "Invalid weekly schedule",
          cadence: "weekly",
          timezone: "Asia/Dubai",
          runAt: "08:30",
          delivery: "local_archive",
          status: "active",
        },
      ),
    ).toThrow(BadRequestException);

    const schedule = service.createReportSchedule(
      DEMO_TENANT,
      actorId,
      randomUUID(),
      view.id,
      {
        name: "Monday FinOps review",
        cadence: "weekly",
        timezone: "Asia/Dubai",
        runAt: "08:30",
        dayOfWeek: 1,
        delivery: "local_archive",
        status: "active",
      },
    );
    expect(Date.parse(schedule.nextRunAt ?? "")).toBeGreaterThan(Date.now());
    const alert = service.createReportAlert(
      DEMO_TENANT,
      actorId,
      randomUUID(),
      view.id,
      {
        name: "Filtered rows detected",
        metric: "row_count",
        operator: "gt",
        threshold: 0,
        severity: "warning",
        status: "active",
      },
    );

    const queued = service.runReportSchedule(
      DEMO_TENANT,
      actorId,
      randomUUID(),
      schedule.id,
    );
    expect(queued).toMatchObject({
      viewId: view.id,
      scheduleId: schedule.id,
      trigger: "schedule_manual",
      status: "queued",
    });
    await pause(900);

    const completed = service.getReport(
      DEMO_TENANT,
      queued.id,
      actorId,
      false,
    );
    const expected = store
      .snapshot()
      .resources.filter(
        (item) =>
          item.tenantId === DEMO_TENANT &&
          item.workload === "Microsoft Entra ID" &&
          item.department === "Finance" &&
          item.risk >= 60,
      ).length;
    expect(expected).toBeGreaterThan(0);
    expect(completed.status).toBe("completed");
    expect(completed.result?.totalRows).toBe(expected);
    expect(
      completed.result?.rows.every(
        (row) => row[1] === "Finance" && Number(row[2]) >= 60,
      ),
    ).toBe(true);

    const evaluatedAlert = store
      .snapshot()
      .reportAlerts.find((item) => item.id === alert.id);
    expect(evaluatedAlert).toMatchObject({
      lastObservedValue: expected,
    });
    expect(evaluatedAlert?.lastEvaluatedAt).toBeDefined();
    expect(evaluatedAlert?.lastTriggeredAt).toBeDefined();
    expect(
      store.snapshot().reportSchedules.find((item) => item.id === schedule.id)
        ?.lastRunAt,
    ).toBe(queued.createdAt);

    const operations = service.reportOperations(
      DEMO_TENANT,
      actorId,
      false,
      20,
    );
    expect(operations.summary).toMatchObject({
      views: 1,
      activeSchedules: 1,
      activeAlerts: 1,
      triggeredAlerts: 1,
    });
    expect(operations.runs[0]).toMatchObject({
      id: queued.id,
      status: "completed",
      result: { totalRows: expected },
      trigger: "schedule_manual",
    });
    expect(
      service.listReports(DEMO_TENANT, actorId, false, {
        status: "completed",
        trigger: "schedule_manual",
        viewId: view.id,
        limit: 10,
      }),
    ).toHaveLength(1);

    const auditActions = service
      .audit(DEMO_TENANT)
      .map((record) => record.action);
    expect(auditActions).toEqual(
      expect.arrayContaining([
        "report_view.created",
        "report_schedule.created",
        "report_alert.created",
        "report_schedule.run_requested",
        "report.requested",
        "report.completed",
        "report_alert.triggered",
      ]),
    );
    expect(service.auditIntegrity(DEMO_TENANT)).toBe(true);

    const reloaded = new LocalStateService().snapshot();
    expect(reloaded.version).toBe(4);
    expect(reloaded.reportViews.some((item) => item.id === view.id)).toBe(true);
    expect(
      reloaded.reportSchedules.some((item) => item.id === schedule.id),
    ).toBe(true);
    expect(reloaded.reportAlerts.some((item) => item.id === alert.id)).toBe(
      true,
    );
    expect(reloaded.reportJobs.some((item) => item.id === queued.id)).toBe(true);
    expect(
      service.reportOperations("another-tenant", actorId, true).summary.views,
    ).toBe(0);
  });

  it("migrates version 3 runtime files without losing existing report jobs", () => {
    const state = store.snapshot();
    const legacy = {
      ...state,
      version: 3,
      reportJobs: [
        {
          id: "legacy-report",
          tenantId: DEMO_TENANT,
          name: "Legacy completed report",
          workload: "Microsoft Entra ID",
          status: "completed",
          requestedBy: "legacy@local.invalid",
          createdAt: "2026-07-16T08:00:00.000Z",
          completedAt: "2026-07-16T08:01:00.000Z",
          progress: 100,
        },
      ],
    } as unknown as Record<string, unknown>;
    delete legacy.reportViews;
    delete legacy.reportSchedules;
    delete legacy.reportAlerts;
    writeFileSync(path, JSON.stringify(legacy), "utf8");

    const migrated = new LocalStateService().snapshot();
    expect(migrated.version).toBe(4);
    expect(migrated.reportViews).toEqual([]);
    expect(migrated.reportSchedules).toEqual([]);
    expect(migrated.reportAlerts).toEqual([]);
    expect(migrated.reportJobs[0]).toMatchObject({
      id: "legacy-report",
      trigger: "interactive",
      filters: [],
    });
    const persisted = JSON.parse(readFileSync(path, "utf8")) as RuntimeState;
    expect(persisted.version).toBe(4);
    expect(persisted.reportViews).toEqual([]);
  });

  it("protects private job results and evaluates alerts for an interactive saved-view run", async () => {
    const owner = "private.owner@local.invalid";
    const other = "other.reporter@local.invalid";
    const privateView = service.createReportView(
      DEMO_TENANT,
      owner,
      randomUUID(),
      {
        reportId: "private-critical-incidents",
        name: "Owner-only critical incidents",
        reportName: "Critical Defender incidents",
        workload: "Defender XDR",
        columns: ["Display name", "Status", "Risk score"],
        filters: [
          {
            field: "status",
            operator: "equals",
            value: "critical",
            logic: "and",
          },
        ],
        visibility: "private",
        favorite: false,
      },
    );
    const alert = service.createReportAlert(
      DEMO_TENANT,
      owner,
      randomUUID(),
      privateView.id,
      {
        name: "Critical results present",
        metric: "row_count",
        operator: "gt",
        threshold: 0,
        severity: "critical",
        status: "active",
      },
    );
    const linkedJob = service.runReportView(
      DEMO_TENANT,
      owner,
      randomUUID(),
      privateView.id,
    );
    const unlinkedJob = service.createReport(
      DEMO_TENANT,
      owner,
      randomUUID(),
      {
        name: "Owner-only ad hoc report",
        workload: "Defender XDR",
        columns: ["Display name"],
      },
    );

    expect(linkedJob).toMatchObject({
      viewId: privateView.id,
      trigger: "interactive",
      requestedColumns: privateView.columns,
      filters: privateView.filters,
    });
    expect(() =>
      service.getReport(DEMO_TENANT, linkedJob.id, other, false),
    ).toThrow(NotFoundException);
    expect(() =>
      service.getReport(DEMO_TENANT, unlinkedJob.id, other, false),
    ).toThrow(NotFoundException);
    expect(
      service.listReports(DEMO_TENANT, other, false, { limit: 100 }),
    ).toHaveLength(0);
    expect(
      service.reportOperations(DEMO_TENANT, other, false).runs,
    ).toHaveLength(0);
    expect(
      service.getReport(DEMO_TENANT, linkedJob.id, "platform@local.invalid", true)
        .id,
    ).toBe(linkedJob.id);

    await pause(900);
    const completed = service.getReport(
      DEMO_TENANT,
      linkedJob.id,
      owner,
      false,
    );
    expect(completed.result?.totalRows).toBeGreaterThan(0);
    expect(
      completed.result?.rows.every((row) => row[1] === "critical"),
    ).toBe(true);
    expect(
      store.snapshot().reportAlerts.find((item) => item.id === alert.id),
    ).toMatchObject({
      lastObservedValue: completed.result?.totalRows,
    });
    expect(
      store.snapshot().reportAlerts.find((item) => item.id === alert.id)
        ?.lastTriggeredAt,
    ).toBeDefined();

    const teamView = service.createReportView(
      DEMO_TENANT,
      owner,
      randomUUID(),
      {
        reportId: "team-warning-incidents",
        name: "Team warning incidents",
        reportName: "Warning Defender incidents",
        workload: "Defender XDR",
        columns: ["Display name", "Status"],
        filters: [
          {
            field: "status",
            operator: "equals",
            value: "warning",
            logic: "and",
          },
        ],
        visibility: "team",
        favorite: true,
      },
    );
    const teamJob = service.runReportView(
      DEMO_TENANT,
      owner,
      randomUUID(),
      teamView.id,
    );
    expect(service.getReport(DEMO_TENANT, teamJob.id, other, false).id).toBe(
      teamJob.id,
    );
    await pause(900);
  });

  it("enforces report or platform administrator roles and private ownership", () => {
    const controller = new OperationsController(service, store);
    const body = {
      reportId: "security-overview",
      name: "My private risk view",
      reportName: "Security Overview",
      workload: "Defender XDR",
      columns: ["Display name", "Status"],
      filters: [],
      visibility: "private" as const,
      favorite: false,
    };
    const requestFor = (actorId: string, roles: PlatformRole[]) =>
      ({
        tenantContext: { tenantId: DEMO_TENANT, actorId, roles },
        correlationId: randomUUID(),
      }) as Request;

    expect(() =>
      controller.createReportView(
        requestFor("viewer@local.invalid", ["read-only"]),
        body,
      ),
    ).toThrow(ForbiddenException);

    const authorRequest = requestFor("reports@local.invalid", ["report-admin"]);
    const view = controller.createReportView(authorRequest, body);
    expect(view.createdBy).toBe("reports@local.invalid");
    expect(() =>
      controller.runReportView(
        requestFor("viewer@local.invalid", ["read-only"]),
        view.id,
      ),
    ).toThrow(ForbiddenException);
    expect(
      service.listReportViews(
        DEMO_TENANT,
        "different-report-admin@local.invalid",
      ),
    ).toHaveLength(0);
    expect(service.listReportViews(DEMO_TENANT, "admin@local.invalid", true)).toHaveLength(
      1,
    );
    expect(() =>
      service.createReportSchedule(
        DEMO_TENANT,
        "different-report-admin@local.invalid",
        randomUUID(),
        view.id,
        {
          name: "Unauthorized private schedule",
          cadence: "daily",
          timezone: "UTC",
          runAt: "08:00",
          delivery: "local_archive",
          status: "active",
        },
      ),
    ).toThrow(NotFoundException);
  });

  it("rejects malformed report view, schedule, filter, and alert payloads", async () => {
    const invalidView = plainToInstance(CreateReportViewDto, {
      reportId: "risk",
      name: "Invalid view",
      reportName: "Risk report",
      workload: "Microsoft Entra ID",
      columns: [],
      filters: [
        {
          field: "arbitrary_provider_query",
          operator: "sql",
          value: "*",
          logic: "xor",
        },
      ],
      visibility: "public",
      favorite: "yes",
    });
    const invalidSchedule = plainToInstance(CreateReportScheduleDto, {
      name: "Invalid schedule",
      cadence: "hourly",
      timezone: "not a timezone",
      runAt: "25:99",
      delivery: "email",
    });
    const invalidAlert = plainToInstance(CreateReportAlertDto, {
      name: "Invalid alert",
      metric: "raw_sql",
      operator: "contains",
      threshold: -1,
      severity: "blocker",
    });

    expect(await validate(invalidView)).not.toHaveLength(0);
    expect(await validate(invalidSchedule)).not.toHaveLength(0);
    expect(await validate(invalidAlert)).not.toHaveLength(0);
  });
});

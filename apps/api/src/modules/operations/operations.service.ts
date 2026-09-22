import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { LocalStateService } from "../runtime/local-state.service";
import type {
  ReportAlert,
  ReportFilter,
  ReportJob,
  ReportSchedule,
  ReportView,
  ResourceRecord,
  Workflow,
  WorkflowState,
} from "../runtime/runtime.types";
import type {
  CreateReportAlertDto,
  CreateReportJobDto,
  CreateReportScheduleDto,
  CreateReportViewDto,
  ListReportJobsQuery,
  CreateWorkflowDto,
} from "./operations.dto";

@Injectable()
export class OperationsService implements OnModuleInit {
  constructor(private readonly store: LocalStateService) {}

  onModuleInit() {
    for (const job of this.store
      .snapshot()
      .reportJobs.filter(
        (item) => item.status === "queued" || item.status === "running",
      )) {
      job.status = "queued";
      job.progress = 0;
      this.processReport(job.id);
    }
    for (const workflow of this.store
      .snapshot()
      .workflows.filter((item) => item.state === "running")) {
      setTimeout(() => this.completeWorkflow(workflow.id), 250);
    }
  }

  adminCenters(tenantId: string) {
    const grouped = new Map<string, ResourceRecord[]>();
    for (const resource of this.store
      .snapshot()
      .resources.filter((item) => item.tenantId === tenantId)) {
      grouped.set(resource.workload, [
        ...(grouped.get(resource.workload) ?? []),
        resource,
      ]);
    }
    return {
      generatedAt: new Date().toISOString(),
      items: [...grouped.entries()].map(([workload, resources]) => {
        const critical = resources.filter(
          (item) => item.status === "critical",
        ).length;
        const warning = resources.filter(
          (item) => item.status === "warning",
        ).length;
        const healthy = resources.length - critical - warning;
        const averageRisk = Math.round(
          resources.reduce((total, item) => total + item.risk, 0) /
            resources.length,
        );
        return {
          workload,
          total: resources.length,
          healthy,
          warning,
          critical,
          health: Math.round((healthy / resources.length) * 100),
          averageRisk,
          freshnessSeconds: Math.round(
            (Date.now() -
              Math.max(
                ...resources.map((item) => Date.parse(item.updatedAt)),
              )) /
              1000,
          ),
          departments: Object.entries(
            resources.reduce<Record<string, number>>((result, item) => {
              result[item.department] = (result[item.department] ?? 0) + 1;
              return result;
            }, {}),
          ).map(([name, count]) => ({ name, count })),
        };
      }),
    };
  }

  listReports(
    tenantId: string,
    actorId: string,
    canInspectAll: boolean,
    query: Partial<ListReportJobsQuery> = {},
  ) {
    const limit = query.limit ?? 100;
    return this.store
      .snapshot()
      .reportJobs.filter(
        (job) =>
          this.canReadReportJob(tenantId, actorId, canInspectAll, job) &&
          (!query.status || job.status === query.status) &&
          (!query.workload || job.workload === query.workload) &&
          (!query.trigger || (job.trigger ?? "interactive") === query.trigger) &&
          (!query.viewId || job.viewId === query.viewId),
      )
      .slice(-limit)
      .reverse();
  }

  listReportViews(tenantId: string, actorId: string, canReadPrivate = false) {
    return this.store
      .snapshot()
      .reportViews.filter(
        (view) =>
          view.tenantId === tenantId &&
          view.status === "active" &&
          (canReadPrivate ||
            view.visibility === "team" ||
            view.createdBy === actorId),
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  reportOperations(
    tenantId: string,
    actorId: string,
    canReadPrivate: boolean,
    limit = 50,
  ) {
    const views = this.listReportViews(tenantId, actorId, canReadPrivate);
    const visibleViewIds = new Set(views.map((view) => view.id));
    const schedules = this.store
      .snapshot()
      .reportSchedules.filter(
        (schedule) =>
          schedule.tenantId === tenantId && visibleViewIds.has(schedule.viewId),
      );
    const alerts = this.store
      .snapshot()
      .reportAlerts.filter(
        (alert) =>
          alert.tenantId === tenantId && visibleViewIds.has(alert.viewId),
      );
    const reportJobs = this.store
      .snapshot()
      .reportJobs.filter((job) =>
        this.canReadReportJob(tenantId, actorId, canReadPrivate, job),
      );
    const terminalRuns = reportJobs.filter((job) =>
      ["completed", "failed"].includes(job.status),
    );
    const completedRuns = terminalRuns.filter(
      (job) => job.status === "completed",
    ).length;
    const runs = this.listReports(
      tenantId,
      actorId,
      canReadPrivate,
      { limit },
    ).map((job) => ({
      id: job.id,
      name: job.name,
      workload: job.workload,
      status: job.status,
      requestedBy: job.requestedBy,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      progress: job.progress,
      viewId: job.viewId,
      scheduleId: job.scheduleId,
      trigger: job.trigger ?? "interactive",
      filters: job.filters ?? [],
      result: job.result ? { totalRows: job.result.totalRows } : undefined,
      error: job.error,
    }));
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        views: views.length,
        activeSchedules: schedules.filter((item) => item.status === "active")
          .length,
        activeAlerts: alerts.filter((item) => item.status === "active").length,
        queued: reportJobs.filter((item) => item.status === "queued").length,
        running: reportJobs.filter((item) => item.status === "running").length,
        completed: completedRuns,
        completedRuns,
        failed: reportJobs.filter((item) => item.status === "failed").length,
        successRate: terminalRuns.length
          ? Math.round((completedRuns / terminalRuns.length) * 1000) / 10
          : 0,
        triggeredAlerts: alerts.filter((item) => item.lastTriggeredAt).length,
      },
      views,
      schedules,
      alerts,
      runs,
    };
  }

  createReportView(
    tenantId: string,
    actorId: string,
    correlationId: string,
    dto: CreateReportViewDto,
  ) {
    this.ensureWorkload(tenantId, dto.workload);
    const duplicate = this.store
      .snapshot()
      .reportViews.some(
        (view) =>
          view.tenantId === tenantId &&
          view.status === "active" &&
          view.name.toLocaleLowerCase() === dto.name.trim().toLocaleLowerCase(),
      );
    if (duplicate)
      throw new ConflictException(
        "An active saved report view with this name already exists.",
      );
    const now = new Date().toISOString();
    const view: ReportView = {
      id: randomUUID(),
      tenantId,
      reportId: dto.reportId.trim(),
      name: dto.name.trim(),
      reportName: dto.reportName.trim(),
      workload: dto.workload,
      description: dto.description?.trim() || undefined,
      columns: [...dto.columns],
      filters: dto.filters.map((filter) => ({ ...filter })),
      visibility: dto.visibility,
      favorite: dto.favorite,
      status: "active",
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
    };
    this.store.mutate((state) => state.reportViews.push(view));
    this.store.appendAudit(
      tenantId,
      actorId,
      "report_view.created",
      "report_view",
      view.id,
      "success",
      correlationId,
    );
    this.store.publish(tenantId, "report_view.created", {
      viewId: view.id,
      reportId: view.reportId,
      visibility: view.visibility,
    });
    return view;
  }

  createReportSchedule(
    tenantId: string,
    actorId: string,
    correlationId: string,
    viewId: string,
    dto: CreateReportScheduleDto,
    canManagePrivate = false,
  ) {
    const view = this.getReportView(
      tenantId,
      viewId,
      actorId,
      canManagePrivate,
    );
    if (dto.cadence === "weekly" && dto.dayOfWeek === undefined)
      throw new BadRequestException(
        "dayOfWeek is required for a weekly report schedule.",
      );
    if (dto.cadence === "monthly" && dto.dayOfMonth === undefined)
      throw new BadRequestException(
        "dayOfMonth is required for a monthly report schedule.",
      );
    this.validateTimeZone(dto.timezone);
    const now = new Date().toISOString();
    const schedule: ReportSchedule = {
      id: randomUUID(),
      tenantId,
      viewId: view.id,
      name: dto.name.trim(),
      cadence: dto.cadence,
      timezone: dto.timezone,
      runAt: dto.runAt,
      dayOfWeek: dto.dayOfWeek,
      dayOfMonth: dto.dayOfMonth,
      delivery: dto.delivery,
      status: dto.status ?? "active",
      nextRunAt: this.nextReportRun(dto),
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
    };
    this.store.mutate((state) => state.reportSchedules.push(schedule));
    this.store.appendAudit(
      tenantId,
      actorId,
      "report_schedule.created",
      "report_schedule",
      schedule.id,
      "success",
      correlationId,
    );
    this.store.publish(tenantId, "report_schedule.created", {
      scheduleId: schedule.id,
      viewId: view.id,
      cadence: schedule.cadence,
      delivery: "local_archive",
    });
    return schedule;
  }

  createReportAlert(
    tenantId: string,
    actorId: string,
    correlationId: string,
    viewId: string,
    dto: CreateReportAlertDto,
    canManagePrivate = false,
  ) {
    const view = this.getReportView(
      tenantId,
      viewId,
      actorId,
      canManagePrivate,
    );
    const now = new Date().toISOString();
    const alert: ReportAlert = {
      id: randomUUID(),
      tenantId,
      viewId: view.id,
      name: dto.name.trim(),
      metric: dto.metric,
      operator: dto.operator,
      threshold: dto.threshold,
      severity: dto.severity,
      status: dto.status ?? "active",
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
    };
    this.store.mutate((state) => state.reportAlerts.push(alert));
    this.store.appendAudit(
      tenantId,
      actorId,
      "report_alert.created",
      "report_alert",
      alert.id,
      "success",
      correlationId,
    );
    this.store.publish(tenantId, "report_alert.created", {
      alertId: alert.id,
      viewId: view.id,
      metric: alert.metric,
      threshold: alert.threshold,
    });
    return alert;
  }

  runReportSchedule(
    tenantId: string,
    actorId: string,
    correlationId: string,
    scheduleId: string,
    canManagePrivate = false,
  ) {
    const schedule = this.store
      .snapshot()
      .reportSchedules.find(
        (item) => item.id === scheduleId && item.tenantId === tenantId,
      );
    if (!schedule) throw new NotFoundException("Report schedule not found.");
    if (schedule.status !== "active")
      throw new ConflictException("A paused report schedule cannot be run.");
    const view = this.getReportView(
      tenantId,
      schedule.viewId,
      actorId,
      canManagePrivate,
    );
    const job = this.queueReport(
      tenantId,
      actorId,
      correlationId,
      {
        name: `${view.reportName} · ${schedule.name}`,
        workload: view.workload,
        columns: view.columns,
        filters: view.filters,
      },
      {
        trigger: "schedule_manual",
        viewId: view.id,
        scheduleId: schedule.id,
      },
    );
    this.store.mutate(() => {
      schedule.lastRunAt = job.createdAt;
      schedule.updatedAt = job.createdAt;
      schedule.nextRunAt = this.nextReportRun(schedule, new Date(job.createdAt));
    });
    this.store.appendAudit(
      tenantId,
      actorId,
      "report_schedule.run_requested",
      "report_schedule",
      schedule.id,
      "queued",
      correlationId,
    );
    this.store.publish(tenantId, "report_schedule.run_requested", {
      scheduleId: schedule.id,
      viewId: view.id,
      jobId: job.id,
    });
    return job;
  }

  runReportView(
    tenantId: string,
    actorId: string,
    correlationId: string,
    viewId: string,
    canManagePrivate = false,
  ) {
    const view = this.getReportView(
      tenantId,
      viewId,
      actorId,
      canManagePrivate,
    );
    return this.queueReport(
      tenantId,
      actorId,
      correlationId,
      {
        name: view.reportName,
        workload: view.workload,
        columns: view.columns,
        filters: view.filters,
      },
      { trigger: "interactive", viewId: view.id },
    );
  }

  createReport(
    tenantId: string,
    actorId: string,
    correlationId: string,
    dto: CreateReportJobDto,
  ) {
    return this.queueReport(tenantId, actorId, correlationId, dto, {
      trigger: "interactive",
    });
  }

  private queueReport(
    tenantId: string,
    actorId: string,
    correlationId: string,
    dto: CreateReportJobDto,
    source: {
      trigger: "interactive" | "schedule_manual";
      viewId?: string;
      scheduleId?: string;
    },
  ) {
    this.ensureWorkload(tenantId, dto.workload);
    const job: ReportJob = {
      id: randomUUID(),
      tenantId,
      name: dto.name,
      workload: dto.workload,
      status: "queued",
      requestedBy: actorId,
      createdAt: new Date().toISOString(),
      progress: 0,
      requestedColumns: dto.columns ? [...dto.columns] : undefined,
      filters: dto.filters?.map((filter) => ({ ...filter })) ?? [],
      viewId: source.viewId,
      scheduleId: source.scheduleId,
      trigger: source.trigger,
    };
    this.store.mutate((state) => state.reportJobs.push(job));
    this.store.appendAudit(
      tenantId,
      actorId,
      "report.requested",
      "report",
      job.id,
      "queued",
      correlationId,
    );
    this.store.publish(tenantId, "report.queued", {
      jobId: job.id,
      name: job.name,
      workload: job.workload,
      viewId: job.viewId,
      scheduleId: job.scheduleId,
      filterCount: job.filters?.length ?? 0,
    });
    this.processReport(job.id);
    return job;
  }

  getReport(
    tenantId: string,
    id: string,
    actorId: string,
    canInspectAll: boolean,
  ) {
    const job = this.store
      .snapshot()
      .reportJobs.find(
        (item) =>
          item.id === id &&
          this.canReadReportJob(tenantId, actorId, canInspectAll, item),
      );
    if (!job) throw new NotFoundException("Report job not found.");
    return job;
  }

  private canReadReportJob(
    tenantId: string,
    actorId: string,
    canInspectAll: boolean,
    job: ReportJob,
  ) {
    if (job.tenantId !== tenantId) return false;
    if (canInspectAll) return true;
    if (!job.viewId) return job.requestedBy === actorId;
    const view = this.store
      .snapshot()
      .reportViews.find(
        (item) =>
          item.id === job.viewId &&
          item.tenantId === tenantId &&
          item.status === "active",
      );
    return !!view && (view.visibility === "team" || view.createdBy === actorId);
  }

  private getReportView(
    tenantId: string,
    id: string,
    actorId: string,
    canManagePrivate: boolean,
  ) {
    const view = this.store
      .snapshot()
      .reportViews.find(
        (item) =>
          item.id === id && item.tenantId === tenantId && item.status === "active",
      );
    if (
      !view ||
      (!canManagePrivate &&
        view.visibility === "private" &&
        view.createdBy !== actorId)
    )
      throw new NotFoundException("Saved report view not found.");
    return view;
  }

  private ensureWorkload(tenantId: string, workload: string) {
    const available = this.store
      .snapshot()
      .resources.some(
        (item) => item.tenantId === tenantId && item.workload === workload,
      );
    if (!available)
      throw new ConflictException(
        "The requested workload is not available in this tenant.",
      );
  }

  private validateTimeZone(timeZone: string) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    } catch {
      throw new BadRequestException("The report schedule timezone is invalid.");
    }
  }

  private nextReportRun(
    schedule: Pick<
      ReportSchedule,
      "cadence" | "timezone" | "runAt" | "dayOfWeek" | "dayOfMonth"
    >,
    after = new Date(),
  ) {
    const localNow = this.zonedParts(after, schedule.timezone);
    const localDay = Date.UTC(localNow.year, localNow.month - 1, localNow.day);
    const [hour, minute] = schedule.runAt.split(":").map(Number);
    for (let offset = 0; offset <= 370; offset++) {
      const date = new Date(localDay + offset * 86_400_000);
      if (
        schedule.cadence === "weekly" &&
        date.getUTCDay() !== schedule.dayOfWeek
      )
        continue;
      if (
        schedule.cadence === "monthly" &&
        date.getUTCDate() !== schedule.dayOfMonth
      )
        continue;
      const desired = {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour,
        minute,
      };
      let candidate = Date.UTC(
        desired.year,
        desired.month - 1,
        desired.day,
        desired.hour,
        desired.minute,
      );
      const desiredAsUtc = candidate;
      for (let iteration = 0; iteration < 3; iteration++) {
        const rendered = this.zonedParts(
          new Date(candidate),
          schedule.timezone,
        );
        const renderedAsUtc = Date.UTC(
          rendered.year,
          rendered.month - 1,
          rendered.day,
          rendered.hour,
          rendered.minute,
        );
        candidate += desiredAsUtc - renderedAsUtc;
      }
      if (candidate > after.getTime()) return new Date(candidate).toISOString();
    }
    throw new BadRequestException(
      "A next report run could not be calculated for this schedule.",
    );
  }

  private zonedParts(value: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(value);
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    return {
      year: read("year"),
      month: read("month"),
      day: read("day"),
      hour: read("hour"),
      minute: read("minute"),
    };
  }

  private processReport(id: string) {
    setTimeout(() => {
      const job = this.store
        .snapshot()
        .reportJobs.find((item) => item.id === id);
      if (!job) return;
      this.store.mutate(() => {
        job.status = "running";
        job.progress = 35;
      });
      this.store.publish(job.tenantId, "report.running", {
        jobId: job.id,
        progress: job.progress,
      });
      setTimeout(() => this.completeReport(id), 450);
    }, 180);
  }

  private completeReport(id: string) {
    const job = this.store.snapshot().reportJobs.find((item) => item.id === id);
    if (!job) return;
    const resources = this.store
      .snapshot()
      .resources.filter(
        (item) =>
          item.tenantId === job.tenantId &&
          item.workload === job.workload &&
          this.matchesReportFilters(item, job.filters ?? []),
      );
    const critical = resources.filter(
      (item) => item.status === "critical",
    ).length;
    const warning = resources.filter(
      (item) => item.status === "warning",
    ).length;
    const healthy = resources.length - critical - warning;
    const averageRisk = resources.length
      ? Math.round(
          resources.reduce((total, item) => total + item.risk, 0) /
            resources.length,
        )
      : 0;
    const defaultColumns = [
      "Display name",
      "Type",
      "Status",
      "Risk score",
      "Department",
      "Region",
      "Owner",
      "Last updated",
    ];
    const columns = job.requestedColumns?.length
      ? job.requestedColumns
      : defaultColumns;
    this.store.mutate(() => {
      job.status = "completed";
      job.progress = 100;
      job.completedAt = new Date().toISOString();
      job.result = {
        totalRows: resources.length,
        columns,
        rows: resources
          .slice(0, 250)
          .map((item) =>
            columns.map((column) => this.reportColumnValue(item, column)),
          ),
        metrics: [
          {
            label: "Total records",
            value: resources.length.toLocaleString("en-US"),
            detail: `${job.workload} normalized objects after ${job.filters?.length ?? 0} governed filters`,
          },
          {
            label: "Healthy",
            value: healthy.toLocaleString("en-US"),
            detail: `${resources.length ? Math.round((healthy / resources.length) * 100) : 0}% of filtered records`,
          },
          {
            label: "Warnings",
            value: warning.toLocaleString("en-US"),
            detail: "Require owner review",
          },
          {
            label: "Critical",
            value: critical.toLocaleString("en-US"),
            detail: "Prioritized for action",
          },
        ],
      };
    });
    this.store.appendAudit(
      job.tenantId,
      job.requestedBy,
      "report.completed",
      "report",
      job.id,
      "success",
      randomUUID(),
    );
    this.store.publish(job.tenantId, "report.completed", {
      jobId: job.id,
      rows: resources.length,
      workload: job.workload,
      viewId: job.viewId,
      scheduleId: job.scheduleId,
    });
    this.evaluateReportAlerts(job, {
      row_count: resources.length,
      critical_count: critical,
      warning_count: warning,
      average_risk: averageRisk,
    });
  }

  private reportColumnValue(item: ResourceRecord, column: string) {
    const key = column.toLowerCase();
    if (key.includes("display") || key.includes("name"))
      return item.displayName;
    if (key.includes("object") || key === "id") return item.id;
    if (key.includes("department")) return item.department;
    if (key.includes("risk")) return String(item.risk);
    if (
      key.includes("status") ||
      key.includes("state") ||
      key.includes("compliant")
    )
      return item.status;
    if (key.includes("enabled")) return String(item.details.enabled);
    if (key.includes("type") || key.includes("sku")) return item.type;
    if (
      key.includes("owner") ||
      key.includes("manager") ||
      key.includes("user")
    )
      return String(item.details.owner);
    if (key.includes("region") || key.includes("country"))
      return String(item.details.region);
    if (key.includes("external") || key.includes("forward"))
      return String(item.details.external);
    if (
      key.includes("activity") ||
      key.includes("utilization") ||
      key.includes("score")
    )
      return String(item.details.activityScore);
    if (
      key.includes("date") ||
      key.includes("updated") ||
      key.includes("check-in")
    )
      return item.updatedAt;
    return String(item.details[key] ?? "N/A");
  }

  private matchesReportFilters(
    item: ResourceRecord,
    filters: ReportFilter[],
  ) {
    if (!filters.length) return true;
    let matches = this.matchesReportFilter(item, filters[0]);
    for (const filter of filters.slice(1)) {
      const current = this.matchesReportFilter(item, filter);
      matches = filter.logic === "or" ? matches || current : matches && current;
    }
    return matches;
  }

  private matchesReportFilter(item: ResourceRecord, filter: ReportFilter) {
    const actual =
      filter.field === "status"
        ? item.status
        : filter.field === "risk"
          ? item.risk
          : filter.field === "department"
            ? item.department
            : filter.field === "type"
              ? item.type
              : item.details[filter.field];
    if (filter.operator === "gte" || filter.operator === "lte") {
      const left = Number(actual);
      const right = Number(filter.value);
      if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
      return filter.operator === "gte" ? left >= right : left <= right;
    }
    const left = String(actual).trim().toLocaleLowerCase();
    const right = filter.value.trim().toLocaleLowerCase();
    if (filter.operator === "contains") return left.includes(right);
    if (filter.operator === "not_equals") return left !== right;
    return left === right;
  }

  private evaluateReportAlerts(
    job: ReportJob,
    metrics: Record<ReportAlert["metric"], number>,
  ) {
    if (!job.viewId) return;
    const alerts = this.store
      .snapshot()
      .reportAlerts.filter(
        (item) =>
          item.tenantId === job.tenantId &&
          item.viewId === job.viewId &&
          item.status === "active",
      );
    for (const alert of alerts) {
      const observed = metrics[alert.metric];
      const triggered =
        alert.operator === "gt"
          ? observed > alert.threshold
          : alert.operator === "gte"
            ? observed >= alert.threshold
            : alert.operator === "eq"
              ? observed === alert.threshold
              : alert.operator === "lte"
                ? observed <= alert.threshold
                : observed < alert.threshold;
      const now = new Date().toISOString();
      this.store.mutate(() => {
        alert.lastEvaluatedAt = now;
        alert.lastObservedValue = observed;
        alert.updatedAt = now;
        if (triggered) alert.lastTriggeredAt = now;
      });
      this.store.appendAudit(
        job.tenantId,
        "report-engine",
        triggered ? "report_alert.triggered" : "report_alert.evaluated",
        "report_alert",
        alert.id,
        triggered ? "triggered" : "clear",
        randomUUID(),
      );
      this.store.publish(
        job.tenantId,
        triggered ? "report_alert.triggered" : "report_alert.evaluated",
        {
          alertId: alert.id,
          viewId: alert.viewId,
          jobId: job.id,
          metric: alert.metric,
          observed,
          threshold: alert.threshold,
          severity: alert.severity,
          triggered,
          delivery: "local_event_stream",
        },
      );
    }
  }

  listWorkflows(tenantId: string) {
    return this.store
      .snapshot()
      .workflows.filter((item) => item.tenantId === tenantId)
      .slice(-100)
      .reverse();
  }

  createWorkflow(
    tenantId: string,
    actorId: string,
    correlationId: string,
    dto: CreateWorkflowDto,
  ) {
    const now = new Date().toISOString();
    const workflow: Workflow = {
      id: randomUUID(),
      tenantId,
      title: dto.title,
      type: dto.type,
      targetScope: dto.targetScope,
      justification: dto.justification,
      requestedBy: actorId,
      owner: dto.owner,
      state: "draft",
      createdAt: now,
      updatedAt: now,
      steps: [
        "Authorization and scope",
        "Dry run",
        "Approval",
        "Execution",
        "Verification",
      ].map((name) => ({ name, status: "pending" })),
    };
    this.store.mutate((state) => state.workflows.push(workflow));
    this.auditWorkflow(
      workflow,
      actorId,
      correlationId,
      "workflow.created",
      "success",
    );
    return workflow;
  }

  getWorkflow(tenantId: string, id: string) {
    const workflow = this.store
      .snapshot()
      .workflows.find((item) => item.id === id && item.tenantId === tenantId);
    if (!workflow) throw new NotFoundException("Workflow not found.");
    return workflow;
  }

  submitWorkflow(
    tenantId: string,
    id: string,
    actorId: string,
    correlationId: string,
  ) {
    const workflow = this.getWorkflow(tenantId, id);
    this.requireState(workflow, "draft");
    this.store.mutate(() => {
      workflow.state = "pending_approval";
      workflow.updatedAt = new Date().toISOString();
      workflow.steps[0] = {
        ...workflow.steps[0],
        status: "passed",
        at: workflow.updatedAt,
      };
      workflow.steps[1] = {
        ...workflow.steps[1],
        status: "passed",
        at: workflow.updatedAt,
      };
    });
    this.auditWorkflow(
      workflow,
      actorId,
      correlationId,
      "workflow.submitted",
      "success",
    );
    return workflow;
  }

  approveWorkflow(
    tenantId: string,
    id: string,
    actorId: string,
    correlationId: string,
    comment?: string,
  ) {
    const workflow = this.getWorkflow(tenantId, id);
    this.requireState(workflow, "pending_approval");
    if (workflow.requestedBy === actorId)
      throw new ForbiddenException(
        "Separation of duties prevents self-approval.",
      );
    this.store.mutate(() => {
      workflow.state = "approved";
      workflow.approver = actorId;
      workflow.updatedAt = new Date().toISOString();
      workflow.decisions = [
        ...(workflow.decisions ?? []),
        {
          actorId,
          decision: "approved",
          comment,
          occurredAt: workflow.updatedAt,
        },
      ];
      workflow.steps[2] = {
        ...workflow.steps[2],
        status: "passed",
        at: workflow.updatedAt,
      };
    });
    this.auditWorkflow(
      workflow,
      actorId,
      correlationId,
      "workflow.approved",
      "success",
    );
    return workflow;
  }

  rejectWorkflow(
    tenantId: string,
    id: string,
    actorId: string,
    correlationId: string,
    comment?: string,
  ) {
    const workflow = this.getWorkflow(tenantId, id);
    this.requireState(workflow, "pending_approval");
    if (workflow.requestedBy === actorId)
      throw new ForbiddenException(
        "Separation of duties prevents self-rejection as the approval decision.",
      );
    this.store.mutate(() => {
      workflow.state = "rejected";
      workflow.approver = actorId;
      workflow.updatedAt = new Date().toISOString();
      workflow.decisions = [
        ...(workflow.decisions ?? []),
        {
          actorId,
          decision: "rejected",
          comment,
          occurredAt: workflow.updatedAt,
        },
      ];
      workflow.steps[2] = {
        ...workflow.steps[2],
        status: "failed",
        at: workflow.updatedAt,
      };
    });
    this.auditWorkflow(
      workflow,
      actorId,
      correlationId,
      "workflow.rejected",
      "rejected",
    );
    return workflow;
  }

  executeWorkflow(
    tenantId: string,
    id: string,
    actorId: string,
    correlationId: string,
  ) {
    const workflow = this.getWorkflow(tenantId, id);
    this.requireState(workflow, "approved");
    this.store.mutate(() => {
      workflow.state = "running";
      workflow.updatedAt = new Date().toISOString();
    });
    this.auditWorkflow(
      workflow,
      actorId,
      correlationId,
      "workflow.execution_started",
      "success",
    );
    setTimeout(() => this.completeWorkflow(workflow.id), 650);
    return workflow;
  }

  rollbackWorkflow(
    tenantId: string,
    id: string,
    actorId: string,
    correlationId: string,
  ) {
    const workflow = this.getWorkflow(tenantId, id);
    this.requireState(workflow, "completed");
    this.store.mutate((state) => {
      for (const snapshot of workflow.rollbackSnapshot ?? []) {
        const resource = state.resources.find(
          (item) =>
            item.tenantId === tenantId && item.id === snapshot.resourceId,
        );
        if (resource) {
          resource.details = { ...snapshot.details };
          resource.updatedAt = snapshot.updatedAt;
        }
      }
      workflow.state = "rolled_back";
      workflow.updatedAt = new Date().toISOString();
      workflow.execution = {
        affected: workflow.execution?.affected ?? 0,
        succeeded: workflow.execution?.succeeded ?? 0,
        failed: 0,
        skipped: workflow.execution?.skipped,
        message: "Rollback completed and verified.",
        targetIds: workflow.execution?.targetIds,
      };
    });
    this.auditWorkflow(
      workflow,
      actorId,
      correlationId,
      "workflow.rolled_back",
      "success",
    );
    return workflow;
  }

  private completeWorkflow(id: string) {
    const workflow = this.store
      .snapshot()
      .workflows.find((item) => item.id === id);
    if (!workflow) return;
    const shouldFail = workflow.targetScope
      .toLowerCase()
      .includes("failure-test");
    const licenseTargets: ResourceRecord[] = [];
    const affected = licenseTargets.length
      ? licenseTargets.length
      : Math.max(
          1,
          Math.min(250, (workflow.targetScope.length * 7) % 251),
        );
    this.store.mutate(() => {
      if (licenseTargets.length && !shouldFail) {
        workflow.rollbackSnapshot = licenseTargets.map((resource) => ({
          resourceId: resource.id,
          details: { ...resource.details },
          updatedAt: resource.updatedAt,
        }));
        licenseTargets.forEach((resource, index) => {
          const exception =
            index < 8
              ? "leave"
              : index < 15
                ? "service_account"
                : index < 20
                  ? "legal_hold"
                  : undefined;
          resource.details.licenseAssigned = !!exception;
          resource.details.licenseReclaimed = !exception;
          resource.details.remediationDisposition = exception
            ? `excluded_${exception}`
            : "reclaimed";
          resource.details.remediationFinding = workflow.sourceFindingId!;
          resource.updatedAt = new Date().toISOString();
        });
      }
      workflow.state = shouldFail ? "failed" : "completed";
      workflow.updatedAt = new Date().toISOString();
      workflow.steps[3] = {
        ...workflow.steps[3],
        status: shouldFail ? "failed" : "passed",
        at: workflow.updatedAt,
      };
      workflow.steps[4] = {
        ...workflow.steps[4],
        status: shouldFail ? "failed" : "passed",
        at: workflow.updatedAt,
      };
      workflow.execution = {
        affected,
        succeeded: shouldFail
          ? 0
          : licenseTargets.length
            ? licenseTargets.length - 20
            : affected,
        failed: shouldFail ? affected : 0,
        skipped: shouldFail ? 0 : licenseTargets.length ? 20 : 0,
        message: shouldFail
          ? "Injected acceptance-test failure; no target changes were committed."
          : licenseTargets.length
            ? "87 dormant E5 assignments evaluated: 67 reclaimed and 20 excluded for leave, service-account, or legal-hold exceptions."
            : "Execution completed, verified, and recorded.",
        targetIds: licenseTargets.map((item) => item.id),
      };
    });
    this.auditWorkflow(
      workflow,
      "workflow-engine",
      randomUUID(),
      "workflow.execution_completed",
      shouldFail ? "failed" : "success",
    );
  }

  audit(tenantId: string, objectType?: string) {
    return this.store
      .snapshot()
      .audit.filter(
        (item) =>
          item.tenantId === tenantId &&
          (!objectType || item.objectType === objectType),
      )
      .slice(-500)
      .reverse();
  }

  auditIntegrity(tenantId: string) {
    let previousHash = "GENESIS";
    for (const item of this.store
      .snapshot()
      .audit.filter((record) => record.tenantId === tenantId)
      .sort((left, right) => left.sequence - right.sequence)) {
      if (item.previousHash !== previousHash) return false;
      const expected = createHash("sha256")
        .update(previousHash + JSON.stringify({ ...item, hash: "" }))
        .digest("hex");
      if (item.hash !== expected) return false;
      previousHash = item.hash;
    }
    return true;
  }

  simulateTick(tenantId: string, actorId: string, correlationId: string) {
    const resources = this.store
      .snapshot()
      .resources.filter((item) => item.tenantId === tenantId);
    const resource =
      resources[Math.floor(Date.now() / 1000) % resources.length];
    this.store.mutate(() => {
      resource.risk = (resource.risk + 9) % 100;
      resource.status =
        resource.risk >= 88
          ? "critical"
          : resource.risk >= 66
            ? "warning"
            : "healthy";
      resource.updatedAt = new Date().toISOString();
    });
    this.store.appendAudit(
      tenantId,
      actorId,
      "simulation.resource_updated",
      "simulation",
      resource.id,
      "success",
      correlationId,
    );
    const event = this.store.publish(tenantId, "resource.updated", {
      id: resource.id,
      workload: resource.workload,
      risk: resource.risk,
      status: resource.status,
    });
    return { resource, event };
  }

  reset(actorId: string, correlationId: string) {
    return this.store.reset(actorId, correlationId);
  }

  private requireState(workflow: Workflow, expected: WorkflowState) {
    if (workflow.state !== expected)
      throw new ConflictException(
        `Workflow must be ${expected}; current state is ${workflow.state}.`,
      );
  }

  private auditWorkflow(
    workflow: Workflow,
    actorId: string,
    correlationId: string,
    action: string,
    result: string,
  ) {
    this.store.appendAudit(
      workflow.tenantId,
      actorId,
      action,
      "workflow",
      workflow.id,
      result,
      correlationId,
    );
    this.store.publish(workflow.tenantId, action, {
      workflowId: workflow.id,
      state: workflow.state,
      title: workflow.title,
    });
    if (workflow.sourceFindingId) {
      const activityType = {
        "workflow.approved": "workflow_approved",
        "workflow.rejected": "workflow_rejected",
        "workflow.execution_started": "execution_started",
        "workflow.execution_completed": "execution_completed",
        "workflow.rolled_back": "workflow_rolled_back",
      }[action] as
        | "workflow_approved"
        | "workflow_rejected"
        | "execution_started"
        | "execution_completed"
        | "workflow_rolled_back"
        | undefined;
      if (activityType) {
        this.store.mutate((state) => {
          const findingCase = state.findingCases.find(
            (item) =>
              item.tenantId === workflow.tenantId &&
              item.findingId === workflow.sourceFindingId,
          );
          if (!findingCase) return;
          findingCase.status =
            workflow.state === "draft" ? "remediation_draft" : workflow.state;
          findingCase.updatedAt = new Date().toISOString();
          findingCase.updatedBy = actorId;
          findingCase.activity.push({
            id: randomUUID(),
            type: activityType,
            actorId,
            occurredAt: findingCase.updatedAt,
            summary: `${action.replaceAll("_", " ")} · workflow ${workflow.id} · ${workflow.execution?.message ?? workflow.state}`,
          });
        });
      }
    }
  }
}

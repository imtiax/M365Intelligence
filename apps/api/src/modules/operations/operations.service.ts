import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { LocalStateService } from "../runtime/local-state.service";
import type {
  ReportJob,
  ResourceRecord,
  Workflow,
  WorkflowState,
} from "../runtime/runtime.types";
import type { CreateReportJobDto, CreateWorkflowDto } from "./operations.dto";

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

  listReports(tenantId: string) {
    return this.store
      .snapshot()
      .reportJobs.filter((job) => job.tenantId === tenantId)
      .slice(-100)
      .reverse();
  }

  createReport(
    tenantId: string,
    actorId: string,
    correlationId: string,
    dto: CreateReportJobDto,
  ) {
    const allowed = new Set(
      this.store
        .snapshot()
        .resources.filter((item) => item.tenantId === tenantId)
        .map((item) => item.workload),
    );
    if (!allowed.has(dto.workload))
      throw new ConflictException(
        "The requested workload is not available in this tenant.",
      );
    const job: ReportJob = {
      id: randomUUID(),
      tenantId,
      name: dto.name,
      workload: dto.workload,
      status: "queued",
      requestedBy: actorId,
      createdAt: new Date().toISOString(),
      progress: 0,
      requestedColumns: dto.columns,
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
    });
    this.processReport(job.id);
    return job;
  }

  getReport(tenantId: string, id: string) {
    const job = this.store
      .snapshot()
      .reportJobs.find((item) => item.id === id && item.tenantId === tenantId);
    if (!job) throw new NotFoundException("Report job not found.");
    return job;
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
          item.tenantId === job.tenantId && item.workload === job.workload,
      );
    const critical = resources.filter(
      (item) => item.status === "critical",
    ).length;
    const warning = resources.filter(
      (item) => item.status === "warning",
    ).length;
    const healthy = resources.length - critical - warning;
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
    const valueFor = (item: ResourceRecord, column: string) => {
      const key = column.toLowerCase();
      if (key.includes("display") || key.includes("name"))
        return item.displayName;
      if (key.includes("department")) return item.department;
      if (key.includes("risk")) return String(item.risk);
      if (
        key.includes("status") ||
        key.includes("state") ||
        key.includes("compliant") ||
        key.includes("enabled")
      )
        return item.status;
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
    };
    this.store.mutate(() => {
      job.status = "completed";
      job.progress = 100;
      job.completedAt = new Date().toISOString();
      job.result = {
        totalRows: resources.length,
        columns,
        rows: resources
          .slice(0, 250)
          .map((item) => columns.map((column) => valueFor(item, column))),
        metrics: [
          {
            label: "Total records",
            value: resources.length.toLocaleString("en-US"),
            detail: `${job.workload} normalized objects`,
          },
          {
            label: "Healthy",
            value: healthy.toLocaleString("en-US"),
            detail: `${Math.round((healthy / resources.length) * 100)}% of records`,
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
    });
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
    this.store.mutate(() => {
      workflow.state = "rolled_back";
      workflow.updatedAt = new Date().toISOString();
      workflow.execution = {
        affected: workflow.execution?.affected ?? 0,
        succeeded: workflow.execution?.succeeded ?? 0,
        failed: 0,
        message: "Rollback completed and verified.",
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
    const affected = Math.max(
      1,
      Math.min(250, (workflow.targetScope.length * 7) % 251),
    );
    this.store.mutate(() => {
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
        succeeded: shouldFail ? 0 : affected,
        failed: shouldFail ? affected : 0,
        message: shouldFail
          ? "Injected acceptance-test failure; no target changes were committed."
          : "Execution completed, verified, and recorded.",
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
  }
}

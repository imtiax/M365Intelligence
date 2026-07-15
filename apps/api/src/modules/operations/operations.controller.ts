import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Req,
  Sse,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { interval, map, merge, Observable } from "rxjs";
import { LocalStateService } from "../runtime/local-state.service";
import {
  CreateReportJobDto,
  CreateWorkflowDto,
  ListAuditQuery,
  WorkflowDecisionDto,
} from "./operations.dto";
import { OperationsService } from "./operations.service";
import type { PlatformRole } from "../../shared/security/tenant-context";

@ApiTags("operations")
@ApiBearerAuth()
@Controller("api/v1")
export class OperationsController {
  constructor(
    private readonly operations: OperationsService,
    private readonly store: LocalStateService,
  ) {}

  @Get("admin-centers")
  adminCenters(@Req() request: Request) {
    return this.operations.adminCenters(request.tenantContext!.tenantId);
  }

  @Get("report-jobs")
  reports(@Req() request: Request) {
    return {
      items: this.operations.listReports(request.tenantContext!.tenantId),
    };
  }

  @Post("report-jobs")
  createReport(@Req() request: Request, @Body() body: CreateReportJobDto) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, ["platform-admin", "report-admin"]);
    return this.operations.createReport(
      context.tenantId,
      context.actorId,
      request.correlationId!,
      body,
    );
  }

  @Get("report-jobs/:id")
  report(@Req() request: Request, @Param("id") id: string) {
    return this.operations.getReport(request.tenantContext!.tenantId, id);
  }

  @Get("workflows")
  workflows(@Req() request: Request) {
    this.requireRole(request.tenantContext!.roles, ["platform-admin", "security-admin", "m365-admin", "auditor"]);
    return {
      items: this.operations.listWorkflows(request.tenantContext!.tenantId),
    };
  }

  @Post("workflows")
  createWorkflow(@Req() request: Request, @Body() body: CreateWorkflowDto) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, [
      "platform-admin",
      "security-admin",
      "m365-admin",
    ]);
    return this.operations.createWorkflow(
      context.tenantId,
      context.actorId,
      request.correlationId!,
      body,
    );
  }

  @Get("workflows/:id")
  workflow(@Req() request: Request, @Param("id") id: string) {
    this.requireRole(request.tenantContext!.roles, ["platform-admin", "security-admin", "m365-admin", "auditor"]);
    return this.operations.getWorkflow(request.tenantContext!.tenantId, id);
  }

  @Post("workflows/:id/submit")
  submit(
    @Req() request: Request,
    @Param("id") id: string,
    @Body() _body: WorkflowDecisionDto,
  ) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, ["platform-admin", "security-admin", "m365-admin"]);
    return this.operations.submitWorkflow(
      context.tenantId,
      id,
      context.actorId,
      request.correlationId!,
    );
  }

  @Post("workflows/:id/approve")
  approve(
    @Req() request: Request,
    @Param("id") id: string,
    @Body() _body: WorkflowDecisionDto,
  ) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, ["platform-admin", "security-admin"]);
    return this.operations.approveWorkflow(
      context.tenantId,
      id,
      context.actorId,
      request.correlationId!,
    );
  }

  @Post("workflows/:id/execute")
  execute(
    @Req() request: Request,
    @Param("id") id: string,
    @Body() _body: WorkflowDecisionDto,
  ) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, ["platform-admin", "m365-admin"]);
    return this.operations.executeWorkflow(
      context.tenantId,
      id,
      context.actorId,
      request.correlationId!,
    );
  }

  @Post("workflows/:id/rollback")
  rollback(
    @Req() request: Request,
    @Param("id") id: string,
    @Body() _body: WorkflowDecisionDto,
  ) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, ["platform-admin", "m365-admin"]);
    return this.operations.rollbackWorkflow(
      context.tenantId,
      id,
      context.actorId,
      request.correlationId!,
    );
  }

  @Get("audit")
  audit(@Req() request: Request, @Query() query: ListAuditQuery) {
    this.requireRole(request.tenantContext!.roles, ["platform-admin", "security-admin", "auditor"]);
    const items = this.operations.audit(
      request.tenantContext!.tenantId,
      query.objectType,
    );
    return {
      items,
      integrity: items.every(
        (item, index) =>
          index === items.length - 1 ||
          item.previousHash === items[index + 1].hash,
      ),
    };
  }

  @Post("simulation/tick")
  tick(@Req() request: Request) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, ["platform-admin"]);
    return this.operations.simulateTick(
      context.tenantId,
      context.actorId,
      request.correlationId!,
    );
  }

  @Post("simulation/reset")
  reset(@Req() request: Request) {
    const context = request.tenantContext!;
    this.requireRole(context.roles, ["platform-admin"]);
    return this.operations.reset(context.actorId, request.correlationId!);
  }

  private requireRole(actual: PlatformRole[], allowed: PlatformRole[]) {
    if (!actual.some((role) => allowed.includes(role)))
      throw new ForbiddenException(
        "The active platform role cannot perform this operation.",
      );
  }

  @Sse("events/stream")
  stream(@Req() request: Request): Observable<MessageEvent> {
    const tenantId = request.tenantContext!.tenantId;
    const events = this.store.events$.pipe(
      map((event) => ({ id: event.id, data: event }) as MessageEvent),
    );
    const heartbeat = interval(15000).pipe(
      map(
        () =>
          ({
            data: {
              type: "heartbeat",
              tenantId,
              at: new Date().toISOString(),
            },
          }) as MessageEvent,
      ),
    );
    return merge(events, heartbeat);
  }
}

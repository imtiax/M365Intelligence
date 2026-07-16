import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { OperationsService } from "../../operations/operations.service";
import { LocalStateService } from "../../runtime/local-state.service";
import type { FindingCase, WorkflowState } from "../../runtime/runtime.types";
import { FindingsRepository } from "./findings.repository";
import type {
  AssignFindingDto,
  CreateFindingRemediationDto,
} from "../presentation/finding-actions.dto";

@Injectable()
export class FindingActionsService {
  constructor(
    private readonly findings: FindingsRepository,
    private readonly store: LocalStateService,
    private readonly operations: OperationsService,
  ) {}

  async getCase(tenantId: string, findingId: string) {
    const finding = await this.requireFinding(tenantId, findingId);
    const stored = this.store
      .snapshot()
      .findingCases.find(
        (item) => item.tenantId === tenantId && item.findingId === findingId,
      );
    const remediationWorkflow = stored?.remediationWorkflowId
      ? this.store
          .snapshot()
          .workflows.find(
            (item) =>
              item.tenantId === tenantId &&
              item.id === stored.remediationWorkflowId,
          )
      : undefined;
    const caseState = stored
      ? {
          ...stored,
          status: remediationWorkflow
            ? this.caseStatus(remediationWorkflow.state)
            : stored.status,
        }
      : this.emptyCase(tenantId, findingId);
    return { finding, case: caseState, remediationWorkflow };
  }

  async assign(
    tenantId: string,
    findingId: string,
    actorId: string,
    correlationId: string,
    dto: AssignFindingDto,
  ) {
    await this.requireFinding(tenantId, findingId);
    if (Date.parse(dto.dueAt) <= Date.now())
      throw new BadRequestException("Assignment due date must be in the future.");
    const now = new Date().toISOString();
    this.store.mutate((state) => {
      let caseState = state.findingCases.find(
        (item) => item.tenantId === tenantId && item.findingId === findingId,
      );
      const previousAssignee = caseState?.assignee?.displayName;
      if (!caseState) {
        caseState = this.emptyCase(tenantId, findingId, actorId);
        state.findingCases.push(caseState);
      }
      caseState.assignee = {
        id: dto.assigneeId,
        displayName: dto.assigneeName,
        team: dto.team,
      };
      caseState.priority = dto.priority;
      caseState.dueAt = dto.dueAt;
      caseState.note = dto.note;
      if (!caseState.remediationWorkflowId) caseState.status = "assigned";
      caseState.updatedAt = now;
      caseState.updatedBy = actorId;
      caseState.activity.push({
        id: randomUUID(),
        type: previousAssignee ? "reassigned" : "assigned",
        actorId,
        occurredAt: now,
        summary: `${previousAssignee ? "Reassigned" : "Assigned"} to ${dto.assigneeName} (${dto.team}); ${dto.priority} priority, due ${dto.dueAt.slice(0, 10)}.`,
      });
    });
    this.record(
      tenantId,
      actorId,
      correlationId,
      "finding.assigned",
      findingId,
      `${dto.assigneeId}|${dto.priority}|${dto.dueAt}`,
    );
    return this.getCase(tenantId, findingId);
  }

  async createRemediation(
    tenantId: string,
    findingId: string,
    actorId: string,
    correlationId: string,
    dto: CreateFindingRemediationDto,
  ) {
    const finding = await this.requireFinding(tenantId, findingId);
    if (!finding.automation.available)
      throw new BadRequestException(
        "This finding is manual-only and cannot create an automated remediation workflow.",
      );
    const existingCase = this.store
      .snapshot()
      .findingCases.find(
        (item) => item.tenantId === tenantId && item.findingId === findingId,
      );
    if (!existingCase?.assignee)
      throw new BadRequestException(
        "Assign an accountable owner before creating remediation.",
      );
    if (existingCase?.remediationWorkflowId) {
      const existingWorkflow = this.store
        .snapshot()
        .workflows.find(
          (item) =>
            item.tenantId === tenantId &&
            item.id === existingCase.remediationWorkflowId,
        );
      if (existingWorkflow && !["failed", "rejected", "rolled_back"].includes(existingWorkflow.state))
        throw new ConflictException(
          `Finding already has active remediation workflow ${existingWorkflow.id}.`,
        );
    }
    if (finding.category === "license") {
      const required = ["leave", "service_accounts", "legal_hold"];
      const missing = required.filter((item) => !dto.exceptionReview.includes(item));
      if (missing.length)
        throw new BadRequestException(
          `License remediation requires review of: ${missing.join(", ")}.`,
        );
    }
    let workflow = this.operations.createWorkflow(
      tenantId,
      actorId,
      correlationId,
      {
        title: dto.title,
        type: `finding-${finding.category}-remediation`,
        targetScope: dto.targetScope,
        justification: `${dto.justification}\nException review: ${dto.exceptionReview.join(", ")}`,
      },
    );
    this.store.mutate(() => {
      workflow.sourceFindingId = findingId;
    });
    if (dto.submitForApproval) {
      workflow = this.operations.submitWorkflow(
        tenantId,
        workflow.id,
        actorId,
        correlationId,
      );
    }
    const now = new Date().toISOString();
    this.store.mutate((state) => {
      let caseState = state.findingCases.find(
        (item) => item.tenantId === tenantId && item.findingId === findingId,
      );
      if (!caseState) {
        caseState = this.emptyCase(tenantId, findingId, actorId);
        state.findingCases.push(caseState);
      }
      caseState.remediationWorkflowId = workflow.id;
      caseState.status = dto.submitForApproval
        ? "pending_approval"
        : "remediation_draft";
      caseState.updatedAt = now;
      caseState.updatedBy = actorId;
      caseState.activity.push({
        id: randomUUID(),
        type: dto.submitForApproval
          ? "remediation_submitted"
          : "remediation_drafted",
        actorId,
        occurredAt: now,
        summary: `${dto.submitForApproval ? "Submitted" : "Drafted"} remediation ${workflow.id}; ${dto.exceptionReview.length} exception classes reviewed.`,
      });
    });
    this.record(
      tenantId,
      actorId,
      correlationId,
      dto.submitForApproval
        ? "finding.remediation_submitted"
        : "finding.remediation_drafted",
      findingId,
      workflow.id,
    );
    return this.getCase(tenantId, findingId);
  }

  private async requireFinding(tenantId: string, findingId: string) {
    const finding = await this.findings.get(tenantId, findingId);
    if (!finding) throw new NotFoundException("Finding not found.");
    return finding;
  }

  private emptyCase(
    tenantId: string,
    findingId: string,
    actorId = "system",
  ): FindingCase {
    return {
      findingId,
      tenantId,
      status: "unassigned",
      updatedAt: new Date().toISOString(),
      updatedBy: actorId,
      activity: [],
    };
  }

  private caseStatus(state: WorkflowState): FindingCase["status"] {
    return state === "draft" ? "remediation_draft" : state;
  }

  private record(
    tenantId: string,
    actorId: string,
    correlationId: string,
    action: string,
    findingId: string,
    result: string,
  ) {
    this.store.appendAudit(
      tenantId,
      actorId,
      action,
      "finding",
      findingId,
      result,
      correlationId,
    );
    this.store.publish(tenantId, action, { findingId, result });
  }
}

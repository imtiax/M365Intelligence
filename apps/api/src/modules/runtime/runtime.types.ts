import type { EnterpriseDemoState } from "./enterprise.types";

export type ResourceRecord = {
  id: string;
  tenantId: string;
  workload: string;
  type: string;
  displayName: string;
  status: "healthy" | "warning" | "critical";
  risk: number;
  department: string;
  updatedAt: string;
  details: Record<string, string | number | boolean>;
};

export type ReportJob = {
  id: string;
  tenantId: string;
  name: string;
  workload: string;
  status: "queued" | "running" | "completed" | "failed";
  requestedBy: string;
  createdAt: string;
  completedAt?: string;
  progress: number;
  requestedColumns?: string[];
  error?: string;
  result?: {
    totalRows: number;
    columns: string[];
    rows: string[][];
    metrics: Array<{ label: string; value: string; detail: string }>;
  };
};

export type WorkflowState =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "running"
  | "completed"
  | "failed"
  | "rolled_back";

export type Workflow = {
  id: string;
  tenantId: string;
  title: string;
  type: string;
  targetScope: string;
  justification: string;
  requestedBy: string;
  owner?: string;
  approver?: string;
  decisions?: Array<{
    actorId: string;
    decision: "approved" | "rejected";
    comment?: string;
    occurredAt: string;
  }>;
  state: WorkflowState;
  createdAt: string;
  updatedAt: string;
  sourceFindingId?: string;
  steps: Array<{
    name: string;
    status: "pending" | "passed" | "failed";
    at?: string;
  }>;
  execution?: {
    affected: number;
    succeeded: number;
    failed: number;
    skipped?: number;
    message: string;
    targetIds?: string[];
  };
  rollbackSnapshot?: Array<{
    resourceId: string;
    details: Record<string, string | number | boolean>;
    updatedAt: string;
  }>;
};

export type FindingCaseActivity = {
  id: string;
  type:
    | "assigned"
    | "reassigned"
    | "remediation_drafted"
    | "remediation_submitted"
    | "workflow_approved"
    | "workflow_rejected"
    | "execution_started"
    | "execution_completed"
    | "workflow_rolled_back";
  actorId: string;
  occurredAt: string;
  summary: string;
};

export type FindingCase = {
  findingId: string;
  tenantId: string;
  status:
    | "unassigned"
    | "assigned"
    | "remediation_draft"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "running"
    | "completed"
    | "failed"
    | "rolled_back";
  assignee?: {
    id: string;
    displayName: string;
    team: string;
  };
  priority?: "low" | "medium" | "high" | "urgent";
  dueAt?: string;
  note?: string;
  remediationWorkflowId?: string;
  updatedAt: string;
  updatedBy: string;
  activity: FindingCaseActivity[];
};

export type AuditRecord = {
  sequence: number;
  tenantId: string;
  occurredAt: string;
  actorId: string;
  action: string;
  objectType: string;
  objectId: string;
  result: string;
  correlationId: string;
  previousHash: string;
  hash: string;
};

export type RuntimeEvent = {
  id: string;
  tenantId: string;
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

export type RuntimeState = {
  version: number;
  seededAt: string;
  enterprise: EnterpriseDemoState;
  resources: ResourceRecord[];
  reportJobs: ReportJob[];
  workflows: Workflow[];
  findingCases: FindingCase[];
  audit: AuditRecord[];
  events: RuntimeEvent[];
};

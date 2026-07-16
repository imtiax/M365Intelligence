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
  approver?: string;
  state: WorkflowState;
  createdAt: string;
  updatedAt: string;
  steps: Array<{
    name: string;
    status: "pending" | "passed" | "failed";
    at?: string;
  }>;
  execution?: {
    affected: number;
    succeeded: number;
    failed: number;
    message: string;
  };
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
  audit: AuditRecord[];
  events: RuntimeEvent[];
};

import type { GeneratedReport } from "@/lib/reporting";

const API = "/api/runtime";

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(", ")
        : body.message || `API request failed (${response.status})`,
    );
  }
  return response.json() as Promise<T>;
}

export type CommercialOrganization = {
  id: string; tenantId: string; legalName: string; displayName: string;
  industry: string[]; companySize: string; primaryRegion: string; mode: string;
  dataBoundary: string; onboarding: { completed: number; total: number; next: string };
};
export type CommercialSubscription = {
  plan: string; state: string; billingCycle: string; licensedUsers: number;
  trialEndsAt: string; entitlements: string[]; note: string;
};
export type CommercialLicense = {
  licenseNumber: string; state: string; edition: string; boundTenantId: string;
  maxInstances: number; activeInstances: number; maxUsers: number;
  activationMode: string; expiresAt: string; cryptographicEnforcement: string;
};
export type CommercialConnector = {
  code: string; name: string; domain: string; reports: number;
  state: "healthy" | "degraded" | "action_required"; permissionCoverage: number;
  lastSyncAt: string; nextSyncAt: string; objectsProcessed: number; missingPermissions: string[];
};
export type CommercialCustomers = {
  summary: { customers: number; activeTrials: number; paidSubscriptions: number; expiringLicenses: number };
  items: Array<{ organization: string; tenantId: string; mode: string; subscription: string; license: string; connectors: string; dataBoundary: string }>;
  disclosure: string;
};

export const getCommercialOrganization = () => request<CommercialOrganization>("/api/v1/commercial/organization");
export const getCommercialSubscription = () => request<CommercialSubscription>("/api/v1/commercial/subscription");
export const getCommercialLicense = () => request<CommercialLicense>("/api/v1/commercial/license");
export const getCommercialConnectors = () => request<{ generatedAt: string; items: CommercialConnector[] }>("/api/v1/commercial/connectors");
export const validateCommercialConnector = (code: string) => request<CommercialConnector & { validationId: string; validation: string }>(`/api/v1/commercial/connectors/${encodeURIComponent(code)}/validate`, { method: "POST" });
export const getCommercialCustomers = () => request<CommercialCustomers>("/api/v1/commercial/super-admin/customers");

export type RuntimeAdminCenter = {
  workload: string;
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  health: number;
  averageRisk: number;
  freshnessSeconds: number;
};

export async function getAdminCenters() {
  return request<{ generatedAt: string; items: RuntimeAdminCenter[] }>(
    "/api/v1/admin-centers",
  );
}

export type ReportFilterField =
  | "status"
  | "risk"
  | "department"
  | "region"
  | "type"
  | "external"
  | "activityScore";

export type ReportFilter = {
  field: ReportFilterField;
  operator: "equals" | "not_equals" | "contains" | "gte" | "lte";
  value: string;
  logic: "and" | "or";
};

export type RuntimeReportView = {
  id: string;
  tenantId: string;
  reportId: string;
  name: string;
  reportName: string;
  workload: string;
  description?: string;
  columns: string[];
  filters: ReportFilter[];
  visibility: "private" | "team";
  favorite: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RuntimeReportSchedule = {
  id: string;
  tenantId: string;
  viewId: string;
  name: string;
  cadence: "daily" | "weekly" | "monthly";
  timezone: string;
  runAt: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  delivery: "local_archive";
  status: "active" | "paused";
  lastRunAt?: string;
  nextRunAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RuntimeReportAlert = {
  id: string;
  tenantId: string;
  viewId: string;
  name: string;
  metric: "row_count" | "critical_count" | "warning_count" | "average_risk";
  operator: "gt" | "gte" | "eq" | "lte" | "lt";
  threshold: number;
  severity: "info" | "warning" | "critical";
  status: "active" | "paused";
  lastEvaluatedAt?: string;
  lastObservedValue?: number;
  lastTriggeredAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RuntimeReportRun = {
  id: string;
  name: string;
  workload: string;
  status: "queued" | "running" | "completed" | "failed";
  trigger?: "interactive" | "schedule_manual";
  viewId?: string;
  scheduleId?: string;
  requestedBy: string;
  createdAt: string;
  completedAt?: string;
  result?: { totalRows: number };
};

export type RuntimeReportOperations = {
  generatedAt: string;
  summary: {
    views: number;
    activeSchedules: number;
    activeAlerts: number;
    completedRuns: number;
  };
  views: RuntimeReportView[];
  schedules: RuntimeReportSchedule[];
  alerts: RuntimeReportAlert[];
  runs: RuntimeReportRun[];
};

export const getRuntimeReportOperations = () =>
  request<RuntimeReportOperations>("/api/v1/report-operations");

export const createRuntimeReportView = (view: {
  reportId: string;
  name: string;
  reportName: string;
  workload: string;
  description?: string;
  columns: string[];
  filters: ReportFilter[];
  visibility: "private" | "team";
  favorite: boolean;
}) =>
  request<RuntimeReportView>("/api/v1/report-views", {
    method: "POST",
    body: JSON.stringify(view),
  });

export const createRuntimeReportSchedule = (
  viewId: string,
  schedule: {
    name: string;
    cadence: "daily" | "weekly" | "monthly";
    timezone: string;
    runAt: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    delivery: "local_archive";
    status?: "active" | "paused";
  },
) =>
  request<RuntimeReportSchedule>(
    `/api/v1/report-views/${encodeURIComponent(viewId)}/schedules`,
    { method: "POST", body: JSON.stringify(schedule) },
  );

export const createRuntimeReportAlert = (
  viewId: string,
  alert: {
    name: string;
    metric: "row_count" | "critical_count" | "warning_count" | "average_risk";
    operator: "gt" | "gte" | "eq" | "lte" | "lt";
    threshold: number;
    severity: "info" | "warning" | "critical";
    status?: "active" | "paused";
  },
) =>
  request<RuntimeReportAlert>(
    `/api/v1/report-views/${encodeURIComponent(viewId)}/alerts`,
    { method: "POST", body: JSON.stringify(alert) },
  );

type RuntimeReportJob = {
  id: string;
  name: string;
  workload: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  progress: number;
  filters?: ReportFilter[];
  result?: {
    totalRows: number;
    columns: string[];
    rows: string[][];
    metrics: GeneratedReport["metrics"];
  };
  error?: string;
};

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForRuntimeReport(job: RuntimeReportJob) {
  for (
    let attempt = 0;
    attempt < 40 && job.status !== "completed" && job.status !== "failed";
    attempt++
  ) {
    await delay(150);
    job = await request<RuntimeReportJob>(`/api/v1/report-jobs/${job.id}`);
  }
  if (job.status !== "completed" || !job.result)
    throw new Error(
      job.error ?? "Report job did not complete within the acceptance timeout.",
    );
  return {
    id: job.id,
    name: job.name,
    workload: job.workload,
    description:
      "Generated by the persistent local report-job runtime from seeded tenant resources.",
    generatedAt: job.completedAt ?? job.createdAt,
    sourceFreshness: "real-time local runtime",
    totalRows: job.result.totalRows.toLocaleString("en-US"),
    columns: job.result.columns,
    rows: job.result.rows,
    metrics: job.result.metrics,
  } satisfies GeneratedReport;
}

export async function runRuntimeReportSchedule(scheduleId: string) {
  const job = await request<RuntimeReportJob>(
    `/api/v1/report-schedules/${encodeURIComponent(scheduleId)}/run`,
    { method: "POST" },
  );
  return waitForRuntimeReport(job);
}

export async function runRuntimeSavedReportView(viewId: string) {
  const job = await request<RuntimeReportJob>(
    `/api/v1/report-views/${encodeURIComponent(viewId)}/run`,
    { method: "POST" },
  );
  return waitForRuntimeReport(job);
}

export async function runRuntimeReport(
  name: string,
  workload: string,
  columns?: string[],
  filters?: ReportFilter[],
): Promise<GeneratedReport> {
  let job = await request<RuntimeReportJob>("/api/v1/report-jobs", {
    method: "POST",
    body: JSON.stringify({ name, workload, columns, filters }),
  });
  return waitForRuntimeReport(job);
}

export type RuntimeWorkflow = {
  id: string;
  title: string;
  sourceFindingId?: string;
  requestedBy: string;
  owner?: string;
  approver?: string;
  state:
    | "draft"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "running"
    | "completed"
    | "failed"
    | "rolled_back";
  execution?: {
    affected: number;
    succeeded: number;
    failed: number;
    skipped?: number;
    message: string;
  };
};

export type RuntimeFindingCase = {
  findingId: string;
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
  assignee?: { id: string; displayName: string; team: string };
  priority?: "low" | "medium" | "high" | "urgent";
  dueAt?: string;
  note?: string;
  remediationWorkflowId?: string;
  updatedAt: string;
  updatedBy: string;
  activity: Array<{
    id: string;
    type: string;
    actorId: string;
    occurredAt: string;
    summary: string;
  }>;
};

export type RuntimeFindingCaseView = {
  finding: {
    id: string;
    title: string;
    category: string;
    automation: { available: boolean; approvalRequired: boolean };
  };
  case: RuntimeFindingCase;
  remediationWorkflow?: RuntimeWorkflow;
};

export const getRuntimeFindingCase = (id: string) =>
  request<RuntimeFindingCaseView>(
    `/api/v1/findings/${encodeURIComponent(id)}/case`,
  );

export const assignRuntimeFinding = (
  id: string,
  assignment: {
    assigneeId: string;
    assigneeName: string;
    team: string;
    priority: "low" | "medium" | "high" | "urgent";
    dueAt: string;
    note: string;
  },
) =>
  request<RuntimeFindingCaseView>(
    `/api/v1/findings/${encodeURIComponent(id)}/assignments`,
    { method: "POST", body: JSON.stringify(assignment) },
  );

export const createRuntimeFindingRemediation = (
  id: string,
  remediation: {
    title: string;
    targetScope: string;
    justification: string;
    exceptionReview: string[];
    submitForApproval: boolean;
  },
) =>
  request<RuntimeFindingCaseView>(
    `/api/v1/findings/${encodeURIComponent(id)}/remediation`,
    { method: "POST", body: JSON.stringify(remediation) },
  );

export async function getRuntimeWorkflows() {
  return request<{ items: RuntimeWorkflow[] }>("/api/v1/workflows");
}

export async function transitionRuntimeWorkflow(
  id: string,
  action: "approve" | "reject" | "execute" | "rollback",
  comment?: string,
) {
  return request<RuntimeWorkflow>(`/api/v1/workflows/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export async function runRuntimeWorkflow(
  title: string,
  targetScope: string,
  justification: string,
  type = "governed-demo-operation",
  owner?: string,
) {
  let workflow = await createRuntimeWorkflowDraft(
    title,
    targetScope,
    justification,
    type,
    owner,
  );
  workflow = await request<RuntimeWorkflow>(
    `/api/v1/workflows/${workflow.id}/submit`,
    { method: "POST", body: "{}" },
  );
  return workflow;
}

export async function createRuntimeWorkflowDraft(
  title: string,
  targetScope: string,
  justification: string,
  type = "governed-demo-operation",
  owner?: string,
) {
  return request<RuntimeWorkflow>(
    "/api/v1/workflows",
    {
      method: "POST",
      body: JSON.stringify({
        title,
        type,
        targetScope,
        justification,
        owner,
      }),
    },
  );
}

export function runtimeEventUrl() {
  return `${API}/api/v1/events/stream`;
}

export type DemoOverview = {
  generatedAt: string;
  tenant: {
    name: string;
    industry: string;
    countries: number;
    activeScenario: string;
    lastSimulationAt: string;
    kpis: { users: number; activeUsers: number; inactiveUsers: number; securityScore: number; complianceScore: number; licenseUtilization: number; storageUsage: number; highRiskUsers: number };
  };
  objectCounts: Record<string, number>;
  departments: Array<{ id: string; name: string; detail: string }>;
  locations: Array<{ id: string; name: string; detail: string }>;
  scenarios: Array<{ id: string; label: string; description: string }>;
  latestEvents: Array<{ id: string; occurredAt: string; type: string; title: string; detail: string; severity: string }>;
};

export type DemoUser = {
  id: string; displayName: string; username: string; department: string; location: string; manager: string; jobTitle: string;
  license: string; accountStatus: string; riskLevel: string; lastLogin: string; mfaStatus: string; devices: number; teams: number; mailboxGb: number;
  recommendations?: string[];
};

export const getDemoOverview = () => request<DemoOverview>("/api/v1/demo/overview");
export const activateDemoScenario = (scenario: string) => request<DemoOverview>(`/api/v1/demo/scenarios/${scenario}/activate`, { method: "POST", body: "{}" });
export const runDemoTick = () => request<{ id: string; title: string; detail: string }>("/api/v1/demo/tick", { method: "POST", body: "{}" });
export const resetDemoEnvironment = () => request<{ users: number; enterpriseObjects: number }>("/api/v1/simulation/reset", { method: "POST", body: "{}" });
export const getDemoUsers = (search = "", risk = "", limit = 100) => request<{ total: number; items: DemoUser[] }>(`/api/v1/demo/users?search=${encodeURIComponent(search)}&risk=${encodeURIComponent(risk)}&limit=${limit}`);
export const getDemoUser = (id: string) => request<DemoUser>(`/api/v1/demo/users/${encodeURIComponent(id)}`);
export const getDemoSecurity = () => request<{ score: number; riskDistribution: { high: number; medium: number; low: number }; activeIncidents: number; events: Array<{ id: string; title: string; severity: string; user: string; location: string; detection: string; status: string }>; findings: Array<{ id: string; title: string; count: number; severity: string; recommendation: string }>; recommendations: string[] }>("/api/v1/demo/security");
export const getDemoLicenses = () => request<{ utilization: number; annualSavings: number; plans: Array<{ id: string; name: string; assigned: number; activeUsage: number; unused: number; monthlyUnitCost: number }>; candidates: Array<{ user: string; username: string; currentLicense: string; usage: string; recommendation: string; annualSaving: number }> }>("/api/v1/demo/licenses");
export const getDemoCompliance = () => request<{ score: number; frameworkScores: Array<{ framework: string; score: number; controls: number; failed: number }>; controls: Array<{ id: string; framework: string; control: string; score: number; failed: number; status: string; recommendation: string }> }>("/api/v1/demo/compliance");
export const askDemoAi = (question: string) => request<{ question: string; answer: string; findings?: Array<{ title: string; count: number }>; recommendations: string[]; sources: string[]; groundedAt: string }>("/api/v1/demo/ai", { method: "POST", body: JSON.stringify({ question }) });

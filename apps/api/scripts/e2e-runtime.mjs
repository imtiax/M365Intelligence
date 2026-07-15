import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const base = process.env.API_URL ?? "http://127.0.0.1:3001";
const tenant = "00000000-0000-4000-8000-000000000001";
const env = Object.fromEntries(readFileSync(resolve("../web/.env.local"), "utf8").split(/\r?\n/).filter((line) => /^[^#][^=]*=/.test(line)).map((line) => {
  const separator = line.indexOf("=");
  return [line.slice(0, separator), line.slice(separator + 1)];
}));
const internalSecret = env.AEGIS_INTERNAL_API_SECRET;
if (!internalSecret) throw new Error("AEGIS_INTERNAL_API_SECRET is not configured. Run the web auth setup.");
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function authHeaders(actor, roles) {
  const identity = Buffer.from(JSON.stringify({ tenantId: tenant, actorId: actor, roles: roles.split(","), issuedAt: Date.now(), nonce: randomUUID() })).toString("base64url");
  return {
    "x-aegis-identity": identity,
    "x-aegis-signature": createHmac("sha256", internalSecret).update(identity).digest("base64url"),
  };
}

async function call(
  path,
  {
    method = "GET",
    body,
    actor = "acceptance.requester@apex.local",
    roles = "platform-admin,security-admin",
    expected,
  } = {},
) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(actor, roles),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (
    (expected !== undefined && response.status !== expected) ||
    (expected === undefined && !response.ok)
  )
    throw new Error(
      `${method} ${path}: expected ${expected ?? "2xx"}, received ${response.status}: ${JSON.stringify(payload)}`,
    );
  return payload;
}

async function waitFor(path, state) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const value = await call(path);
    if (value.status === state || value.state === state) return value;
    await delay(150);
  }
  throw new Error(`${path} did not reach ${state}.`);
}

const health = await call("/health/ready");
const replayHeaders = authHeaders("acceptance.replay@apex.local", "read-only");
const firstEnvelopeUse = await fetch(`${base}/api/v1/admin-centers`, { headers: replayHeaders });
const replayedEnvelope = await fetch(`${base}/api/v1/admin-centers`, { headers: replayHeaders });
if (firstEnvelopeUse.status !== 200 || replayedEnvelope.status !== 401) throw new Error(`Internal identity replay defense failed (${firstEnvelopeUse.status}/${replayedEnvelope.status}).`);
const reset = await call("/api/v1/simulation/reset", { method: "POST" });
const centers = await call("/api/v1/admin-centers");
if (centers.items.length !== 10) throw new Error("Expected ten admin centers.");
const resources = centers.items.reduce((total, item) => total + item.total, 0);
if (resources !== 7850)
  throw new Error(`Expected 7,850 seeded resources, received ${resources}.`);

await call("/api/v1/report-jobs", {
  method: "POST",
  body: { name: "Invalid report", workload: "Unknown workload" },
  expected: 409,
});
await call("/api/v1/report-jobs", {
  method: "POST",
  body: { name: "Unauthorized report", workload: "Microsoft Entra ID" },
  roles: "read-only",
  expected: 403,
});
const queuedReport = await call("/api/v1/report-jobs", {
  method: "POST",
  body: {
    name: "E2E identity risk report",
    workload: "Microsoft Entra ID",
    columns: ["Display name", "Risk score", "Department", "Owner"],
  },
});
const report = await waitFor(
  `/api/v1/report-jobs/${queuedReport.id}`,
  "completed",
);
if (report.result.totalRows !== 1400 || report.result.rows.length !== 250)
  throw new Error("Report result counts are incorrect.");
if (
  report.result.columns.join("|") !== "Display name|Risk score|Department|Owner"
)
  throw new Error("Custom report projection was not preserved.");

const workflow = await call("/api/v1/workflows", {
  method: "POST",
  body: {
    title: "E2E governed license remediation",
    type: "license-remediation",
    targetScope: "Acceptance group of 87 inactive assignments",
    justification: "First complete HTTP acceptance workflow",
  },
});
await call(`/api/v1/workflows/${workflow.id}/submit`, {
  method: "POST",
  body: {},
});
await call(`/api/v1/workflows/${workflow.id}/approve`, {
  method: "POST",
  body: {},
  expected: 403,
});
await call(`/api/v1/workflows/${workflow.id}/approve`, {
  method: "POST",
  body: {},
  actor: "acceptance.approver@apex.local",
});
await call(`/api/v1/workflows/${workflow.id}/execute`, {
  method: "POST",
  body: {},
  actor: "workflow.engine@apex.local",
});
const completedWorkflow = await waitFor(
  `/api/v1/workflows/${workflow.id}`,
  "completed",
);
if (!completedWorkflow.execution?.succeeded)
  throw new Error("Workflow did not affect the acceptance scope.");
const rolledBack = await call(`/api/v1/workflows/${workflow.id}/rollback`, {
  method: "POST",
  body: {},
  actor: "workflow.engine@apex.local",
});
if (rolledBack.state !== "rolled_back")
  throw new Error("Workflow rollback failed.");

const failure = await call("/api/v1/workflows", {
  method: "POST",
  body: {
    title: "E2E failure path",
    type: "acceptance-failure",
    targetScope: "failure-test scope",
    justification: "Verify that failures do not commit target changes",
  },
});
await call(`/api/v1/workflows/${failure.id}/submit`, {
  method: "POST",
  body: {},
});
await call(`/api/v1/workflows/${failure.id}/approve`, {
  method: "POST",
  body: {},
  actor: "acceptance.approver@apex.local",
});
await call(`/api/v1/workflows/${failure.id}/execute`, {
  method: "POST",
  body: {},
  actor: "workflow.engine@apex.local",
});
const failedWorkflow = await waitFor(
  `/api/v1/workflows/${failure.id}`,
  "failed",
);
if (failedWorkflow.execution.succeeded !== 0)
  throw new Error("Injected failure committed target changes.");

const streamController = new AbortController();
const eventPromise = fetch(`${base}/api/v1/events/stream`, {
  headers: authHeaders("acceptance.stream@apex.local", "platform-admin"),
  signal: streamController.signal,
}).then(async (response) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let content = "";
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = await reader.read();
    if (result.done) break;
    content += decoder.decode(result.value);
    if (content.includes("resource.updated")) return content;
  }
  throw new Error("Real-time resource.updated event was not received.");
});
await delay(150);
const tick = await call("/api/v1/simulation/tick", { method: "POST" });
const streamed = await Promise.race([
  eventPromise,
  delay(5000).then(() => {
    throw new Error("SSE acceptance timeout.");
  }),
]);
streamController.abort();

const audit = await call("/api/v1/audit");
if (!audit.integrity || audit.items.length < 15)
  throw new Error("Audit chain verification failed.");
const persistedReports = await call("/api/v1/report-jobs");
const persistedWorkflows = await call("/api/v1/workflows");

console.log(
  JSON.stringify(
    {
      health: health.status,
      replayDefense: { firstUse: firstEnvelopeUse.status, replay: replayedEnvelope.status },
      seeded: reset,
      adminCenters: centers.items.length,
      resources,
      report: {
        id: report.id,
        status: report.status,
        totalRows: report.result.totalRows,
        previewRows: report.result.rows.length,
        columns: report.result.columns,
      },
      workflow: {
        id: completedWorkflow.id,
        completed: completedWorkflow.execution,
        rollback: rolledBack.state,
      },
      failurePath: {
        id: failedWorkflow.id,
        state: failedWorkflow.state,
        result: failedWorkflow.execution,
      },
      realtime: {
        event: "resource.updated",
        resource: tick.resource.id,
        received: streamed.includes(tick.resource.id),
      },
      audit: { records: audit.items.length, integrity: audit.integrity },
      persistence: {
        reportJobs: persistedReports.items.length,
        workflows: persistedWorkflows.items.length,
      },
    },
    null,
    2,
  ),
);

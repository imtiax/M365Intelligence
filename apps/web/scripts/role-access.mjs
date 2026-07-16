const base = process.env.WEB_URL ?? "http://127.0.0.1:3008";
const password = process.env.AEGIS_SMOKE_PASSWORD;
if (!password) throw new Error("AEGIS_SMOKE_PASSWORD is required.");

const personas = [
  { username: "admin@apex.local", role: "platform-admin", reports: 201, workflows: 201, findings: 201, findingCase: 200, audit: 200, users: 200, scenario: 201 },
  { username: "security@apex.local", role: "security-admin", reports: 403, workflows: 201, findings: 201, findingCase: 200, audit: 200, users: 403, scenario: 201 },
  { username: "m365admin@apex.local", role: "m365-admin", reports: 403, workflows: 201, findings: 201, findingCase: 200, audit: 403, users: 403, scenario: 201 },
  { username: "reports@apex.local", role: "report-admin", reports: 201, workflows: 403, findings: 403, findingCase: 403, audit: 403, users: 403, scenario: 403 },
  { username: "auditor@apex.local", role: "auditor", reports: 403, workflows: 403, findings: 403, findingCase: 200, audit: 200, users: 403, scenario: 403 },
  { username: "viewer@apex.local", role: "read-only", reports: 403, workflows: 403, findings: 403, findingCase: 403, audit: 403, users: 403, scenario: 403 },
];

async function request(path, { method = "GET", cookie, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      origin: base,
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  return response;
}

const results = [];
const sessions = new Map();
for (const persona of personas) {
  const login = await request("/api/auth/login", { method: "POST", body: { username: persona.username, password } });
  if (login.status !== 200) throw new Error(`${persona.username} login returned ${login.status}.`);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error(`${persona.username} did not receive a session cookie.`);
  sessions.set(persona.username, cookie);
  const meResponse = await request("/api/auth/me", { cookie });
  const me = await meResponse.json();
  if (meResponse.status !== 200 || !me.roles.includes(persona.role)) throw new Error(`${persona.username} session role is incorrect.`);

  const users = await request("/api/auth/users", { cookie });
  const report = await request("/api/runtime/api/v1/report-jobs", { cookie, method: "POST", body: { name: `RBAC ${persona.role}`, workload: "Microsoft Entra ID" } });
  const workflow = await request("/api/runtime/api/v1/workflows", { cookie, method: "POST", body: { title: `RBAC ${persona.role}`, type: "rbac-test", targetScope: "Acceptance role scope", justification: "Verify effective organization authorization" } });
  const finding = await request("/api/runtime/api/v1/findings/FND-1029/assignments", { cookie, method: "POST", body: { assigneeId: persona.username, assigneeName: persona.role, team: "RBAC acceptance", priority: "medium", dueAt: new Date(Date.now() + 7 * 86400000).toISOString(), note: "Verify effective finding authorization through the web boundary." } });
  const findingCase = await request("/api/runtime/api/v1/findings/FND-1029/case", { cookie });
  const audit = await request("/api/runtime/api/v1/audit", { cookie });
  const overview = await request("/api/runtime/api/v1/demo/overview", { cookie });
  if (overview.status !== 200) throw new Error(`${persona.username} cannot read the enterprise demo overview.`);
  const scenario = await request("/api/runtime/api/v1/demo/scenarios/executive-cio/activate", { cookie, method: "POST", body: {} });
  const actual = { users: users.status, reports: report.status, workflows: workflow.status, findings: finding.status, findingCase: findingCase.status, audit: audit.status, scenario: scenario.status };
  for (const key of Object.keys(actual)) {
    if (actual[key] !== persona[key]) throw new Error(`${persona.username} ${key}: expected ${persona[key]}, received ${actual[key]}.`);
  }
  results.push({ username: persona.username, role: persona.role, ...actual });
}

const securityCookie = sessions.get("security@apex.local");
const adminCookie = sessions.get("admin@apex.local");
const m365Cookie = sessions.get("m365admin@apex.local");
const created = await request("/api/runtime/api/v1/workflows", { cookie: securityCookie, method: "POST", body: { title: "Cross-role approval acceptance", type: "security-remediation", targetScope: "Security acceptance group", justification: "Validate requester, independent approver, and execution identities through the web boundary" } });
if (created.status !== 201) throw new Error(`Cross-role workflow creation returned ${created.status}.`);
let governed = await created.json();
let response = await request(`/api/runtime/api/v1/workflows/${governed.id}/submit`, { cookie: securityCookie, method: "POST", body: {} });
if (response.status !== 201) throw new Error(`Cross-role workflow submission returned ${response.status}.`);
response = await request(`/api/runtime/api/v1/workflows/${governed.id}/approve`, { cookie: adminCookie, method: "POST", body: {} });
if (response.status !== 201) throw new Error(`Cross-role workflow approval returned ${response.status}.`);
response = await request(`/api/runtime/api/v1/workflows/${governed.id}/execute`, { cookie: m365Cookie, method: "POST", body: {} });
if (response.status !== 201) throw new Error(`Cross-role workflow execution returned ${response.status}.`);
for (let attempt = 0; attempt < 40; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  response = await request(`/api/runtime/api/v1/workflows/${governed.id}`, { cookie: adminCookie });
  governed = await response.json();
  if (governed.state === "completed") break;
}
if (governed.state !== "completed" || !governed.execution?.succeeded) throw new Error("Cross-role governed workflow did not complete.");
response = await request(`/api/runtime/api/v1/workflows/${governed.id}/rollback`, { cookie: m365Cookie, method: "POST", body: {} });
const rolledBack = await response.json();
if (response.status !== 201 || rolledBack.state !== "rolled_back") throw new Error("Cross-role governed workflow rollback failed.");

console.log(JSON.stringify({ personas: results.length, authorizationMatrix: results, governedWorkflow: { requester: "security@apex.local", approver: "admin@apex.local", executor: "m365admin@apex.local", succeeded: governed.execution.succeeded, rollback: rolledBack.state } }, null, 2));

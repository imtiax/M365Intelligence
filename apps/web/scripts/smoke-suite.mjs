import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const password = process.env.AEGIS_SMOKE_PASSWORD;
if (!password) throw new Error("AEGIS_SMOKE_PASSWORD is required.");
const chrome =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9333;
const profile = join(tmpdir(), `aegis-chrome-${process.pid}`);
const downloadPath = join(process.cwd(), "artifacts");
const smokeStartedAt = Date.now();
const child = spawn(
  chrome,
  [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1600,1100",
    "http://localhost:3008/login",
  ],
  { stdio: "ignore" },
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function target() {
  for (let i = 0; i < 80; i++) {
    try {
      const pages = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(
        (r) => r.json(),
      );
      const page = pages.find((x) => x.type === "page");
      if (page) return page;
    } catch {}
    await delay(250);
  }
  throw new Error("Chrome DevTools target did not start.");
}
const page = await target();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const call = ++id;
    pending.set(call, { resolve, reject });
    socket.send(JSON.stringify({ id: call, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression, label) {
  for (let i = 0; i < 50; i++) {
    if (await evaluate(expression)) return;
    await delay(150);
  }
  const actual = await evaluate(
    "document.querySelector('h1')?.textContent||location.href",
  );
  throw new Error(`Timed out waiting for ${label}; current heading: ${actual}`);
}
async function waitForDownload(extension) {
  for (let i = 0; i < 80; i++) {
    const files = await readdir(downloadPath).catch(() => []);
    const matches = files.filter((file) => file.endsWith(extension));
    for (const match of matches) {
      const details = await stat(join(downloadPath, match));
      if (details.size > 100 && details.mtimeMs >= smokeStartedAt)
        return { file: match, bytes: details.size };
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${extension} report download.`);
}
async function downloadSnapshot(extension) {
  const snapshot = new Map();
  for (const file of (await readdir(downloadPath).catch(() => [])).filter((item) => item.endsWith(extension))) {
    snapshot.set(file, (await stat(join(downloadPath, file))).mtimeMs);
  }
  return snapshot;
}
async function waitForNewDownload(extension, previousFiles) {
  for (let i = 0; i < 80; i++) {
    const files = await readdir(downloadPath).catch(() => []);
    for (const file of files.filter((item) => item.endsWith(extension))) {
      const details = await stat(join(downloadPath, file));
      if (details.size > 100 && details.mtimeMs >= smokeStartedAt && details.mtimeMs > (previousFiles.get(file) ?? 0))
        return { file, bytes: details.size };
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for a new ${extension} artifact.`);
}

try {
  await send("Runtime.enable");
  await send("Page.enable");
  await mkdir(downloadPath, { recursive: true });
  await send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath,
  });
  await waitFor(
    "location.pathname==='/login'&&document.querySelector('form')",
    "login page",
  );
  await delay(1000);
  const entraGate = await evaluate(`(()=>{const button=document.querySelector('.entra-button');if(!button||button.disabled)return false;button.click();return true})()`);
  if (!entraGate) throw new Error("Microsoft Entra production-gate control is unavailable.");
  await waitFor("document.querySelector('#entra-configuration-status')?.textContent.includes('Entra production gate')", "Entra production-gate guidance");
  const login = await evaluate(
    `fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin@apex.local',password:${JSON.stringify(password)}})}).then(async r=>({status:r.status,body:await r.text()}))`,
  );
  if (login.status !== 200)
    throw new Error(`Login failed: ${JSON.stringify(login)}`);
  await evaluate("location.assign('/')");
  await waitFor(
    "document.querySelector('h1')?.textContent.includes('Enterprise posture')",
    "authenticated command center",
  );
  // Wait for the client bundle to hydrate before exercising React event handlers.
  await delay(1800);
  await waitFor(
    "document.querySelector('.runtime-live')?.classList.contains('online')",
    "real-time runtime connection",
  );
  await waitFor(
    "document.querySelector('.enterprise-demo')?.textContent.includes('Global Enterprise Holdings')&&document.querySelector('.enterprise-demo')?.textContent.includes('5,000')",
    "5,000-user enterprise simulation",
  );
  const browserReset = await evaluate("fetch('/api/runtime/api/v1/simulation/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(async r=>({status:r.status,body:await r.text()}))");
  if (browserReset.status !== 201) throw new Error(`Browser runtime reset failed: ${JSON.stringify(browserReset)}`);
  // Exercise the complete finding ownership and remediation journey.
  await evaluate(`(()=>{const row=[...document.querySelectorAll('.findings-data button.data-row')].find(x=>x.textContent.includes('FND-1029'));if(!row)return false;row.click();return true})()`);
  await waitFor("!!document.querySelector('[data-testid=\"finding-drawer-FND-1029\"]')", "dormant E5 finding drawer");
  await waitFor("document.querySelector('.finding-case-status')?.textContent.trim()==='unassigned'", "unassigned finding case");
  await evaluate("document.querySelector('[data-testid=\"assign-finding\"]').click()");
  await waitFor("!!document.querySelector('[data-testid=\"assignment-dialog\"]')", "assignment form");
  await evaluate(`(()=>{const input=document.querySelector('[data-testid="assignment-note"]');const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-testid="save-assignment"]').click();return true})()`);
  await delay(250);
  if (!(await evaluate("!!document.querySelector('[data-testid=\"assignment-dialog\"]')"))) throw new Error("Required assignment note did not block submission.");
  await evaluate(`(()=>{const input=document.querySelector('[data-testid="assignment-note"]');const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(input,'Validate leave, service-account, and legal-hold exceptions before reclaiming licenses.');input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-testid="save-assignment"]').click();return true})()`);
  await waitFor("!document.querySelector('[data-testid=\"assignment-dialog\"]')", "assignment saved");
  await waitFor("document.querySelector('[data-testid=\"finding-drawer-FND-1029\"]')?.textContent.includes('Omar Rahman')&&!!document.querySelector('[data-testid=\"finding-activity\"]')", "persisted finding assignment");
  await evaluate("location.reload()");
  await waitFor("document.querySelector('h1')?.textContent.includes('Enterprise posture')", "finding assignment reload");
  await delay(1200);
  await evaluate(`(()=>{const row=[...document.querySelectorAll('.findings-data button.data-row')].find(x=>x.textContent.includes('FND-1029'));row.click();return true})()`);
  await waitFor("document.querySelector('[data-testid=\"finding-drawer-FND-1029\"]')?.textContent.includes('Omar Rahman')", "assignment survives reload");
  await evaluate("document.querySelector('[data-testid=\"draft-remediation\"]').click()");
  await waitFor("!!document.querySelector('[data-testid=\"remediation-dialog\"]')", "remediation form");
  await evaluate(`(()=>{const label=[...document.querySelectorAll('.exception-review label')].find(x=>x.textContent.includes('Legal hold'));label.querySelector('input').click();document.querySelector('[data-testid="submit-remediation"]').click();return true})()`);
  await waitFor("document.querySelector('.action-error')?.textContent.includes('legal_hold')", "mandatory license exception validation");
  await evaluate(`(()=>{const label=[...document.querySelectorAll('.exception-review label')].find(x=>x.textContent.includes('Legal hold'));label.querySelector('input').click();document.querySelector('[data-testid="submit-remediation"]').click();return true})()`);
  await waitFor("!document.querySelector('[data-testid=\"remediation-dialog\"]')", "remediation submitted");
  await waitFor("document.querySelector('[data-testid=\"linked-workflow\"]')?.textContent.includes('pending approval')", "finding workflow link");
  await evaluate("location.reload()");
  await waitFor("document.querySelector('h1')?.textContent.includes('Enterprise posture')", "finding remediation reload");
  await delay(1200);
  await evaluate(`(()=>{const row=[...document.querySelectorAll('.findings-data button.data-row')].find(x=>x.textContent.includes('FND-1029'));row.click();return true})()`);
  await waitFor("document.querySelector('[data-testid=\"linked-workflow\"]')?.textContent.includes('pending approval')", "remediation survives reload");
  await evaluate("document.querySelector('[data-testid=\"linked-workflow\"]').click()");
  await waitFor("document.querySelector('h1')?.textContent.includes('Automation center')", "linked Automation queue");
  await waitFor("document.querySelector('.compact-table')?.textContent.includes('Remediate FND-1029')", "linked workflow visible in Automation queue");
  await evaluate(`(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Command center')).click();return true})()`);
  await waitFor("document.querySelector('h1')?.textContent.includes('Enterprise posture')", "return to command center");
  await waitFor("!!document.querySelector('.scenario-selector button')", "command-center scenario selector reload");
  await evaluate(`([...document.querySelectorAll('.scenario-selector button')].find(x=>x.textContent.includes('License Optimization'))).click()`);
  await waitFor(
    "[...document.querySelectorAll('.scenario-selector button')].some(x=>x.classList.contains('selected')&&x.textContent.includes('License Optimization'))",
    "license optimization scenario activation",
  );
  const modules = [
    ["Explorer 360", "Global workforce intelligence"],
    ["Dashboard designer", "Custom dashboard designer"],
    ["Value center", "Business value center"],
    ["Security", "Security operations center"],
    ["Alerts", "Intelligent alert policies"],
    ["Identity", "Identity intelligence"],
    ["Management", "Microsoft 365 management center"],
    ["Automations", "Automation center"],
    ["Reporting", "Microsoft 365 report center"],
    ["Custom reports", "Custom report builder"],
    ["Auditing", "Microsoft 365 audit explorer"],
    ["Usage analytics", "Microsoft 365 adoption analytics"],
    ["Compliance", "Continuous compliance"],
    ["Licenses", "License optimization"],
    ["Digital twin", "Microsoft 365 digital twin"],
    ["Report studio", "Report studio"],
    ["Governance", "Microsoft 365 governance portal"],
    ["Reminders", "Reminder and follow-up agents"],
    ["Delegation", "Least-privilege delegation"],
    ["Hybrid AD", "Hybrid Active Directory operations"],
    ["AI analyst", "Aegis AI analyst"],
    ["Connection center", "Connection center"],
    ["Customer portal", "Customer portal"],
    ["Configuration", "Platform configuration"],
    ["Administration", "Platform administration"],
    ["Super Admin", "Super Admin"],
  ];
  const governedActionLabels = [
    "Dashboard library", "Run investigation", "Access review", "New policy analysis",
    "+ New alert policy", "Job history", "New custom job",
    "Execution history", "New playbook", "Export queue", "Advanced filters",
    "Policy library", "+ New request", "Message templates", "New agent",
    "Access reviews", "+ Create delegated role", "Collector settings", "Explore graph",
    "Import template", "Build report", "Pricing model", "Create savings plan",
    "Start assessment", "Generate campaign", "Show proof in product →",
  ];
  const testedGovernedActions = new Set();
  const verified = [];
  for (const [label, title] of modules) {
    const clicked = await evaluate(
      `(()=>{const button=[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith(${JSON.stringify(label)}));if(!button)return false;button.click();return true})()`,
    );
    if (!clicked) throw new Error(`Navigation item not found: ${label}`);
    await waitFor(
      `document.querySelector('h1')?.textContent.includes(${JSON.stringify(title)})`,
      title,
    );
    const expectedHash =
      "#" +
      label
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    if ((await evaluate("location.hash")) !== expectedHash)
      throw new Error(`Deep link mismatch for ${label}`);
    const pageActions = await evaluate(`(()=>{const allowed=${JSON.stringify(governedActionLabels)};return [...document.querySelectorAll('main button')].map(x=>(x.textContent||'').trim().replace(/\\s+/g,' ')).filter(text=>allowed.includes(text))})()`);
    for (const actionLabel of pageActions) {
      await evaluate(`(()=>{const button=[...document.querySelectorAll('main button')].find(x=>(x.textContent||'').trim().replace(/\\s+/g,' ')===${JSON.stringify(actionLabel)});button.click();return true})()`);
      await waitFor("!!document.querySelector('.action-dialog')", `${actionLabel} governed dialog`);
      await evaluate(`([...document.querySelectorAll('.action-dialog footer button')].find(x=>x.textContent.includes('Save draft'))).click()`);
      await waitFor("!document.querySelector('.action-dialog')", `${actionLabel} persisted draft close`);
      await waitFor("document.querySelector('.toast')?.textContent.includes('draft')", `${actionLabel} persisted draft confirmation`);
      testedGovernedActions.add(actionLabel);
    }
    verified.push(label);
  }
  const operationalExports = [];
  for (const [module, heading, label] of [
    ["Security", "Security operations center", "Export incidents"],
    ["Auditing", "Microsoft 365 audit explorer", "Export evidence"],
    ["Compliance", "Continuous compliance", "Evidence pack"],
    ["Usage analytics", "Microsoft 365 adoption analytics", "Adoption pack"],
    ["Value center", "Business value center", "Export proposal"],
  ]) {
    await evaluate(`(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith(${JSON.stringify(module)})).click();return true})()`);
    await waitFor(`document.querySelector('h1')?.textContent.includes(${JSON.stringify(heading)})`, `${module} export workspace`);
    const before = await downloadSnapshot(".pdf");
    await evaluate(`(()=>{const button=[...document.querySelectorAll('main button')].find(x=>x.textContent.trim().replace(/\\s+/g,' ')===${JSON.stringify(label)});if(!button)return false;button.click();return true})()`);
    const artifact = await waitForNewDownload(".pdf", before);
    const header = (await readFile(join(downloadPath, artifact.file))).subarray(0, 8).toString("ascii");
    if (!header.startsWith("%PDF-")) throw new Error(`${label} did not generate a valid PDF.`);
    operationalExports.push({ label, ...artifact });
  }
  await evaluate(`(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Auditing')).click();return true})()`);
  await waitFor("document.querySelector('h1')?.textContent.includes('Microsoft 365 audit explorer')", "audit stateful actions");
  await evaluate("document.querySelector('.audit-events>button').click()");
  await waitFor("!!document.querySelector('.suite-drawer')", "audit event detail");
  await evaluate(`([...document.querySelectorAll('.suite-drawer .drawer-actions button')].find(x=>x.textContent.includes('Add to case'))).click()`);
  await evaluate("document.querySelector('.drawer-head button').click()");
  await waitFor("document.querySelector('[data-testid=\"audit-action-outcome\"]')?.textContent.includes('1 event')", "audit case attachment outcome");
  await evaluate(`([...document.querySelectorAll('.page-heading button')].find(x=>x.textContent.includes('Create alert'))).click()`);
  await waitFor("document.querySelector('[data-testid=\"audit-action-outcome\"]')?.textContent.includes('is active')", "audit alert outcome");
  await evaluate(`(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Alerts')).click();return true})()`);
  await waitFor("document.querySelector('h1')?.textContent.includes('Intelligent alert policies')", "alert delivery action");
  await evaluate("document.querySelector('.policy-grid article button').click()");
  await waitFor("document.querySelector('[data-testid=\"alert-delivery-history\"]')?.textContent.includes('Delivered')", "alert delivery result");
  await evaluate(`(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Reminders')).click();return true})()`);
  await waitFor("document.querySelector('h1')?.textContent.includes('Reminder and follow-up agents')", "reminder preview action");
  await evaluate("document.querySelector('.agent-grid article>button').click()");
  await waitFor("!!document.querySelector('[data-testid=\"reminder-message-preview\"]')", "rendered reminder message");
  await evaluate("document.querySelector('[data-testid=\"reminder-message-preview\"] .drawer-head button').click()");
  await evaluate(`(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Delegation')).click();return true})()`);
  await waitFor("document.querySelector('h1')?.textContent.includes('Least-privilege delegation')", "delegation review action");
  await evaluate("document.querySelector('.delegation-grid article footer button').click()");
  await waitFor("!!document.querySelector('[data-testid=\"delegation-access-review\"]')", "delegation review decision");
  await evaluate(`([...document.querySelectorAll('[data-testid="delegation-access-review"] .drawer-actions button')].find(x=>x.textContent.includes('Approve 90 days'))).click()`);
  await waitFor("document.querySelector('.delegation-grid article footer')?.textContent.includes('Reviewed · 90 days')", "delegation decision outcome");
  await evaluate(`(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Hybrid AD')).click();return true})()`);
  await waitFor("document.querySelector('h1')?.textContent.includes('Hybrid Active Directory operations')", "hybrid actions");
  await evaluate(`([...document.querySelectorAll('.page-heading button')].find(x=>x.textContent.includes('Run health scan'))).click()`);
  await waitFor("document.querySelector('[data-testid=\"hybrid-scan-result\"]')?.textContent.includes('HEALTH SCAN COMPLETED')", "hybrid scan result");
  await evaluate("document.querySelector('.domain-grid article>button').click()");
  await waitFor("!!document.querySelector('[data-testid=\"hybrid-topology\"]')", "hybrid topology result");
  await evaluate("document.querySelector('[data-testid=\"hybrid-topology\"] .drawer-head button').click()");
  await evaluate(`(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('AI analyst')).click();return true})()`);
  await waitFor("!!document.querySelector('.ai-input input')", "AI analyst input");
  await evaluate(`(()=>{const input=document.querySelector('.ai-input input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'Show me security problems');input.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
  await delay(150);
  await evaluate("document.querySelector('.ai-input button').click()");
  await waitFor(
    "document.querySelector('.chat.assistant')?.textContent.includes('120 users without MFA')",
    "grounded AI security response",
  );
  // Exercise every admin-center dashboard and a complete report generation/export flow.
  await evaluate(
    `(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Reporting')).click();return true})()`,
  );
  await waitFor(
    "document.querySelector('h1')?.textContent.includes('Microsoft 365 report center')",
    "report center",
  );
  await waitFor(
    "document.querySelector('.admin-dashboard>header>span')?.textContent.includes('7,850 persisted objects')",
    "persisted dashboard resources",
  );
  const adminCenters = await evaluate(
    "document.querySelectorAll('.admin-center-list>button').length",
  );
  if (adminCenters !== 10)
    throw new Error(
      `Expected 10 admin-center dashboards, found ${adminCenters}.`,
    );
  for (const buttonIndex of Array.from({ length: adminCenters }, (_, i) => i)) {
    await evaluate(
      `document.querySelectorAll('.admin-center-list>button')[${buttonIndex}].click()`,
    );
    await waitFor(
      `document.querySelectorAll('.admin-dashboard-metrics article').length===4`,
      `admin dashboard ${buttonIndex + 1}`,
    );
  }
  const adminDashboardShot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(
    "artifacts/smoke-admin-center-dashboard.png",
    Buffer.from(adminDashboardShot.data, "base64"),
  );
  await evaluate(
    "document.querySelector('.admin-quick-reports button').click()",
  );
  await waitFor(
    "document.querySelectorAll('.generated-table-wrap tbody tr').length===250",
    "generated report result rows",
  );
  await evaluate(
    `([...document.querySelectorAll('.generated-actions button')].find(x=>x.textContent.includes('Download Excel'))).click()`,
  );
  const excelDownload = await waitForDownload(".xls");
  await evaluate(
    `([...document.querySelectorAll('.generated-actions button')].find(x=>x.textContent.includes('Download PDF'))).click()`,
  );
  const pdfDownload = await waitForDownload(".pdf");
  const excelHeader = (await readFile(join(downloadPath, excelDownload.file))).subarray(0, 64).toString("utf8");
  if (!excelHeader.includes("<?xml") || !excelHeader.includes("mso-application")) throw new Error("Excel export is not a valid SpreadsheetML workbook.");
  const pdfHeader = (await readFile(join(downloadPath, pdfDownload.file))).subarray(0, 8).toString("ascii");
  if (!pdfHeader.startsWith("%PDF-")) throw new Error("PDF export does not contain a valid PDF signature.");
  await evaluate("document.querySelector('.close-generated').click()");
  await waitFor(
    "!document.querySelector('.generated-report')",
    "report viewer close",
  );
  // Verify catalogue reports use the same result engine.
  await evaluate(
    `([...document.querySelectorAll('.report-mode-tabs button')].find(x=>x.textContent.includes('Report catalogue'))).click()`,
  );
  await waitFor(
    "!!document.querySelector('.report-workspace')",
    "report catalogue",
  );
  await evaluate(`([...document.querySelectorAll('.catalogue-toolbar button')].find(x=>x.textContent.includes('Advanced filters'))).click()`);
  await waitFor("!!document.querySelector('.action-dialog')", "advanced filters dialog");
  await evaluate(`([...document.querySelectorAll('.action-dialog footer button')].find(x=>x.textContent.includes('Cancel'))).click()`);
  await waitFor("!document.querySelector('.action-dialog')", "advanced filters dialog close");
  testedGovernedActions.add("Advanced filters");
  const missingGovernedActions = governedActionLabels.filter((label) => !testedGovernedActions.has(label));
  if (missingGovernedActions.length) throw new Error(`Governed CTA coverage is incomplete: ${missingGovernedActions.join(', ')}`);
  const actionWorkflowInventory = await evaluate("fetch('/api/runtime/api/v1/workflows').then(r=>r.json())");
  const persistentActionDrafts = actionWorkflowInventory.items.filter((item) => item.state === "draft" && item.type.startsWith("module-")).length;
  if (persistentActionDrafts < testedGovernedActions.size) throw new Error(`Expected at least ${testedGovernedActions.size} persisted module drafts; received ${persistentActionDrafts}.`);
  await evaluate("document.querySelector('.catalogue-list button').click()");
  await waitFor(
    "!!document.querySelector('.suite-drawer')",
    "report configuration drawer",
  );
  for (const tab of ["Columns", "Filters", "Schedule", "Preview"]) {
    await evaluate(`([...document.querySelectorAll('.drawer-tabs button')].find(x=>x.textContent.trim()===${JSON.stringify(tab)})).click()`);
    await waitFor(`document.querySelector('.drawer-tabs button.selected')?.textContent.trim()===${JSON.stringify(tab)}`, `report drawer ${tab} tab`);
  }
  await evaluate(
    `([...document.querySelectorAll('.drawer-actions button')].find(x=>x.textContent.includes('Run report'))).click()`,
  );
  await waitFor(
    "document.querySelectorAll('.generated-table-wrap tbody tr').length===250",
    "catalogue generated report",
  );
  await evaluate("document.querySelector('.close-generated').click()");
  // Exercise the custom report builder beyond page rendering.
  await evaluate(
    `(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Custom reports')).click();return true})()`,
  );
  await waitFor(
    "document.querySelector('h1')?.textContent.includes('Custom report builder')",
    "custom report builder",
  );
  const initialFields = await evaluate(
    "document.querySelectorAll('.selected-fields>div').length",
  );
  await evaluate(
    `(()=>{const b=[...document.querySelectorAll('.source-list button')].find(x=>x.textContent.includes('Mailboxes'));b.click();return true})()`,
  );
  await waitFor(
    "[...document.querySelectorAll('.source-list button')].some(x=>x.classList.contains('selected')&&x.textContent.includes('Mailboxes'))",
    "mailbox semantic source",
  );
  const mailboxFields = await evaluate(
    "document.querySelectorAll('.selected-fields>div').length",
  );
  await evaluate("document.querySelector('.available-fields button')?.click()");
  await waitFor(
    `document.querySelectorAll('.selected-fields>div').length>${mailboxFields}`,
    "field addition",
  );
  const finalFields = await evaluate(
    "document.querySelectorAll('.selected-fields>div').length",
  );
  await evaluate(
    `([...document.querySelectorAll('.builder-tabs button')].find(x=>x.textContent.trim()==='preview')).click()`,
  );
  await waitFor(
    "!!document.querySelector('.result-table')",
    "report result preview",
  );
  await evaluate(
    `([...document.querySelectorAll('.preview-toolbar button')].find(x=>x.textContent.includes('Run full report'))).click()`,
  );
  await waitFor(
    `document.querySelectorAll('.generated-table-wrap tbody tr').length===250&&document.querySelectorAll('.generated-table-wrap thead th').length===${finalFields}`,
    "custom generated report",
  );
  await evaluate("document.querySelector('.close-generated').click()");
  await evaluate(
    `([...document.querySelectorAll('.builder-tabs button')].find(x=>x.textContent.trim()==='schedule')).click()`,
  );
  await waitFor(
    "!!document.querySelector('.schedule-designer')",
    "report schedule designer",
  );
  await evaluate(`([...document.querySelectorAll('.schedule-actions button')].find(x=>x.textContent.includes('Validate delivery'))).click()`);
  await waitFor("document.querySelector('.toast')?.textContent.includes('Schedule validation passed')", "schedule validation outcome");
  await evaluate(`([...document.querySelectorAll('.schedule-actions button')].find(x=>x.textContent.includes('Activate schedule'))).click()`);
  await waitFor("document.querySelector('.schedule-actions small')?.textContent.includes('Active · version')", "persisted report schedule");
  await evaluate(
    `([...document.querySelectorAll('.builder-tabs button')].find(x=>x.textContent.trim()==='security')).click()`,
  );
  await waitFor(
    "!!document.querySelector('.report-security')",
    "report security policy",
  );
  await evaluate(`([...document.querySelectorAll('.schedule-actions button')].find(x=>x.textContent.includes('Simulate personas'))).click()`);
  await waitFor("document.querySelector('.toast')?.textContent.includes('Access simulation')", "report persona simulation");
  await evaluate(`([...document.querySelectorAll('.schedule-actions button')].find(x=>x.textContent.includes('Save security policy'))).click()`);
  await waitFor("document.querySelector('.schedule-actions small')?.textContent.includes('Saved · version')", "persisted report security policy");
  await evaluate(
    `([...document.querySelectorAll('.builder-tabs button')].find(x=>x.textContent.trim()==='design')).click()`,
  );
  await waitFor(
    "!!document.querySelector('.builder-layout')",
    "report design canvas",
  );
  await evaluate(
    "document.querySelector('.studio-heading .primary-button')?.click()",
  );
  await waitFor(
    "document.querySelector('.toast')?.textContent.includes('saved')",
    "custom report save",
  );
  await mkdir("artifacts", { recursive: true });
  const builderShot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(
    "artifacts/smoke-custom-report-builder.png",
    Buffer.from(builderShot.data, "base64"),
  );
  // Exercise dashboard composition.
  await evaluate(
    `(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Dashboard designer')).click();return true})()`,
  );
  await waitFor(
    "document.querySelector('h1')?.textContent.includes('Custom dashboard designer')",
    "dashboard designer",
  );
  const initialWidgets = await evaluate(
    "document.querySelectorAll('.dashboard-canvas>article').length",
  );
  await evaluate(
    "document.querySelector('.dashboard-builder>aside:not(.dashboard-settings)>button')?.click()",
  );
  await waitFor(
    `document.querySelectorAll('.dashboard-canvas>article').length>${initialWidgets}`,
    "dashboard widget addition",
  );
  const finalWidgets = await evaluate(
    "document.querySelectorAll('.dashboard-canvas>article').length",
  );
  await evaluate(
    `([...document.querySelectorAll('.studio-heading button')].find(x=>x.textContent.includes('Save dashboard'))).click()`,
  );
  await waitFor(
    "document.querySelector('.toast')?.textContent.includes('Dashboard saved')",
    "dashboard persistence save",
  );
  const persistedWidgets = await evaluate(
    "JSON.parse(localStorage.getItem('aegis.dashboard.widgets')).length",
  );
  if (persistedWidgets !== finalWidgets)
    throw new Error("Dashboard persistence mismatch.");
  // Exercise global shell controls.
  const themeBefore = await evaluate(
    "document.querySelector('.app-shell').classList.contains('light-theme')",
  );
  await evaluate("document.querySelector('button[aria-label=Theme]').click()");
  const themeAfter = await evaluate(
    "document.querySelector('.app-shell').classList.contains('light-theme')",
  );
  if (themeBefore === themeAfter)
    throw new Error("Theme control did not change the shell theme.");
  await evaluate("document.querySelector('.tenant-switch').click()");
  await waitFor(
    "!!document.querySelector('.tenant-popover')",
    "tenant selector",
  );
  await evaluate("document.querySelector('.tenant-switch').click()");
  await evaluate(
    "document.querySelector('button[aria-label=Notifications]').click()",
  );
  await waitFor(
    "!!document.querySelector('.notification-popover')",
    "notification center",
  );
  await evaluate(
    "document.querySelector('.notification-popover header button').click()",
  );
  await waitFor(
    "document.querySelector('.toast')?.textContent.includes('marked as read')",
    "notification acknowledgement",
  );
  // Exercise a governed workflow dialog end to end.
  await evaluate(
    `(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Security')).click();return true})()`,
  );
  await waitFor(
    "document.querySelector('h1')?.textContent.includes('Security operations center')",
    "security workspace",
  );
  for (const filter of ["critical", "high", "medium", "all"]) {
    await evaluate(`([...document.querySelectorAll('.filter-tabs button')].find(x=>x.textContent.trim()===${JSON.stringify(filter)})).click()`);
    await waitFor(`document.querySelector('.filter-tabs button.selected')?.textContent.trim()===${JSON.stringify(filter)}`, `security ${filter} filter`);
  }
  await evaluate(
    `([...document.querySelectorAll('button')].find(x=>x.textContent.includes('Run investigation'))).click()`,
  );
  await waitFor(
    "!!document.querySelector('.action-dialog')",
    "governed action dialog",
  );
  await evaluate(
    `([...document.querySelectorAll('.action-dialog footer button')].find(x=>x.textContent.includes('Submit for approval'))).click()`,
  );
  await waitFor(
    "document.querySelector('.toast')?.textContent.includes('independent approval')",
    "governed workflow submission",
  );
  await waitFor(
    "!document.querySelector('.runtime-live')?.textContent.includes('0 events')",
    "real-time workflow event delivery",
  );
  // Confirm all administration tabs render distinct operational content.
  await evaluate(
    `(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Administration')).click();return true})()`,
  );
  await waitFor(
    "document.querySelector('h1')?.textContent.includes('Platform administration')",
    "administration workspace",
  );
  for (const tab of [
    "Access control",
    "Audit",
    "Data protection",
    "Infrastructure",
    "Connectors",
  ]) {
    await evaluate(
      `([...document.querySelectorAll('.admin-tabs button')].find(x=>x.textContent.trim()===${JSON.stringify(tab)})).click()`,
    );
    await waitFor(
      `document.querySelector('.admin-tabs button.selected')?.textContent.trim()===${JSON.stringify(tab)}`,
      `administration ${tab} tab`,
    );
    const actionButton = await evaluate("!!document.querySelector('.connector-grid article button')");
    if (actionButton) {
      const previousToast = await evaluate("document.querySelector('.toast')?.textContent||''");
      await evaluate("document.querySelector('.connector-grid article button').click()");
      await waitFor(`(document.querySelector('.toast')?.textContent||'')!==${JSON.stringify(previousToast)}&&!!document.querySelector('.toast')?.textContent`, `administration ${tab} action`);
    }
  }
  // Exercise configuration section navigation.
  await evaluate(
    `(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Configuration')).click();return true})()`,
  );
  await waitFor(
    "document.querySelector('h1')?.textContent.includes('Platform configuration')",
    "platform configuration",
  );
  const configurationSections = await evaluate("[...document.querySelectorAll('.configuration-layout>aside>button')].map(x=>x.textContent.trim().replace(/\\s+/g,' '))");
  for (const section of configurationSections) {
    await evaluate(`(()=>{const b=[...document.querySelectorAll('.configuration-layout>aside>button')].find(x=>x.textContent.trim().replace(/\\s+/g,' ')===${JSON.stringify(section)});b.click();return true})()`);
    await waitFor(`document.querySelector('.configuration-layout>aside>button.selected')?.textContent.trim().replace(/\\s+/g,' ')===${JSON.stringify(section)}`, `configuration ${section} section`);
  }
  await evaluate(`(()=>{const b=[...document.querySelectorAll('.configuration-layout>aside>button')].find(x=>x.textContent.includes('Private AI'));b.click();return true})()`);
  await waitFor("document.querySelector('.configuration-layout main h2')?.textContent.includes('Private AI')", "private AI configuration");
  const originalConfigurationValue = await evaluate("document.querySelector('.configuration-layout main input')?.value");
  await evaluate(`(()=>{const input=document.querySelector('.configuration-layout main input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));[...document.querySelectorAll('.configuration-layout main button')].find(x=>x.textContent.includes('Test configuration')).click();return true})()`);
  await waitFor("!!document.querySelector('.configuration-layout main [aria-invalid=\"true\"]')", "configuration invalid-field rejection");
  await evaluate(`(()=>{const input=document.querySelector('.configuration-layout main input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,${JSON.stringify(originalConfigurationValue)});input.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
  await evaluate(`(()=>{const b=[...document.querySelectorAll('.configuration-layout>aside>button')].find(x=>x.textContent.includes('Identity & access'));b.click();return true})()`);
  await waitFor("document.querySelector('.configuration-layout main h2')?.textContent.includes('Identity & access')", "identity configuration security baseline");
  await evaluate("document.querySelector('.configuration-layout main input[type=checkbox]').click()");
  await evaluate(`(()=>{const b=[...document.querySelectorAll('.configuration-layout>aside>button')].find(x=>x.textContent.includes('Private AI'));b.click();return true})()`);
  await waitFor("document.querySelector('.configuration-layout main h2')?.textContent.includes('Private AI')", "return to private AI configuration");
  await evaluate(`([...document.querySelectorAll('.page-heading button')].find(x=>x.textContent.includes('Save changes'))).click()`);
  await waitFor("document.querySelector('.configuration-layout>aside>button.selected')?.textContent.includes('Identity & access')&&!!document.querySelector('.configuration-layout main input[type=checkbox][aria-invalid=true]')", "cross-section security validation blocks save");
  await evaluate("document.querySelector('.configuration-layout main input[type=checkbox]').click()");
  await evaluate(`([...document.querySelectorAll('.page-heading button')].find(x=>x.textContent.includes('Validate all'))).click()`);
  await waitFor("document.querySelector('.page-heading')?.textContent.includes('ALL DISPLAYED CONTROLS VALIDATED')", "complete configuration validation");
  const configurationVersionBefore = await evaluate("Number((document.querySelector('.configuration-layout main header')?.textContent.match(/CONFIGURATION VERSION (\\d+)/)||[])[1])");
  await evaluate(`([...document.querySelectorAll('.page-heading button')].find(x=>x.textContent.includes('Save changes'))).click()`);
  await waitFor(`document.querySelector('.configuration-layout main header')?.textContent.includes('CONFIGURATION VERSION ${configurationVersionBefore + 1}')`, "versioned configuration save");
  await evaluate("location.reload()");
  await waitFor("document.querySelector('h1')?.textContent.includes('Platform configuration')", "configuration reload");
  await waitFor(`document.querySelector('.configuration-layout main header')?.textContent.includes('CONFIGURATION VERSION ${configurationVersionBefore + 1}')`, "configuration survives reload");
  await evaluate(`(()=>{[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Connection center')).click();return true})()`);
  await waitFor("document.querySelector('h1')?.textContent.includes('Connection center')", "connection center workflow");
  await evaluate("document.querySelector('.connector-grid article button').click()");
  await waitFor("document.querySelector('.toast')?.textContent.includes('validation')", "connector validation button");
  await evaluate(
    `(()=>{const button=[...document.querySelectorAll('nav button')].find(x=>x.textContent.trim().startsWith('Explorer 360'));button.click();return true})()`,
  );
  await waitFor(
    "document.querySelector('h1')?.textContent.includes('Global workforce intelligence')",
    "Explorer screenshot",
  );
  await waitFor(
    "document.querySelector('.explorer-toolbar strong')?.textContent.includes('5,000')&&document.querySelector('.user360-profile')?.textContent.includes('Recommendations')",
    "user 360 enterprise profile",
  );
  await evaluate(
    `(()=>{const input=document.querySelector('.global-search input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'mailbox');input.dispatchEvent(new Event('input',{bubbles:true}));return true})()`,
  );
  await waitFor(
    "document.querySelectorAll('.global-results button').length>0",
    "global report search",
  );
  const searchResults = await evaluate(
    "document.querySelectorAll('.global-results button').length",
  );
  await evaluate(
    `(()=>{const input=document.querySelector('.global-search input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'MFA Compliance Report');input.dispatchEvent(new Event('input',{bubbles:true}));return true})()`,
  );
  await waitFor(
    "document.querySelector('.global-results')?.textContent.includes('MFA Compliance Report')",
    "customer-ready report template search",
  );
  await evaluate(
    `(()=>{const input=document.querySelector('.global-search input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));return true})()`,
  );
  await waitFor(
    "!document.querySelector('.global-results')",
    "global search close",
  );
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await mkdir("artifacts", { recursive: true });
  await writeFile(
    "artifacts/smoke-explorer360.png",
    Buffer.from(shot.data, "base64"),
  );
  console.log(
    JSON.stringify(
      {
        login: login.status,
        verifiedModules: verified.length,
        modules: verified,
        customReportBuilder: {
          initialFields,
          mailboxFields,
          finalFields,
          preview: true,
          schedule: true,
          security: true,
          saved: true,
          screenshot: "artifacts/smoke-custom-report-builder.png",
        },
        reporting: {
          adminCenters,
          generatedRows: true,
          catalogueGeneration: true,
          customGeneration: true,
          excelDownload,
          pdfDownload,
          screenshot: "artifacts/smoke-admin-center-dashboard.png",
        },
        operationalExports,
        suiteActionOutcomes: 5,
        dashboardDesigner: { initialWidgets, finalWidgets, persistedWidgets },
        shell: { theme: true, tenantSelector: true, notifications: true },
        findingLifecycle: { assignment: true, reloadPersistence: true, exceptionValidation: true, remediation: "pending_approval", automationLink: true },
        governedWorkflow: true,
        governedCtas: testedGovernedActions.size,
        persistentActionDrafts,
        administrationTabs: 5,
        configuration: { privateAI: true, validation: true, versionedPersistence: true },
        globalSearchResults: searchResults,
        screenshot: "artifacts/smoke-explorer360.png",
      },
      null,
      2,
    ),
  );
} finally {
  socket.close();
  child.kill();
}

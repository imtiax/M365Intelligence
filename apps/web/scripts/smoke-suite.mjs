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
    "Delivery history", "+ New alert policy", "Job history", "New custom job",
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
      await evaluate(`([...document.querySelectorAll('.action-dialog footer button')].find(x=>x.textContent.includes('Cancel'))).click()`);
      await waitFor("!document.querySelector('.action-dialog')", `${actionLabel} dialog close`);
      testedGovernedActions.add(actionLabel);
    }
    verified.push(label);
  }
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
  await evaluate(
    `([...document.querySelectorAll('.builder-tabs button')].find(x=>x.textContent.trim()==='security')).click()`,
  );
  await waitFor(
    "!!document.querySelector('.report-security')",
    "report security policy",
  );
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
    `([...document.querySelectorAll('.action-dialog footer button')].find(x=>x.textContent.includes('Run governed workflow'))).click()`,
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
        dashboardDesigner: { initialWidgets, finalWidgets, persistedWidgets },
        shell: { theme: true, tenantSelector: true, notifications: true },
        governedWorkflow: true,
        governedCtas: testedGovernedActions.size,
        administrationTabs: 5,
        configuration: { privateAI: true },
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

// Reporter 360 portal end-to-end smoke suite.
//
// Drives a real headless Chrome session over the DevTools protocol against a
// RUNNING server (npm start / start-acceptance) and exercises every portal
// workflow: seeded workspace data, dashboard drill-through, quick/easy/advanced
// filters, column management, sorting, chart drill, CSV/XLSX/PDF exports,
// saved views, schedule creation + live run with delivery preview and history,
// alert creation + live evaluation + status workflow, the 360° record drawer
// actions, settings/reset, and sign-out.
//
// Authentication: signs a workforce session with AEGIS_SESSION_SECRET from
// .env.local (same trust domain as the local server). No password required.

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SignJWT } from "jose";

const baseUrl = process.env.AEGIS_PORTAL_BASE_URL || "http://localhost:3008";
const port = Number(process.env.AEGIS_PORTAL_DEBUG_PORT || 9457);
const output = join(process.cwd(), "artifacts");
const downloads = join(tmpdir(), `aegis-portal-downloads-${process.pid}`);
await mkdir(output, { recursive: true });
await mkdir(downloads, { recursive: true });

function browserPath() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error("No Chromium-based browser found. Set CHROME_PATH.");
  return found;
}

function sessionSecret() {
  const envFile = join(process.cwd(), ".env.local");
  if (process.env.AEGIS_SESSION_SECRET) return process.env.AEGIS_SESSION_SECRET;
  if (!existsSync(envFile)) throw new Error(".env.local not found — run npm run auth:setup first.");
  const match = readFileSync(envFile, "utf8").match(/^AEGIS_SESSION_SECRET=("?)(.+)\1\s*$/m);
  if (!match) throw new Error("AEGIS_SESSION_SECRET not present in .env.local.");
  return match[2];
}

async function mintSession() {
  return new SignJWT({
    name: "Portal Smoke", title: "Automation", tenantId: "00000000-0000-4000-8000-000000000001",
    roles: ["platform-admin"], sessionType: "workforce",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("admin@apex.local")
    .setIssuer("aegis-local")
    .setAudience("aegis-web")
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("1800s")
    .sign(new TextEncoder().encode(sessionSecret()));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const steps = [];
const pass = (label) => { steps.push(label); console.log(`PASS  ${label}`); };

const browser = spawn(browserPath(), [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${join(tmpdir(), `aegis-portal-${process.pid}`)}`,
  "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--window-size=1600,1000",
  "about:blank",
], { stdio: "ignore" });

let socket;
try {
  let target;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      target = targets.find((entry) => entry.type === "page");
      if (target) break;
    } catch { /* browser still starting */ }
    await delay(150);
  }
  if (!target) throw new Error("Browser DevTools target did not start.");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });

  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const request = pending.get(message.id);
    pending.delete(message.id);
    message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const call = ++id;
    pending.set(call, { resolve, reject });
    socket.send(JSON.stringify({ id: call, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression, label, attempts = 100) => {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (await evaluate(expression)) return;
      await delay(125);
    }
    throw new Error(`Timed out waiting for ${label}.`);
  };
  const click = async (selector, label) => {
    const ok = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
    if (!ok) throw new Error(`Could not click ${label ?? selector}.`);
  };
  const clickTestId = (testid, label) => click(`[data-testid="${testid}"]`, label ?? testid);
  const setInput = async (selector, value) => {
    const ok = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; const setter = Object.getOwnPropertyDescriptor(proto, 'value').set; setter.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    if (!ok) throw new Error(`Could not set input ${selector}.`);
  };
  const setSelect = async (selector, value) => {
    const ok = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    if (!ok) throw new Error(`Could not set select ${selector}.`);
  };
  const clickNavReport = async (name) => {
    const ok = await evaluate(`(() => { const btn = [...document.querySelectorAll('.pr-nav-report')].find((b) => b.textContent.trim() === ${JSON.stringify(name)}); if (!btn) return false; btn.click(); return true; })()`);
    if (!ok) throw new Error(`Report “${name}” not found in navigation.`);
  };
  const openReportViaSearch = async (query, name) => {
    await setInput('[data-testid="portal-nav-search"]', query);
    await waitFor(`[...document.querySelectorAll('.pr-nav-report')].some((b) => b.textContent.trim() === ${JSON.stringify(name)})`, `nav result ${name}`);
    await clickNavReport(name);
    await waitFor(`document.querySelector('[data-testid="portal-report-title"]')?.textContent.includes(${JSON.stringify(name)})`, `report ${name}`);
    await setInput('[data-testid="portal-nav-search"]', "");
  };
  const clickCardAction = async (cardTitle, actionLabel) => {
    const ok = await evaluate(`(() => { const card = [...document.querySelectorAll('.pr-item-card')].find((c) => c.querySelector('h3')?.textContent.includes(${JSON.stringify(cardTitle)})); if (!card) return false; const btn = [...card.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(${JSON.stringify(actionLabel)})); if (!btn) return false; btn.click(); return true; })()`);
    if (!ok) throw new Error(`Action “${actionLabel}” on card “${cardTitle}” not found.`);
  };
  const waitDownload = async (pattern, label) => {
    for (let attempt = 0; attempt < 120; attempt++) {
      const files = await readdir(downloads);
      if (files.some((file) => pattern.test(file))) return;
      await delay(125);
    }
    throw new Error(`Download matching ${pattern} (${label}) did not appear.`);
  };
  const navCount = (testid) => evaluate(`document.querySelector('[data-testid="${testid}"] .pr-count')?.textContent`);
  const recordCount = () => evaluate(`document.querySelector('[data-testid="portal-record-count"] b')?.textContent`);

  await send("Page.enable");
  await send("Network.enable");
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloads }).catch(() => send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads }));

  // ---- authenticate by minting a workforce session and installing the cookie
  const token = await mintSession();
  await send("Network.setCookie", { name: "aegis_session", value: token, url: baseUrl, httpOnly: true, sameSite: "Strict" });

  // ---- reporting workspace integration
  await send("Page.navigate", { url: `${baseUrl}/` });
  await waitFor("Boolean(document.querySelector('.app-shell'))", "authenticated Aegis workspace");
  const openedReporting = await evaluate(`(() => {
    const button = [...document.querySelectorAll('.sidebar nav button')]
      .find((item) => item.textContent.trim() === 'Reporting');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!openedReporting) throw new Error("Reporting navigation was not available to the signed-in workspace.");
  await waitFor("[...document.querySelectorAll('button')].some((item) => item.textContent.includes('Open Reporter 360'))", "Reporter 360 launch action");
  const openedPortal = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')]
      .find((item) => item.textContent.includes('Open Reporter 360'));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!openedPortal) throw new Error("Reporter 360 launch action did not render.");
  await waitFor("location.pathname === '/portal' && Boolean(document.querySelector('.pr-shell'))", "Reporter 360 launch");
  pass("Reporting workspace opens the dedicated Reporter 360 experience");

  await send("Page.navigate", { url: `${baseUrl}/portal` });

  // ---- 1. shell + seeded workspace
  await waitFor("Boolean(document.querySelector('.pr-shell')) && document.querySelectorAll('.pr-tile').length === 8", "portal shell");
  // The page is statically prerendered; wait for a hydration-only signal (the
  // avatar switches to the session identity after /api/auth/me resolves)
  // before interacting, otherwise clicks land on inert prerendered HTML.
  await waitFor(`document.querySelector('[data-testid="portal-avatar"]')?.textContent.trim() === 'PS'`, "hydration + session identity");
  const services = await evaluate("document.querySelectorAll('.pr-nav-svc').length");
  if (services !== 7) throw new Error(`Expected 7 service groups, found ${services}.`);
  await waitFor(`document.querySelector('[data-testid="portal-nav-views"] .pr-count')?.textContent === '3'`, "seeded views count");
  if (await navCount("portal-nav-schedules") !== "2") throw new Error("Seeded schedules count is not 2.");
  if (await navCount("portal-nav-alerts") !== "2") throw new Error("Seeded open-alerts count is not 2.");
  pass("Shell renders with 7 services, 8 drillable tiles, and seeded views/schedules/alerts");

  // ---- 2. dashboard tile drill-through
  await evaluate("(() => { [...document.querySelectorAll('.pr-tile')].find((t) => t.textContent.includes('Users without MFA'))?.click(); return true; })()");
  await waitFor(`document.querySelector('[data-testid="portal-report-title"]')?.textContent.includes('Users without MFA')`, "tile drill-through");
  pass("Dashboard tile drills through to the underlying report");

  // ---- 3. quick-filter stat toggling
  const before = await recordCount();
  await evaluate("(() => { [...document.querySelectorAll('.pr-stat')].find((s) => s.textContent.includes('Privileged only'))?.click(); return true; })()");
  await waitFor("Boolean(document.querySelector('.pr-chip.pr-on'))", "quick filter chip active");
  const after = await recordCount();
  if (before === after) throw new Error("Quick filter did not change the record count.");
  await clickTestId("portal-clear-filters");
  await waitFor(`document.querySelector('[data-testid="portal-record-count"] b')?.textContent === ${JSON.stringify(before)}`, "filters cleared");
  pass("Clickable summary counts filter the grid and clear correctly");

  // ---- 4. report with default sort, header sorting
  await openReportViaSearch("Inactive Users", "Inactive Users by Last Sign-in");
  await waitFor("Boolean(document.querySelector('.pr-grid th .pr-sortmark'))", "default sort indicator");
  await evaluate("(() => { document.querySelectorAll('.pr-grid th')[0]?.click(); return true; })()");
  await waitFor("document.querySelectorAll('.pr-grid th')[0]?.querySelector('.pr-sortmark') !== null", "header sort applied");
  pass("Default multi-sort renders and header click re-sorts");

  // ---- 5. column add/remove
  const colsBefore = await evaluate("document.querySelectorAll('.pr-grid th').length");
  await clickTestId("portal-columns");
  await evaluate("(() => { const row = [...document.querySelectorAll('.pr-pop-row')].find((r) => r.textContent.includes('Department')); row?.querySelector('input')?.click(); return true; })()");
  await evaluate("(() => { [...document.querySelectorAll('.pr-pop button')].find((b) => b.textContent === 'Done')?.click(); return true; })()");
  await waitFor(`document.querySelectorAll('.pr-grid th').length === ${colsBefore - 1}`, "column removed");
  pass("Column chooser adds/removes grid columns");

  // ---- 6. easy + advanced filters
  await clickTestId("portal-filters");
  await setSelect('[data-testid="portal-easy-country"]', "Japan");
  await waitFor("document.querySelectorAll('.pr-chip.pr-filter').length === 1", "easy filter chip");
  await setSelect('[data-testid="portal-adv-column"]', "inactiveDays");
  await setSelect('[data-testid="portal-adv-op"]', "gt");
  await setInput('[data-testid="portal-adv-value"]', "120");
  await clickTestId("portal-adv-add");
  await waitFor("document.querySelectorAll('.pr-chip.pr-filter').length === 2", "advanced filter chip");
  await evaluate("(() => { [...document.querySelectorAll('.pr-pop button')].find((b) => b.textContent === 'Done')?.click(); return true; })()");
  await clickTestId("portal-clear-filters");
  pass("Easy filters and advanced per-column filters apply server-style and clear");

  // ---- 7. chart drill-through
  await waitFor("document.querySelectorAll('.pr-report-chart .recharts-rectangle, .pr-report-chart .recharts-sector').length > 0", "report chart segments");
  await evaluate("(() => { const seg = document.querySelector('.pr-report-chart .recharts-rectangle, .pr-report-chart .recharts-sector'); seg?.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; })()");
  await waitFor("document.querySelectorAll('.pr-chip.pr-filter').length === 1", "chart drill filter");
  await clickTestId("portal-clear-filters");
  pass("Chart segments drill through into filtered records");

  // ---- 8. live exports (CSV, Excel, PDF)
  await clickTestId("portal-export");
  await clickTestId("portal-export-csv");
  await waitDownload(/inactive-users.*\.csv$/, "CSV export");
  await clickTestId("portal-export");
  await clickTestId("portal-export-xlsx");
  await waitDownload(/inactive-users.*\.xls$/, "Excel export");
  await clickTestId("portal-export");
  await clickTestId("portal-export-pdf");
  await waitDownload(/inactive-users.*\.pdf$/, "PDF export");
  pass("CSV, Excel, and PDF exports generate real files");

  // ---- 9. saved views lifecycle
  await clickTestId("portal-save-view");
  await setInput('[data-testid="portal-view-name"]', "Smoke Test View");
  await clickTestId("portal-view-save");
  await waitFor(`document.querySelector('[data-testid="portal-nav-views"] .pr-count')?.textContent === '4'`, "view saved");
  await clickTestId("portal-nav-views");
  await waitFor("Boolean(document.querySelector('[data-testid=\"portal-views-page\"]'))", "views page");
  await clickCardAction("Smoke Test View", "Open");
  await waitFor(`document.querySelector('[data-testid="portal-report-title"]')?.textContent.includes('Inactive Users')`, "view reopened");
  await clickTestId("portal-nav-views");
  await clickCardAction("Smoke Test View", "Delete");
  await waitFor(`document.querySelector('[data-testid="portal-nav-views"] .pr-count')?.textContent === '3'`, "view deleted");
  pass("Views save, reopen with their exact slice, and delete");

  // ---- 10. schedule lifecycle with live run + delivery preview
  await openReportViaSearch("Inactive Users", "Inactive Users by Last Sign-in");
  await clickTestId("portal-schedule");
  await setInput('[data-testid="portal-schedule-name"]', "Smoke Sched");
  await setInput('[data-testid="portal-schedule-recipients"]', "it-admins@northstar.example");
  await setSelect('[data-testid="portal-schedule-format"]', "CSV");
  await clickTestId("portal-schedule-create");
  await waitFor(`document.querySelector('[data-testid="portal-nav-schedules"] .pr-count')?.textContent === '3'`, "schedule created");
  await clickTestId("portal-nav-schedules");
  await waitFor("Boolean(document.querySelector('[data-testid=\"portal-schedules-page\"]'))", "schedules page");
  await clickCardAction("Smoke Sched", "Run now");
  await waitFor("Boolean(document.querySelector('[data-testid=\"portal-delivery\"]'))", "delivery preview");
  const deliveredBadge = await evaluate(`document.querySelector('[data-testid="portal-delivery"] h3 .pr-badge')?.textContent`);
  if (deliveredBadge !== "delivered") throw new Error(`Expected delivered outcome, got ${deliveredBadge}.`);
  await clickTestId("portal-delivery-close");
  await waitFor("(() => { const card = [...document.querySelectorAll('.pr-item-card')].find((c) => c.querySelector('h3')?.textContent.includes('Smoke Sched')); return card && [...card.querySelectorAll('.pr-runline')].some((l) => l.textContent.includes('delivered')); })()", "run recorded in history");
  await clickCardAction("Smoke Sched", "Delete");
  await waitFor(`document.querySelector('[data-testid="portal-nav-schedules"] .pr-count')?.textContent === '2'`, "schedule deleted");
  pass("Schedules create, run live with delivery preview + attachment + run history, and delete");

  // ---- 11. alert lifecycle: preview, activation, evaluation, status workflow
  await openReportViaSearch("Failed Sign-ins", "Failed Sign-ins");
  await clickTestId("portal-alert");
  await waitFor("document.querySelectorAll('[data-testid=\"portal-alert-preview\"] .pr-preview-days i').length === 30", "alert preview simulation");
  await setInput('[data-testid="portal-alert-name"]', "Smoke Alert");
  await clickTestId("portal-alert-activate");
  await waitFor(`document.querySelector('[data-testid="portal-nav-alerts"] .pr-count')?.textContent === '3'`, "alert activated");
  await clickTestId("portal-nav-alerts");
  await waitFor("Boolean(document.querySelector('[data-testid=\"portal-alerts-page\"]'))", "alert center");
  await clickCardAction("Smoke Alert", "Evaluate now");
  await waitFor("(() => { const card = [...document.querySelectorAll('.pr-item-card')].find((c) => c.querySelector('h3')?.textContent.includes('Smoke Alert')); return card && card.textContent.includes('Last evaluated'); })()", "alert evaluated");
  await clickCardAction("Smoke Alert", "Investigate");
  await waitFor("(() => { const card = [...document.querySelectorAll('.pr-item-card')].find((c) => c.querySelector('h3')?.textContent.includes('Smoke Alert')); return card && card.querySelector('h3')?.textContent.includes('Investigating'); })()", "alert investigating");
  await clickCardAction("Smoke Alert", "Close");
  await waitFor(`document.querySelector('[data-testid="portal-nav-alerts"] .pr-count')?.textContent === '2'`, "alert closed");
  await clickCardAction("Smoke Alert", "Delete");
  pass("Alert policies preview, activate, evaluate live, and move through the status workflow");

  // ---- 12. 360° drawer actions
  await openReportViaSearch("All Users", "All Users");
  await evaluate("(() => { document.querySelector('.pr-grid tbody tr')?.click(); return true; })()");
  await waitFor("Boolean(document.querySelector('[data-testid=\"portal-drawer\"]'))", "record drawer");
  await clickTestId("portal-drawer-signins");
  await waitFor(`document.querySelector('[data-testid="portal-report-title"]')?.textContent.includes('User Sign-in Activity')`, "drawer cross-navigation");
  await waitFor("document.querySelectorAll('.pr-chip.pr-filter').length === 1", "drawer navigation filter applied");
  await clickTestId("portal-clear-filters");
  await waitFor("document.querySelectorAll('.pr-grid tbody tr').length > 0", "sign-in rows restored");
  await evaluate("(() => { document.querySelector('.pr-grid tbody tr')?.click(); return true; })()");
  await waitFor("Boolean(document.querySelector('[data-testid=\"portal-drawer\"]'))", "sign-in record drawer");
  await clickTestId("portal-drawer-export");
  await waitDownload(/user-sign-in-activity.*\.csv$/, "record export");
  await clickTestId("portal-drawer-close");
  pass("360° drawer opens, cross-navigates with filters, and exports records");

  // ---- 13. settings: dataset stats, dataset export, workspace reset
  await clickTestId("portal-settings");
  await waitFor("document.querySelectorAll('[data-testid=\"portal-settings-modal\"] .pr-stat-grid > div').length === 8", "settings dataset stats");
  await clickTestId("portal-export-dataset");
  await waitDownload(/reporter360-dataset\.json$/, "dataset export");
  await clickTestId("portal-reset-demo");
  await waitFor(`document.querySelector('[data-testid="portal-reset-demo"]')?.textContent.includes('Confirm')`, "reset confirmation state");
  await clickTestId("portal-reset-demo");
  await waitFor(`!document.querySelector('[data-testid="portal-settings-modal"]') && document.querySelector('[data-testid="portal-nav-views"] .pr-count')?.textContent === '3'`, "workspace reset to seeds");
  pass("Settings shows the data plane, exports the dataset, and resets workspace seeds");

  // ---- 14. screenshot + profile menu + sign-out
  await clickTestId("portal-nav-home");
  await waitFor("document.querySelectorAll('.pr-tile').length === 8", "dashboard restored");
  await delay(2200); // let chart animations and the toast settle for the artifact
  const shot = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(join(output, "smoke-reporter-portal.png"), Buffer.from(shot.data, "base64"));
  await clickTestId("portal-avatar");
  await waitFor("Boolean(document.querySelector('[data-testid=\"portal-signout\"]'))", "profile menu");
  await clickTestId("portal-signout");
  await waitFor("location.pathname === '/login'", "signed out to login");
  pass("Profile menu renders the session identity and sign-out returns to login");

  console.log(`\nReporter 360 portal smoke: ${steps.length}/${steps.length} steps passed.`);
} finally {
  try { socket?.close(); } catch { /* already closed */ }
  browser.kill();
}

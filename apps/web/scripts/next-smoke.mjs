import { spawn } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.AEGIS_NEXT_BASE_URL || "http://localhost:3008";
const port = Number(process.env.AEGIS_NEXT_DEBUG_PORT || 9451);
const output = join(process.cwd(), "artifacts");
const downloads = join(tmpdir(), `aegis-next-downloads-${process.pid}`);
await mkdir(output, { recursive: true });
await mkdir(downloads, { recursive: true });

const browser = spawn(chrome, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${join(tmpdir(), `aegis-next-${process.pid}`)}`,
  "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", `${baseUrl}/next`,
], { stdio: "ignore" });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;

try {
  let target;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      target = targets.find((entry) => entry.type === "page");
      if (target) break;
    } catch {}
    await delay(150);
  }
  if (!target) throw new Error("Chrome DevTools target did not start.");
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
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression, label) => {
    for (let attempt = 0; attempt < 80; attempt++) {
      if (await evaluate(expression)) return;
      await delay(125);
    }
    throw new Error(`Timed out waiting for ${label}.`);
  };
  await send("Page.enable");
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
  await waitFor("document.querySelector('.next-shell') && document.querySelector('h1')?.textContent.includes('Make the next right decision')", "Aegis Next mission control");
  await delay(1200);
  const initial = await evaluate(`(() => ({ nav: document.querySelectorAll('.next-sidebar nav button').length, cards: document.querySelectorAll('.next-card').length, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }))()`);
  if (initial.nav !== 7 || initial.cards < 3 || initial.overflow) throw new Error(`Mission control audit failed: ${JSON.stringify(initial)}`);
  await evaluate("(() => { [...document.querySelectorAll('.next-sidebar nav button')].find((button) => button.textContent.includes('Evidence Studio'))?.click(); return true; })()");
  await waitFor("document.querySelector('h1')?.textContent.includes('Build a decision-grade view')", "Evidence Studio");
  await evaluate("(() => { document.querySelector('.next-table-wrap tbody tr')?.click(); return true; })()");
  await waitFor("Boolean(document.querySelector('.next-evidence-drawer h2'))", "evidence drawer");
  await evaluate("(() => { document.querySelector('.next-evidence-drawer > button')?.click(); return true; })()");
  await waitFor("!document.querySelector('.next-evidence-drawer')", "closed evidence drawer");
  await evaluate("(() => { [...document.querySelectorAll('.next-page-actions button')].find((button) => button.textContent.includes('Export evidence'))?.click(); return true; })()");
  for (let attempt = 0; attempt < 40; attempt++) {
    if ((await readdir(downloads)).some((file) => file === "aegis-evidence-receipt.json")) break;
    await delay(125);
  }
  const downloaded = (await readdir(downloads)).includes("aegis-evidence-receipt.json");
  if (!downloaded) throw new Error("Evidence receipt was not downloaded.");
  await evaluate("(() => { [...document.querySelectorAll('.next-sidebar nav button')].find((button) => button.textContent.includes('Mission Control'))?.click(); return true; })()");
  await waitFor("document.querySelector('h1')?.textContent.includes('Make the next right decision')", "Mission Control return");
  await evaluate("(() => { [...document.querySelectorAll('.next-page-actions button')].find((button) => button.textContent.includes('Review 3 decisions'))?.click(); return true; })()");
  await waitFor("Boolean(document.querySelector('.next-modal'))", "approval dialog");
  await evaluate("(() => { document.querySelector('.next-check input')?.click(); return true; })()");
  await evaluate("(() => { document.querySelector('.next-modal footer .primary')?.click(); return true; })()");
  await waitFor("document.querySelector('.next-toast')?.textContent.includes('submitted for independent approval')", "approval submission toast");
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  await writeFile(join(output, "smoke-aegis-next.png"), Buffer.from(screenshot.data, "base64"));
  console.log(JSON.stringify({ route: "/next", navigation: initial.nav, evidenceDrawer: true, evidenceExport: downloaded, approval: true, screenshot: "artifacts/smoke-aegis-next.png" }, null, 2));
} finally {
  socket?.close();
  browser.kill();
}

import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const password = process.env.AEGIS_SMOKE_PASSWORD;
if (!password) throw new Error("AEGIS_SMOKE_PASSWORD is required.");
const expected = {
  "admin@apex.local": 27,
  "security@apex.local": 12,
  "m365admin@apex.local": 11,
  "reports@apex.local": 10,
  "auditor@apex.local": 9,
  "viewer@apex.local": 6,
};
const port = 9335;
const chrome = spawn(process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${join(tmpdir(), `aegis-role-ui-${process.pid}`)}`,
  "--headless=new", "--disable-gpu", "--no-first-run", "--window-size=1500,1000", "http://localhost:3008/login",
], { stdio: "ignore" });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function findPage() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { const page = (await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())).find((item) => item.type === "page"); if (page) return page; } catch {}
    await delay(250);
  }
  throw new Error("Chrome DevTools target did not start.");
}
const page = await findPage();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const item = pending.get(message.id); pending.delete(message.id); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); } });
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
async function evaluate(expression) { const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
async function waitFor(expression, label) { for (let attempt = 0; attempt < 60; attempt++) { if (await evaluate(expression)) return; await delay(150); } throw new Error(`Timed out waiting for ${label}.`); }

const results = [];
try {
  await send("Runtime.enable");
  await send("Network.enable");
  for (const [username, expectedCount] of Object.entries(expected)) {
    await send("Network.clearBrowserCookies");
    await send("Page.navigate", { url: "http://localhost:3008/login" });
    await waitFor("location.pathname==='/login'&&!!document.querySelector('form')", `${username} login page`);
    const status = await evaluate(`fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:${JSON.stringify(username)},password:${JSON.stringify(password)}})}).then(r=>r.status)`);
    if (status !== 200) throw new Error(`${username} login returned ${status}.`);
    await evaluate("location.assign('/')");
    await waitFor("location.pathname==='/'&&document.querySelector('.profile')?.textContent.trim()!=='--'", `${username} workspace`);
    await waitFor("document.querySelectorAll('nav button').length>1", `${username} authorized navigation`);
    await delay(250);
    const modules = await evaluate("[...document.querySelectorAll('nav button')].map(x=>x.textContent.trim().replace(/\\d+$/,'').trim())");
    if (modules.length !== expectedCount) throw new Error(`${username} expected ${expectedCount} modules, received ${modules.length}: ${modules.join(', ')}`);
    if (username !== "admin@apex.local" && modules.includes("Administration")) throw new Error(`${username} can see Administration.`);
    if (username !== "admin@apex.local" && (modules.includes("Super Admin") || modules.includes("Customer portal"))) throw new Error(`${username} can see a commercial administrator workspace.`);
    if (username === "viewer@apex.local") {
      await evaluate("location.hash='#administration'");
      await delay(400);
      const heading = await evaluate("document.querySelector('h1')?.textContent||''");
      if (heading.includes("Platform administration")) throw new Error("Read-only deep-link authorization failed.");
    }
    results.push({ username, visibleModules: modules.length, modules });
  }
  console.log(JSON.stringify({ personas: results.length, navigationMatrix: results }, null, 2));
} finally {
  socket.close();
  chrome.kill();
}

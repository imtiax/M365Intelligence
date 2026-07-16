import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9444;
const output = join(process.cwd(), "artifacts");
const child = spawn(chrome, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${join(tmpdir(), `aegis-landing-${process.pid}`)}`,
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "about:blank",
], { stdio: "ignore" });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getTarget() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      const target = targets.find((entry) => entry.type === "page");
      if (target) return target;
    } catch {}
    await delay(200);
  }
  throw new Error("Chrome DevTools target did not start.");
}

const target = await getTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
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
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function capture(name, width, height, fullPage = false) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await send("Page.navigate", { url: "http://localhost:3008/landing" });
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await evaluate("document.readyState==='complete'&&document.querySelectorAll('.tour-image img').length===2")) break;
    await delay(150);
  }
  await evaluate("(async()=>{for(const image of document.images){image.scrollIntoView({block:'center'});await new Promise(resolve=>setTimeout(resolve,350))}})()");
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await evaluate("[...document.images].every(i => i.complete && i.naturalWidth > 0)")) break;
    await delay(150);
  }
  await evaluate("scrollTo(0, 0)");
  await delay(300);
  const audit = await evaluate(`(() => ({
    heading: document.querySelector('h1')?.textContent?.replace(/\\s+/g,' ').trim(),
    capabilities: document.querySelectorAll('.capability-grid article').length,
    industries: document.querySelectorAll('.industry-grid article').length,
    localFirst: document.querySelector('#local-first-title')?.textContent,
    deploymentCta: [...document.querySelectorAll('a')].some(a => a.textContent.includes('Request deployment access')),
    imagesLoaded: [...document.images].every(i => i.complete && i.naturalWidth > 0),
    imageStates: [...document.images].map(i => ({src:i.currentSrc || i.src, complete:i.complete, width:i.naturalWidth})),
    signIn: document.querySelector('a[href="/login"]')?.href,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  }))()`);
  if (!audit.heading?.includes("governed action") || audit.capabilities !== 8 || audit.industries !== 3 || !audit.localFirst?.includes("stays in your environment") || !audit.deploymentCta || !audit.imagesLoaded || !audit.signIn || audit.overflow) {
    throw new Error(`${name} landing audit failed: ${JSON.stringify(audit)}`);
  }
  let clip;
  if (fullPage) {
    const metrics = await send("Page.getLayoutMetrics");
    clip = { x: 0, y: 0, width, height: metrics.cssContentSize.height, scale: 1 };
  }
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: fullPage, ...(clip ? { clip } : {}) });
  await writeFile(join(output, `smoke-landing-${name}.png`), Buffer.from(screenshot.data, "base64"));
  return audit;
}

try {
  await mkdir(output, { recursive: true });
  await send("Runtime.enable");
  await send("Page.enable");
  const desktop = await capture("desktop", 1600, 1100);
  const mobile = await capture("mobile", 390, 844);
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} finally {
  socket.close();
  child.kill();
}

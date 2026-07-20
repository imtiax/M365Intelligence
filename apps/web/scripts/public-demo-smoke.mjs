import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.AEGIS_PUBLIC_DEMO_BASE_URL || "http://localhost:3008";
const chrome =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = Number(process.env.AEGIS_PUBLIC_DEMO_DEBUG_PORT || 9446);
const artifactDirectory = join(process.cwd(), "artifacts");
const profile = join(tmpdir(), `aegis-public-demo-${process.pid}-${randomUUID()}`);
const personas = ["executive", "security", "operations", "reporting"];
const modes = {
  executive: "guided",
  security: "guided",
  operations: "free",
  reporting: "free",
};
const requiredModules = [
  "command-center",
  "explorer-360",
  "security",
  "reporting",
  "licenses",
  "compliance",
  "auditing",
  "management",
];

const browser = spawn(
  chrome,
  [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1600,1100",
    `${baseUrl}/landing/demo`,
  ],
  { stdio: "ignore" },
);

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function findPage() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(
        (response) => response.json(),
      );
      const target = targets.find((item) => item.type === "page");
      if (target) return target;
    } catch {}
    await delay(250);
  }
  throw new Error("Chrome DevTools target did not start.");
}

const target = await findPage();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id || !pending.has(message.id)) return;
  const request = pending.get(message.id);
  pending.delete(message.id);
  message.error
    ? request.reject(new Error(message.error.message))
    : request.resolve(message.result);
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text ||
        "Browser evaluation failed.",
    );
  }
  return result.result.value;
}

async function waitFor(expression, label, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (await evaluate(expression)) return;
    await delay(200);
  }
  const state = await evaluate(
    "({url:location.href,heading:document.querySelector('h1')?.textContent||'',text:document.body?.innerText?.slice(0,500)||''})",
  );
  throw new Error(`Timed out waiting for ${label}: ${JSON.stringify(state)}`);
}

async function request(path, options = {}) {
  return evaluate(`fetch(${JSON.stringify(path)},${JSON.stringify(options)}).then(async response=>{
    const text=await response.text();
    let body;try{body=JSON.parse(text)}catch{body=text}
    return {status:response.status,headers:Object.fromEntries(response.headers.entries()),body};
  })`);
}

async function capture(name) {
  await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
  await delay(300);
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(
    join(artifactDirectory, `smoke-public-demo-${name}.png`),
    Buffer.from(screenshot.data, "base64"),
  );
}

async function setViewport(width, height, mobile = false) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  await delay(180);
}

function expiryMilliseconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

function moduleIds(bootstrap) {
  if (Array.isArray(bootstrap?.modules)) {
    return bootstrap.modules
      .map((item) => (typeof item === "string" ? item : item?.id))
      .filter(Boolean);
  }
  if (bootstrap?.modules && typeof bootstrap.modules === "object") {
    return Object.keys(bootstrap.modules);
  }
  return [];
}

function activeScenario(value) {
  const candidate =
    value?.activeScenario ?? value?.scenario ?? value?.session?.activeScenario;
  return typeof candidate === "string" ? candidate : candidate?.id;
}

function assertNoSecretShape(value) {
  const forbidden = /^(accessToken|refreshToken|clientSecret|clientAssertion|certificatePrivateKey|graphToken)$/i;
  const visit = (item, path = "response") => {
    if (!item || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item)) {
      if (forbidden.test(key)) {
        throw new Error(`Public bootstrap disclosed forbidden key ${path}.${key}.`);
      }
      visit(child, `${path}.${key}`);
    }
  };
  visit(value);
}

function cookieForSet(cookie) {
  return {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    expires: cookie.expires,
  };
}

const results = [];
let isolatedSession = null;
let guidedControlsVerified = false;
let mobileWorkspaceLayout = null;
const moduleSweep = [];

try {
  await mkdir(artifactDirectory, { recursive: true });
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");

  await waitFor(
    "location.pathname==='/landing/demo'&&document.readyState==='complete'&&document.body.innerText.length>200",
    "public demo launcher",
  );
  const launcher = await evaluate(`(()=>{
    const text=document.body.innerText.replace(/\\s+/g,' ').trim();
    const controls=[...document.querySelectorAll('button,a')].map(item=>item.textContent.replace(/\\s+/g,' ').trim()).filter(Boolean);
    return {
      heading:document.querySelector('h1')?.textContent?.replace(/\\s+/g,' ').trim()||'',
      personas:${JSON.stringify(personas)}.map(id=>({id,found:text.toLowerCase().includes(id)||controls.some(value=>value.toLowerCase().includes(id))})),
      synthetic:/synthetic/i.test(text),
      customerBoundary:/no customer|customer data|not connected|no microsoft 365/i.test(text),
      controls
    };
  })()`);
  if (
    !launcher.heading ||
    launcher.personas.some((item) => !item.found) ||
    !launcher.synthetic ||
    !launcher.customerBoundary
  ) {
    throw new Error(`Public launcher disclosure audit failed: ${JSON.stringify(launcher)}`);
  }
  const launcherResponse = await request("/landing/demo", {
    cache: "no-store",
    redirect: "manual",
  });
  if (launcherResponse.status !== 200) {
    throw new Error(`Public launcher returned ${launcherResponse.status}.`);
  }
  const cacheControl = launcherResponse.headers["cache-control"] || "";
  const robots = launcherResponse.headers["x-robots-tag"] || "";
  if (!cacheControl.includes("no-store") || !robots.toLowerCase().includes("noindex")) {
    throw new Error(
      `Public launcher cache/index safeguards missing: ${JSON.stringify({ cacheControl, robots })}`,
    );
  }
  await capture("launcher");
  await setViewport(390, 844, true);
  const mobileLauncher = await evaluate(`({
    overflow:document.documentElement.scrollWidth>window.innerWidth+1,
    personas:document.querySelectorAll('input[name=persona]').length,
    startVisible:!![...document.querySelectorAll('button')].find(button=>/start guided tour|enter demo workspace/i.test(button.textContent))
  })`);
  if (mobileLauncher.overflow || mobileLauncher.personas !== 4 || !mobileLauncher.startVisible) {
    throw new Error(`Mobile public launcher failed: ${JSON.stringify(mobileLauncher)}`);
  }
  await capture("launcher-mobile");
  await setViewport(1600, 1100, false);

  for (const persona of personas) {
    await send("Network.clearBrowserCookies");
    const start = await request("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona, mode: modes[persona] }),
    });
    if (
      start.status !== 200 ||
      start.body?.ok !== true ||
      start.body?.redirectTo !== "/demo/workspace#command-center" ||
      !(start.body?.expiresIn > 0)
    ) {
      throw new Error(`${persona} demo start failed: ${JSON.stringify(start)}`);
    }

    const identity = await request("/api/auth/me");
    if (
      identity.status !== 200 ||
      identity.body?.sessionType !== "public-demo" ||
      identity.body?.demoPersona !== persona ||
      identity.body?.demoMode !== modes[persona] ||
      typeof identity.body?.demoSessionId !== "string" ||
      identity.body.demoSessionId.length < 16 ||
      JSON.stringify(identity.body?.roles) !== JSON.stringify(["read-only"])
    ) {
      throw new Error(`${persona} identity claims failed: ${JSON.stringify(identity)}`);
    }
    const expiry = expiryMilliseconds(identity.body.expiresAt);
    if (
      !Number.isFinite(expiry) ||
      expiry <= Date.now() ||
      expiry > Date.now() + 31 * 60 * 1000
    ) {
      throw new Error(`${persona} has an invalid public-demo expiry.`);
    }

    const bootstrap = await request("/api/public-demo/bootstrap");
    if (bootstrap.status !== 200) {
      throw new Error(`${persona} bootstrap returned ${bootstrap.status}.`);
    }
    assertNoSecretShape(bootstrap.body);
    const ids = moduleIds(bootstrap.body);
    const missing = requiredModules.filter((moduleId) => !ids.includes(moduleId));
    if (missing.length) {
      throw new Error(`${persona} bootstrap is missing modules: ${missing.join(", ")}.`);
    }
    if (!/\.example\b/i.test(JSON.stringify(bootstrap.body?.tenant || {}))) {
      throw new Error(`${persona} bootstrap does not use an example-domain tenant.`);
    }

    const commandCenter = await request(
      "/api/public-demo/module/command-center",
    );
    const management = await request("/api/public-demo/module/management");
    if (commandCenter.status !== 200 || management.status !== 200) {
      throw new Error(
        `${persona} module API failed: ${commandCenter.status}/${management.status}.`,
      );
    }

    await evaluate(`location.assign(${JSON.stringify(baseUrl + start.body.redirectTo)})`);
    await waitFor(
      "location.pathname==='/demo/workspace'&&document.body.innerText.length>500",
      `${persona} public workspace`,
    );
    await waitFor(
      "/synthetic|public demo|demo session/i.test(document.body.innerText)",
      `${persona} persistent demo disclosure`,
    );
    const navigation = await evaluate(`(()=>{
      const names=[...document.querySelectorAll('nav button,nav a,[data-demo-module]')]
        .map(item=>(item.textContent||item.getAttribute('data-demo-module')||'').replace(/\\s+/g,' ').trim())
        .filter(Boolean);
      return [...new Set(names)];
    })()`);
    if (navigation.length < 6) {
      throw new Error(`${persona} has insufficient demo navigation: ${navigation.join(", ")}.`);
    }

    if (persona === "executive") {
      await waitFor(
        "!!document.querySelector('#guided-demo-drawer')",
        "executive guided drawer",
      );
      await evaluate(`([...document.querySelectorAll('#guided-demo-drawer button')].find(button=>button.textContent.trim().startsWith('Next'))).click()`);
      await waitFor(
        "location.hash==='#explorer-360'&&document.querySelector('h1')?.textContent.includes('Global workforce intelligence')",
        "guided next navigation",
      );
      await evaluate(`([...document.querySelectorAll('#guided-demo-drawer button')].find(button=>button.textContent.trim()==='Back')).click()`);
      await waitFor(
        "location.hash==='#command-center'&&document.querySelector('h1')?.textContent.includes('posture at a glance')",
        "guided back navigation",
      );
      await evaluate(`([...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Change perspective')).click()`);
      await waitFor(
        "document.querySelector('[role=dialog]')?.textContent.includes('Choose another route')&&document.querySelectorAll('[role=dialog] button[aria-pressed]').length===4",
        "persona dialog",
      );
      await evaluate("document.querySelector('button[aria-label=\"Close perspective selector\"]').click()");
      await setViewport(390, 844, true);
      const mobileWorkspace = await evaluate(`({
        overflow:document.documentElement.scrollWidth>window.innerWidth+1,
        banner:!!document.querySelector('[aria-label="Guided demo session"]'),
        drawer:!!document.querySelector('#guided-demo-drawer'),
        viewport:window.innerWidth,
        appWidth:document.querySelector('.app-shell')?.getBoundingClientRect().width||0,
        mainWidth:document.querySelector('.app-shell > main')?.getBoundingClientRect().width||0,
        contentRight:document.querySelector('.presentation-content')?.getBoundingClientRect().right||0,
        topbarWidth:document.querySelector('.topbar')?.getBoundingClientRect().width||0,
        topbarScrollWidth:document.querySelector('.topbar')?.scrollWidth||0,
        topbarChildren:[...document.querySelectorAll('.topbar > *')].map(item=>({
          className:item.className,
          width:item.getBoundingClientRect().width,
          display:getComputedStyle(item).display,
          minWidth:getComputedStyle(item).minWidth,
          flexShrink:getComputedStyle(item).flexShrink
        }))
      })`);
      if (
        mobileWorkspace.overflow ||
        !mobileWorkspace.banner ||
        !mobileWorkspace.drawer ||
        mobileWorkspace.appWidth < mobileWorkspace.viewport - 1 ||
        mobileWorkspace.mainWidth < mobileWorkspace.viewport - 1 ||
        mobileWorkspace.topbarScrollWidth > mobileWorkspace.topbarWidth + 1
      ) {
        throw new Error(`Mobile public workspace failed: ${JSON.stringify(mobileWorkspace)}`);
      }
      mobileWorkspaceLayout = {
        viewport: mobileWorkspace.viewport,
        appWidth: mobileWorkspace.appWidth,
        mainWidth: mobileWorkspace.mainWidth,
        topbarWidth: mobileWorkspace.topbarWidth,
        topbarScrollWidth: mobileWorkspace.topbarScrollWidth,
      };
      await capture("workspace-mobile");
      await setViewport(1600, 1100, false);
      guidedControlsVerified = true;
    }

    if (persona === "security") {
      const scenario = await request("/api/public-demo/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: "identity-risk" }),
      });
      if (![200, 201].includes(scenario.status)) {
        throw new Error(`Scenario activation failed: ${JSON.stringify(scenario)}`);
      }
      const scenarioBootstrap = await request("/api/public-demo/bootstrap");
      if (
        activeScenario(scenarioBootstrap.body) &&
        activeScenario(scenarioBootstrap.body) !== "identity-risk"
      ) {
        throw new Error("Scenario state was not scoped to the security session.");
      }
      const allCookies = await send("Network.getAllCookies");
      const sessionCookie = allCookies.cookies.find(
        (cookie) => cookie.name === "aegis_session",
      );
      if (!sessionCookie) throw new Error("Public demo session cookie is missing.");
      isolatedSession = {
        cookie: cookieForSet(sessionCookie),
        id: identity.body.demoSessionId,
      };
    }

    if (persona === "reporting") {
      await setViewport(1582, 1004, false);
      const guideWasVisible = await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(item=>item.textContent.trim()==='Hide guide');if(!button)return false;button.click();return true})()`);
      if (guideWasVisible) {
        await waitFor("!document.querySelector('#guided-demo-drawer')", "hidden guide for marketing captures");
      }
      const preview = await request("/api/public-demo/report-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: "reporting",
          reportId: "reporting-posture",
          columns: ["displayName", "owner", "status", "risk"],
          filters: [{ field: "risk", operator: "gte", value: "50" }],
          limit: 10,
        }),
      });
      if (![200, 201].includes(preview.status)) {
        throw new Error(`Public report preview failed: ${JSON.stringify(preview)}`);
      }
      const coreMutation = await request(
        "/api/runtime/api/v1/simulation/reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );
      if (
        coreMutation.status !== 403 ||
        coreMutation.body?.code !== "public_demo_boundary"
      ) {
        throw new Error(
          `Core mutation boundary failed: ${JSON.stringify(coreMutation)}`,
        );
      }
      const labels = await evaluate(`([...document.querySelectorAll('nav button span')].map(item=>item.textContent.trim()).filter(Boolean))`);
      for (const label of labels) {
        const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        await evaluate(`(()=>{const button=[...document.querySelectorAll('nav button')].find(item=>item.querySelector('span')?.textContent.trim()===${JSON.stringify(label)});button?.click();return !!button})()`);
        await waitFor(
          `location.hash===${JSON.stringify(`#${slug}`)}&&!!document.querySelector('h1')?.textContent.trim()`,
          `public module ${label}`,
        );
        await delay(120);
        const state = await evaluate(`({heading:document.querySelector('h1')?.textContent.trim()||'',unavailable:/workspace data is unavailable/i.test(document.body.innerText)})`);
        if (!state.heading || state.unavailable) {
          throw new Error(`Public module ${label} did not render populated content: ${JSON.stringify(state)}`);
        }
        if (label === "Explorer 360") {
          await waitFor("document.querySelectorAll('.user360-list .compact-row').length>5", "Explorer 360 visual data");
          await capture("explorer-360");
        }
        if (label === "Reporting") {
          await waitFor("document.querySelectorAll('.admin-center-list>button').length===10", "admin-center dashboard visual data");
          await evaluate("document.querySelector('[data-testid=report-finder-tab]')?.click()");
          await waitFor("document.querySelectorAll('[data-testid=report-finder-workspace] .report-finder-card').length>=3", "report finder cards");
          await capture("report-finder");
          await evaluate("([...document.querySelectorAll('.report-plane-filters button')].find((item) => item.textContent.trim() === 'Audit'))?.click()");
          await waitFor("document.querySelectorAll('[data-testid=report-finder-workspace] .report-finder-card').length>0", "audit-plane report finder results");
          await evaluate("document.querySelector('[data-testid=report-finder-workspace] .report-finder-card')?.click()");
          await waitFor("document.querySelector('.detail-drawer')?.textContent.includes('Preview')", "report finder drawer");
          await evaluate("document.querySelector('.detail-drawer .drawer-head button')?.click()");
          await waitFor("!document.querySelector('.detail-drawer')", "closed report finder drawer");
          await evaluate("document.querySelector('[data-testid=service-overview-tab]')?.click()");
          await waitFor("document.querySelectorAll('[data-testid=service-overview-workspace] .service-overview-card').length===3", "service overview cards");
          await evaluate("document.querySelector('[data-testid=service-overview-workspace] .service-overview-card footer button')?.click()");
          await waitFor("document.querySelectorAll('.admin-center-list>button').length===10", "service dashboard drill-down");
          await capture("admin-center-dashboard");
        }
        if (label === "Custom reports") {
          await waitFor("!!document.querySelector('.builder-layout')", "custom report builder visual data");
          await capture("custom-report-builder");
        }
        if (label === "Automations") {
          await waitFor("document.querySelectorAll('.workflow-canvas>div').length>=5", "automation workflow steps");
          const contrast = await evaluate(`(() => {
            const step = document.querySelector('.workflow-canvas>div');
            const label = step?.querySelector('strong');
            const rgb = (value) => (value.match(/\\d+(?:\\.\\d+)?/g) || []).slice(0, 3).map(Number);
            const luminance = (value) => {
              const [red, green, blue] = rgb(value).map((channel) => {
                const normalized = channel / 255;
                return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
              });
              return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
            };
            const surface = getComputedStyle(step).backgroundColor;
            const foreground = getComputedStyle(label).color;
            const a = luminance(surface), b = luminance(foreground);
            return { surface, foreground, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
          })()`);
          if (!Number.isFinite(contrast.ratio) || contrast.ratio < 4.5) {
            throw new Error(`Automation workflow text contrast failed: ${JSON.stringify(contrast)}`);
          }
          await capture("automations-workflow");
        }
        moduleSweep.push({ label, heading: state.heading });
      }
      await capture("workspace");
    }

    results.push({
      persona,
      mode: modes[persona],
      sessionId: identity.body.demoSessionId,
      modules: ids.length,
      navigation: navigation.length,
    });
  }

  if (!isolatedSession) throw new Error("Isolation source session was not captured.");
  const currentIdentity = await request("/api/auth/me");
  if (currentIdentity.body?.demoSessionId === isolatedSession.id) {
    throw new Error("Persona starts reused a public demo session identifier.");
  }
  const freshBootstrap = await request("/api/public-demo/bootstrap");
  if (
    activeScenario(freshBootstrap.body) &&
    activeScenario(freshBootstrap.body) !== "baseline"
  ) {
    throw new Error("A fresh demo session inherited another session's scenario.");
  }
  const reset = await request("/api/public-demo/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (![200, 201].includes(reset.status)) {
    throw new Error(`Public demo reset failed: ${JSON.stringify(reset)}`);
  }

  await send("Network.clearBrowserCookies");
  await send("Network.setCookies", { cookies: [isolatedSession.cookie] });
  const restoredIdentity = await request("/api/auth/me");
  if (restoredIdentity.body?.demoSessionId !== isolatedSession.id) {
    throw new Error("Unable to restore the independent public demo session.");
  }
  const restoredBootstrap = await request("/api/public-demo/bootstrap");
  if (
    activeScenario(restoredBootstrap.body) &&
    activeScenario(restoredBootstrap.body) !== "identity-risk"
  ) {
    throw new Error("Resetting one demo session changed another demo session.");
  }

  const logout = await request("/api/auth/logout", { method: "POST" });
  if (logout.status !== 200) {
    throw new Error(`Public demo logout failed: ${JSON.stringify(logout)}`);
  }
  const afterLogout = await request("/api/auth/me");
  const bootstrapAfterLogout = await request("/api/public-demo/bootstrap");
  if (afterLogout.status !== 401 || bootstrapAfterLogout.status !== 401) {
    throw new Error(
      `Logout did not invalidate the demo boundary: ${afterLogout.status}/${bootstrapAfterLogout.status}.`,
    );
  }
  await send("Page.navigate", { url: `${baseUrl}/demo/workspace` });
  await waitFor(
    "location.pathname==='/landing/demo'||location.pathname==='/login'",
    "expired/logged-out demo recovery",
  );

  console.log(
    JSON.stringify(
      {
        launcher: {
          heading: launcher.heading,
          cacheControl,
          robots,
        },
        personas: results,
        isolation: "independent session state and reset verified",
        guidedControls: guidedControlsVerified,
        mobileWorkspace: mobileWorkspaceLayout,
        moduleSweep: { verified: moduleSweep.length, modules: moduleSweep.map((item) => item.label) },
        mutationBoundary: "core runtime mutation returned public_demo_boundary",
        logout: "session and bootstrap invalidated",
      },
      null,
      2,
    ),
  );
} finally {
  socket.close();
  browser.kill();
}

import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");
if (!existsSync(join(standalone, "server.js"))) {
  throw new Error("Production build not found. Run npm run build first.");
}

const envFile = join(root, ".env.local");
if (!existsSync(envFile)) {
  throw new Error("Local credentials not found. Run npm run auth:setup first.");
}
for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#][^=]*)=(.*)$/);
  if (match && process.env[match[1].trim()] === undefined) {
    process.env[match[1].trim()] = match[2];
  }
}

if (existsSync(join(root, "public"))) {
  cpSync(join(root, "public"), join(standalone, "public"), {
    recursive: true,
    force: true,
  });
}
mkdirSync(join(standalone, ".next"), { recursive: true });
cpSync(join(root, ".next", "static"), join(standalone, ".next", "static"), {
  recursive: true,
  force: true,
});

const child = spawn(process.execPath, ["server.js"], {
  cwd: standalone,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.PORT ?? "3008",
    HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0",
    NODE_ENV: "production",
  },
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});

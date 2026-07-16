import { Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { Subject } from "rxjs";
import type {
  AuditRecord,
  ResourceRecord,
  RuntimeEvent,
  RuntimeState,
} from "./runtime.types";
import { createEnterpriseDemo } from "./enterprise-seed";

export const DEMO_TENANT = "00000000-0000-4000-8000-000000000001";

const workloads = [
  ["Microsoft Entra ID", "Identity", 1400],
  ["Exchange Online", "Mailbox", 900],
  ["Microsoft Teams", "Team", 650],
  ["SharePoint Online", "Site", 650],
  ["OneDrive", "Drive", 750],
  ["Microsoft Intune", "Device", 900],
  ["Defender XDR", "Incident", 350],
  ["Microsoft Purview", "Control", 450],
  ["Licensing & Cost", "Assignment", 1100],
  ["Hybrid Active Directory", "Directory object", 700],
] as const;
const departments = [
  "Security",
  "Finance",
  "IT",
  "Human Resources",
  "Sales",
  "Legal",
  "Operations",
  "Human Resources",
];

function seedResources(tenantId: string): ResourceRecord[] {
  const seededAt = Date.now();
  return workloads.flatMap(([workload, type, count], workloadIndex) =>
    Array.from({ length: count }, (_, index) => {
      const risk = (index * 17 + workloadIndex * 11) % 100;
      const status =
        risk >= 88 ? "critical" : risk >= 66 ? "warning" : "healthy";
      return {
        id: `${workloadIndex + 1}-${String(index + 1).padStart(6, "0")}`,
        tenantId,
        workload,
        type,
        displayName: `${type} ${String(index + 1).padStart(5, "0")}`,
        status,
        risk,
        department: departments[(index + workloadIndex) % departments.length],
        updatedAt: new Date(
          seededAt - ((index * 43) % 3600) * 1000,
        ).toISOString(),
        details: {
          enabled: index % 19 !== 0,
          owner: `owner${(index % 180) + 1}@globalholdings.com`,
          region: ["Dubai", "London", "Singapore", "New York", "Germany", "India", "Australia"][index % 7],
          activityScore: 100 - ((index * 7) % 91),
          external: index % 13 === 0,
        },
      } satisfies ResourceRecord;
    }),
  );
}

@Injectable()
export class LocalStateService {
  private readonly path = resolve(
    process.env.RUNTIME_DATA_PATH ?? "data/runtime-state.json",
  );
  private state: RuntimeState;
  readonly events$ = new Subject<RuntimeEvent>();

  constructor() {
    this.state = this.load();
  }

  private load(): RuntimeState {
    if (existsSync(this.path)) {
      try {
        const parsed = JSON.parse(
          readFileSync(this.path, "utf8"),
        ) as RuntimeState;
        if (parsed.version === 2 && parsed.enterprise && Array.isArray(parsed.resources))
          return parsed;
      } catch {
        // A corrupt test state is replaced with a deterministic seed below.
      }
    }
    const state = this.createSeed();
    this.persist(state);
    return state;
  }

  private createSeed(): RuntimeState {
    const seededAt = new Date().toISOString();
    const state: RuntimeState = {
      version: 2,
      seededAt,
      enterprise: createEnterpriseDemo(DEMO_TENANT),
      resources: seedResources(DEMO_TENANT),
      reportJobs: [],
      workflows: [],
      audit: [],
      events: [],
    };
    return state;
  }

  private persist(state = this.state) {
    mkdirSync(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(state), "utf8");
    renameSync(temporary, this.path);
  }

  snapshot() {
    return this.state;
  }

  mutate<T>(operation: (state: RuntimeState) => T): T {
    const result = operation(this.state);
    this.persist();
    return result;
  }

  reset(actorId: string, correlationId: string) {
    this.state = this.createSeed();
    this.appendAudit(
      DEMO_TENANT,
      actorId,
      "runtime.reset",
      "runtime",
      "local",
      "success",
      correlationId,
    );
    this.publish(DEMO_TENANT, "runtime.reset", {
      resources: this.state.resources.length,
      users: this.state.enterprise.users.length,
      enterpriseObjects:
        this.state.enterprise.users.length +
        this.state.enterprise.groups.length +
        this.state.enterprise.teams.length +
        this.state.enterprise.channels.length +
        this.state.enterprise.sharePointSites.length +
        this.state.enterprise.oneDrives.length +
        this.state.enterprise.mailboxes.length +
        this.state.enterprise.devices.length +
        this.state.enterprise.applications.length,
    });
    return {
      seededAt: this.state.seededAt,
      resources: this.state.resources.length,
      users: this.state.enterprise.users.length,
      enterpriseObjects:
        this.state.enterprise.users.length +
        this.state.enterprise.groups.length +
        this.state.enterprise.teams.length +
        this.state.enterprise.channels.length +
        this.state.enterprise.sharePointSites.length +
        this.state.enterprise.oneDrives.length +
        this.state.enterprise.mailboxes.length +
        this.state.enterprise.devices.length +
        this.state.enterprise.applications.length,
    };
  }

  appendAudit(
    tenantId: string,
    actorId: string,
    action: string,
    objectType: string,
    objectId: string,
    result: string,
    correlationId: string,
  ): AuditRecord {
    return this.mutate((state) => {
      const previousHash = state.audit.at(-1)?.hash ?? "GENESIS";
      const record = {
        sequence: state.audit.length + 1,
        tenantId,
        occurredAt: new Date().toISOString(),
        actorId,
        action,
        objectType,
        objectId,
        result,
        correlationId,
        previousHash,
        hash: "",
      };
      record.hash = createHash("sha256")
        .update(previousHash + JSON.stringify(record))
        .digest("hex");
      state.audit.push(record);
      return record;
    });
  }

  publish(tenantId: string, type: string, payload: Record<string, unknown>) {
    const event: RuntimeEvent = {
      id: randomUUID(),
      tenantId,
      type,
      occurredAt: new Date().toISOString(),
      payload,
    };
    this.mutate((state) => {
      state.events.push(event);
      state.events = state.events.slice(-250);
    });
    this.events$.next(event);
    return event;
  }
}

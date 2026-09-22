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
  RuntimeEvent,
  RuntimeState,
} from "./runtime.types";
import type { EnterpriseDemoState } from "./enterprise.types";

export const DEMO_TENANT = "00000000-0000-4000-8000-000000000001";

function createEmptyEnterprise(tenantId: string): EnterpriseDemoState {
  return {
    tenant: { id: tenantId, name: "Unconfigured organization", industry: "Not configured", countries: 0, activeScenario: "baseline", lastSimulationAt: new Date().toISOString(), kpis: { users: 0, activeUsers: 0, inactiveUsers: 0, securityScore: 0, complianceScore: 0, licenseUtilization: 0, storageUsage: 0, highRiskUsers: 0 } },
    departments: [], locations: [], users: [], groups: [], teams: [], channels: [], sharePointSites: [], oneDrives: [], mailboxes: [], devices: [], applications: [], licenses: [], securityEvents: [], riskFindings: [], complianceControls: [], reportTemplates: [], timeline: [],
  };
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
        if (
          parsed.version === 5 &&
          parsed.enterprise &&
          Array.isArray(parsed.resources)
        ) {
          let migrated =
            !Array.isArray(parsed.reportViews) ||
            !Array.isArray(parsed.reportSchedules) ||
            !Array.isArray(parsed.reportAlerts);
          parsed.version = 5;
          parsed.reportJobs ??= [];
          parsed.reportViews ??= [];
          parsed.reportSchedules ??= [];
          parsed.reportAlerts ??= [];
          parsed.workflows ??= [];
          parsed.findingCases ??= [];
          parsed.audit ??= [];
          parsed.events ??= [];
          for (const job of parsed.reportJobs) {
            if (!job.trigger || (job.trigger as string) === "manual") {
              job.trigger = "interactive";
              migrated = true;
            }
            if (!job.filters) {
              job.filters = [];
              migrated = true;
            }
          }
          for (const view of parsed.reportViews) {
            if ((view.visibility as string) === "organization") {
              view.visibility = "team";
              migrated = true;
            }
            if (!view.status) {
              view.status = "active";
              migrated = true;
            }
            view.filters ??= [];
          }
          for (const schedule of parsed.reportSchedules) {
            schedule.status ??= "active";
            schedule.delivery ??= "local_archive";
          }
          for (const alert of parsed.reportAlerts) {
            alert.status ??= "active";
          }
          if (migrated) this.persist(parsed);
          return parsed;
        }
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
      version: 5,
      seededAt,
      enterprise: createEmptyEnterprise(process.env.M365_TENANT_ID || randomUUID()),
      resources: [],
      reportJobs: [],
      reportViews: [],
      reportSchedules: [],
      reportAlerts: [],
      workflows: [],
      findingCases: [],
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
      this.state.enterprise.tenant.id,
      actorId,
      "runtime.reset",
      "runtime",
      "local",
      "success",
      correlationId,
    );
    this.publish(this.state.enterprise.tenant.id, "runtime.reset", {
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
      const previousHash =
        [...state.audit]
          .reverse()
          .find((item) => item.tenantId === tenantId)?.hash ?? "GENESIS";
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

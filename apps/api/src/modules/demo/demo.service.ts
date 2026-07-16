import { Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { LocalStateService } from "../runtime/local-state.service";
import type { DemoScenario, DemoTimelineEvent } from "../runtime/enterprise.types";

const scenarios: Record<DemoScenario, { label: string; description: string; security: number; compliance: number; risk: number }> = {
  baseline: { label: "Normal Operations", description: "Balanced enterprise operating baseline.", security: 87, compliance: 91, risk: 24 },
  "security-breach": { label: "Security Breach", description: "Impossible travel and privileged-account compromise investigation.", security: 61, compliance: 84, risk: 47 },
  "license-optimization": { label: "License Optimization", description: "E5 under-utilization and reclaimable subscription analysis.", security: 87, compliance: 91, risk: 24 },
  "compliance-audit": { label: "Compliance Audit", description: "ISO 27001, NIST, CIS, and SOC 2 evidence readiness.", security: 84, compliance: 79, risk: 28 },
  "identity-risk": { label: "Identity Risk", description: "MFA gaps, inactive privilege, and risky sign-ins.", security: 70, compliance: 83, risk: 64 },
  "executive-cio": { label: "Executive CIO Dashboard", description: "Business risk, operational health, cost, and investment outcomes.", security: 87, compliance: 91, risk: 24 },
};

@Injectable()
export class DemoService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(private readonly store: LocalStateService) {}

  onModuleInit() {
    this.timer = setInterval(() => this.tick("simulation.engine", randomUUID()), 30_000);
    this.timer.unref();
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  overview() {
    const demo = this.store.snapshot().enterprise;
    return {
      generatedAt: new Date().toISOString(),
      tenant: demo.tenant,
      objectCounts: {
        users: demo.users.length, groups: demo.groups.length, teams: demo.teams.length, channels: demo.channels.length,
        sharePointSites: demo.sharePointSites.length, oneDrives: demo.oneDrives.length, mailboxes: demo.mailboxes.length,
        devices: demo.devices.length, applications: demo.applications.length,
      },
      departments: demo.departments,
      locations: demo.locations,
      scenarios: Object.entries(scenarios).map(([id, value]) => ({ id, ...value })),
      latestEvents: demo.timeline.slice(0, 8),
    };
  }

  users(search = "", risk = "", limit = 100) {
    const query = search.trim().toLowerCase();
    const items = this.store.snapshot().enterprise.users.filter((user) =>
      (!query || `${user.displayName} ${user.username} ${user.department} ${user.location}`.toLowerCase().includes(query)) &&
      (!risk || user.riskLevel.toLowerCase() === risk.toLowerCase()),
    );
    return { total: items.length, items: items.slice(0, Math.min(Math.max(limit, 1), 250)) };
  }

  user(id: string) {
    const demo = this.store.snapshot().enterprise;
    const user = demo.users.find((item) => item.id === id || item.username.toLowerCase() === id.toLowerCase());
    if (!user) throw new NotFoundException("Simulated tenant user not found.");
    return {
      ...user,
      recommendations: [
        ...(user.riskLevel === "High" ? ["Review risky sign-in and revoke active sessions."] : []),
        ...(user.mfaStatus === "Disabled" ? ["Register phishing-resistant MFA and enforce Conditional Access."] : []),
        ...(user.accountStatus === "Inactive" ? ["Review account owner, disable access, and reclaim licenses."] : []),
        ...(user.mailboxGb > 40 ? ["Review mailbox retention and archive policy."] : []),
      ],
      recentActivity: demo.timeline.slice(0, 6),
    };
  }

  security() {
    const demo = this.store.snapshot().enterprise;
    return {
      score: demo.tenant.kpis.securityScore,
      riskDistribution: { high: 24, medium: 86, low: 340 },
      activeIncidents: demo.securityEvents.filter((item) => item.status !== "Resolved").length,
      events: demo.securityEvents.slice(0, 50),
      findings: demo.riskFindings,
      recommendations: ["Enable Conditional Access MFA", "Remove unused privileges", "Review external collaboration"],
    };
  }

  licenses() {
    const demo = this.store.snapshot().enterprise;
    const annualSavings = demo.licenses.reduce((total, item) => total + item.unused * item.monthlyUnitCost * 12, 0);
    const candidates = demo.users.filter((user, index) => user.license === "Microsoft 365 E5" && index % 3 === 0).slice(0, 100).map((user, index) => ({
      user: user.displayName, username: user.username, currentLicense: user.license, usage: `${3 + (index % 12)}%`, recommendation: "Move to Business Premium", annualSaving: 420,
    }));
    return { utilization: demo.tenant.kpis.licenseUtilization, annualSavings, plans: demo.licenses, candidates };
  }

  compliance() {
    const demo = this.store.snapshot().enterprise;
    const frameworkScores = ["ISO 27001", "NIST", "CIS", "SOC 2"].map((framework) => {
      const controls = demo.complianceControls.filter((item) => item.framework === framework);
      return { framework, score: Math.round(controls.reduce((sum, item) => sum + item.score, 0) / controls.length), controls: controls.length, failed: controls.filter((item) => item.status === "Failed").length };
    });
    return { score: demo.tenant.kpis.complianceScore, frameworkScores, controls: demo.complianceControls };
  }

  reportTemplates() { return { items: this.store.snapshot().enterprise.reportTemplates }; }
  timeline() { return { items: this.store.snapshot().enterprise.timeline.slice(0, 100) }; }

  activateScenario(scenario: string, actorId: string, correlationId: string) {
    if (!(scenario in scenarios)) throw new NotFoundException("Demo scenario not found.");
    const id = scenario as DemoScenario;
    const selected = scenarios[id];
    this.store.mutate((state) => {
      state.enterprise.tenant.activeScenario = id;
      state.enterprise.tenant.kpis.securityScore = selected.security;
      state.enterprise.tenant.kpis.complianceScore = selected.compliance;
      state.enterprise.tenant.kpis.highRiskUsers = selected.risk;
      state.enterprise.tenant.lastSimulationAt = new Date().toISOString();
      state.enterprise.timeline.unshift({ id: randomUUID(), occurredAt: new Date().toISOString(), type: "scenario", title: `${selected.label} scenario activated`, detail: selected.description, severity: id === "security-breach" ? "critical" : "warning" });
    });
    this.store.appendAudit(this.store.snapshot().enterprise.tenant.id, actorId, "demo.scenario.activated", "scenario", id, "success", correlationId);
    this.store.publish(this.store.snapshot().enterprise.tenant.id, "demo.scenario.activated", { scenario: id, label: selected.label });
    return this.overview();
  }

  tick(actorId: string, correlationId: string) {
    const demo = this.store.snapshot().enterprise;
    const sequence = demo.timeline.length + 1;
    const variants = [
      ["login", "User login", "A user signed in from an approved location.", "info"],
      ["risk", "Risk detected", "Identity Protection increased a user risk score.", "warning"],
      ["alert", "Alert generated", "Defender correlated sign-in and endpoint evidence.", "critical"],
      ["recommendation", "AI recommendation created", "Review the new evidence-backed remediation proposal.", "warning"],
      ["license", "License usage changed", "Subscription utilization was recalculated.", "info"],
      ["device", "Device compliance changed", "Intune evaluated a device compliance policy.", "warning"],
    ] as const;
    const selected = variants[sequence % variants.length];
    const event: DemoTimelineEvent = { id: randomUUID(), occurredAt: new Date().toISOString(), type: selected[0], title: selected[1], detail: selected[2], severity: selected[3] };
    this.store.mutate((state) => {
      state.enterprise.timeline.unshift(event);
      state.enterprise.timeline = state.enterprise.timeline.slice(0, 250);
      state.enterprise.tenant.lastSimulationAt = event.occurredAt;
    });
    this.store.publish(demo.tenant.id, `demo.${event.type}`, { eventId: event.id, title: event.title, severity: event.severity });
    if (actorId !== "simulation.engine") this.store.appendAudit(demo.tenant.id, actorId, "demo.tick", "timeline", event.id, "success", correlationId);
    return event;
  }

  ask(question: string) {
    const normalized = question.toLowerCase();
    const demo = this.store.snapshot().enterprise;
    if (normalized.includes("security") || normalized.includes("problem") || normalized.includes("risk")) return { question, answer: `Your tenant has ${demo.tenant.kpis.highRiskUsers} high-risk users. The top issues are 120 users without MFA, 15 inactive privileged accounts, and 42 external sharing risks.`, findings: demo.riskFindings.slice(0, 3), recommendations: ["Enable Conditional Access MFA", "Remove unused privileges", "Review external collaboration"], groundedAt: new Date().toISOString(), sources: ["Identity Protection simulation", "Defender XDR simulation", "Purview sharing analysis"] };
    if (normalized.includes("license") || normalized.includes("saving") || normalized.includes("cost")) return { question, answer: "1,500 Microsoft 365 E5 assignments are unused. The modeled optimization opportunity exceeds $150,000 annually after eligibility and business-owner review.", recommendations: ["Validate candidates", "Approve downgrade cohort", "Monitor service-plan dependency"], groundedAt: new Date().toISOString(), sources: ["License assignment simulation", "90-day activity model"] };
    if (normalized.includes("compliance") || normalized.includes("audit")) return { question, answer: `Overall compliance readiness is ${demo.tenant.kpis.complianceScore}%. MFA enforcement and external sharing governance are the leading evidence gaps.`, recommendations: ["Open failed control evidence", "Assign control owners", "Generate ISO 27001 evidence pack"], groundedAt: new Date().toISOString(), sources: ["Compliance control simulation", "Audit chain"] };
    return { question, answer: `Global Enterprise Holdings operates 5,000 users across 25 countries. Security score is ${demo.tenant.kpis.securityScore}%, compliance is ${demo.tenant.kpis.complianceScore}%, and license utilization is ${demo.tenant.kpis.licenseUtilization}%.`, recommendations: ["Review critical findings", "Open executive scenario", "Generate tenant health report"], groundedAt: new Date().toISOString(), sources: ["Enterprise simulation overview"] };
  }
}

export type GuidedDemoPersonaId =
  | "executive"
  | "security"
  | "operations"
  | "reporting";

export type GuidedDemoExperience = "guided" | "free";

export type GuidedDemoStep = {
  id: string;
  module: string;
  anchor: string;
  eyebrow: string;
  title: string;
  description: string;
  proof: string;
};

export type GuidedDemoPersona = {
  id: GuidedDemoPersonaId;
  name: string;
  roleLabel: string;
  duration: string;
  summary: string;
  outcome: string;
  steps: GuidedDemoStep[];
};

export type GuidedDemoIdentity = {
  sessionType: string;
  demoPersona: GuidedDemoPersonaId;
  demoMode: GuidedDemoExperience;
  expiresAt?: string | number;
  name: string;
  title?: string;
  roles?: string[];
};

export type GuidedDemoSession = {
  persona: GuidedDemoPersonaId;
  experience?: GuidedDemoExperience;
  expiresAt?: string | number;
  sessionId?: string;
};

export type GuidedDemoProgress = {
  version: 1;
  persona: GuidedDemoPersonaId;
  experience: GuidedDemoExperience;
  stepIndex: number;
  completed: string[];
  complete: boolean;
  startedAt: string;
};

export const GUIDED_DEMO_PROGRESS_KEY = "aegis.guided-demo.progress.v1";

export const GUIDED_DEMO_PERSONAS: readonly GuidedDemoPersona[] = [
  {
    id: "executive",
    name: "Executive leader",
    roleLabel: "Read-only Analyst",
    duration: "6 minutes",
    summary:
      "Follow risk, operational health, compliance, and recoverable value from one concise operating view.",
    outcome: "A board-ready view of posture, accountability, and value.",
    steps: [
      {
        id: "executive-posture",
        module: "Command center",
        anchor: "command-overview",
        eyebrow: "Enterprise posture",
        title: "Begin with the decisions that need attention",
        description:
          "Review the tenant-wide security, compliance, cost, and operations signals before opening a single workload console.",
        proof: "Prioritized findings retain evidence, ownership, and business impact.",
      },
      {
        id: "executive-user",
        module: "Explorer 360",
        anchor: "explorer-profile",
        eyebrow: "Connected context",
        title: "Move from an aggregate signal to one accountable user",
        description:
          "Inspect identity, location, license, activity, device, collaboration, MFA, and risk context together.",
        proof: "One normalized view replaces disconnected point investigations.",
      },
      {
        id: "executive-reporting",
        module: "Reporting",
        anchor: "reporting-dashboard",
        eyebrow: "Operational reporting",
        title: "See every admin center in a common reporting model",
        description:
          "Compare service health, freshness, risk, and priority records without changing reporting tools between workloads.",
        proof: "Dashboard metrics drill into inspectable synthetic records.",
      },
      {
        id: "executive-value",
        module: "Licenses",
        anchor: "license-opportunity",
        eyebrow: "FinOps",
        title: "Connect inactivity to a defensible value opportunity",
        description:
          "Review underused subscriptions and candidate actions with exceptions and accountable recommendations.",
        proof: "Savings remain modeled until an authorized owner approves action.",
      },
      {
        id: "executive-compliance",
        module: "Compliance",
        anchor: "compliance-frameworks",
        eyebrow: "Control assurance",
        title: "Translate operational evidence into framework readiness",
        description:
          "Compare control posture across ISO 27001, NIST, CIS, and SOC 2 while retaining failed-object context.",
        proof: "Evidence and remediation ownership stay connected to the control.",
      },
      {
        id: "executive-adoption",
        module: "Usage analytics",
        anchor: "usage-adoption",
        eyebrow: "Adoption",
        title: "Close with the relationship between adoption and value",
        description:
          "Identify underused services and departments that need enablement rather than another ungoverned license change.",
        proof: "Usage signals inform decisions; they do not execute changes.",
      },
    ],
  },
  {
    id: "security",
    name: "Security & compliance",
    roleLabel: "Compliance Auditor",
    duration: "7 minutes",
    summary:
      "Trace a risk from finding and user context through investigation, evidence, controls, and grounded analysis.",
    outcome: "An evidence-led security and assurance narrative.",
    steps: [
      {
        id: "security-finding",
        module: "Command center",
        anchor: "command-findings",
        eyebrow: "Prioritized risk",
        title: "Open with an actionable identity finding",
        description:
          "Review severity, affected population, business impact, supporting evidence, owner, and recommended response.",
        proof: "The public tour previews governance and never changes a tenant.",
      },
      {
        id: "security-user",
        module: "Explorer 360",
        anchor: "explorer-profile",
        eyebrow: "User context",
        title: "Inspect the person behind the alert",
        description:
          "Correlate MFA, recent activity, devices, collaboration, license, location, and recommendations.",
        proof: "Investigation context is normalized before a response is proposed.",
      },
      {
        id: "security-incident",
        module: "Security",
        anchor: "security-incidents",
        eyebrow: "Security operations",
        title: "Prioritize incidents using explainable signals",
        description:
          "Compare active incidents, risky identities, detection source, location, and current status.",
        proof: "Synthetic incidents demonstrate the operating workflow only.",
      },
      {
        id: "security-identity",
        module: "Identity",
        anchor: "identity-mfa",
        eyebrow: "Identity assurance",
        title: "Find the authentication gaps that materially change risk",
        description:
          "Review privileged identities, MFA coverage, sign-in risk, and departmental concentration.",
        proof: "Role-aware access limits what each persona can inspect.",
      },
      {
        id: "security-audit",
        module: "Auditing",
        anchor: "audit-evidence",
        eyebrow: "Evidence",
        title: "Reconstruct what happened and who was accountable",
        description:
          "Inspect normalized activity, actor, target, correlation, severity, and evidence integrity.",
        proof: "The local runtime retains an inspectable audit history.",
      },
      {
        id: "security-controls",
        module: "Compliance",
        anchor: "compliance-frameworks",
        eyebrow: "Control mapping",
        title: "Map operational failures to assurance obligations",
        description:
          "See how identity and security evidence contributes to multiple control frameworks.",
        proof: "One evidence source can support several mapped obligations.",
      },
      {
        id: "security-ai",
        module: "AI analyst",
        anchor: "ai-question",
        eyebrow: "Grounded analysis",
        title: "Ask a question against the authorized local snapshot",
        description:
          "Use deterministic local evidence and visible sources to draft an analyst summary without external data transfer.",
        proof: "Generated guidance remains a draft for accountable human review.",
      },
    ],
  },
  {
    id: "operations",
    name: "Microsoft 365 operations",
    roleLabel: "Microsoft 365 Administrator",
    duration: "7 minutes",
    summary:
      "Move from service health and user context into controlled operations, hybrid assurance, and cost decisions.",
    outcome: "A practical cross-workload operations story.",
    steps: [
      {
        id: "operations-health",
        module: "Command center",
        anchor: "command-overview",
        eyebrow: "Operational health",
        title: "Start with the services and decisions that need attention",
        description:
          "Review current health, collection freshness, active risk, and the most consequential findings.",
        proof: "The tour reads a synthetic local snapshot and performs no tenant mutation.",
      },
      {
        id: "operations-management",
        module: "Management",
        anchor: "management-actions",
        eyebrow: "Controlled administration",
        title: "Preview a change before authority is requested",
        description:
          "Walk through scope, preflight, approval, idempotency, verification, and rollback expectations.",
        proof: "Public-demo actions stop at preview and never reach Microsoft 365.",
      },
      {
        id: "operations-user",
        module: "Explorer 360",
        anchor: "explorer-profile",
        eyebrow: "User 360",
        title: "Resolve workload symptoms with complete user context",
        description:
          "Bring identity, mailbox, device, license, Teams, risk, and activity signals into the same investigation.",
        proof: "Context travels with the case instead of being manually reassembled.",
      },
      {
        id: "operations-approval",
        module: "Automations",
        anchor: "automation-queue",
        eyebrow: "Governed automation",
        title: "Separate request, approval, execution, and evidence",
        description:
          "Inspect the approval queue and the state transitions that prevent an operator from approving their own change.",
        proof: "The public tour previews the workflow without creating a draft.",
      },
      {
        id: "operations-hybrid",
        module: "Hybrid AD",
        anchor: "hybrid-health",
        eyebrow: "Hybrid assurance",
        title: "Include directory synchronization and on-premises dependencies",
        description:
          "Review forests, controllers, replication, synchronization, stale privilege, and topology risk.",
        proof: "Cloud and hybrid signals share the same accountable operating model.",
      },
      {
        id: "operations-license",
        module: "Licenses",
        anchor: "license-opportunity",
        eyebrow: "Operational value",
        title: "Use activity evidence before changing a subscription",
        description:
          "Review candidates, exceptions, utilization, and modeled savings before any approval-controlled action.",
        proof: "Cost optimization is treated as a governed operational decision.",
      },
      {
        id: "operations-boundary",
        module: "Connection center",
        anchor: "connection-boundary",
        eyebrow: "Deployment boundary",
        title: "Close with connectivity, permissions, and data residency",
        description:
          "Explain tenant ownership, certificate identity, least privilege, collection health, and the customer-controlled boundary.",
        proof: "No customer connector is configured in this public demonstration.",
      },
    ],
  },
  {
    id: "reporting",
    name: "Reporting & FinOps",
    roleLabel: "Reporting Administrator",
    duration: "7 minutes",
    summary:
      "Explore admin-center dashboards, report discovery, governed design, delivery controls, and decision-ready value.",
    outcome: "A complete reporting lifecycle without copied tenant data.",
    steps: [
      {
        id: "reporting-dashboard",
        module: "Reporting",
        anchor: "reporting-dashboard",
        eyebrow: "Admin-center dashboards",
        title: "Use one visual grammar across Microsoft 365 workloads",
        description:
          "Compare health, freshness, risk, and priority records across ten synthetic admin-center perspectives.",
        proof: "Every count can be traced to inspectable local demo rows.",
      },
      {
        id: "reporting-catalogue",
        module: "Reporting",
        anchor: "report-catalogue",
        eyebrow: "Report discovery",
        title: "Find the right operational question quickly",
        description:
          "Search and filter the original presentation catalogue by workload, category, schedule, and ownership.",
        proof: "Catalogue templates are synthetic product content, not scraped reports.",
      },
      {
        id: "reporting-builder",
        module: "Custom reports",
        anchor: "report-builder",
        eyebrow: "Governed design",
        title: "Compose a cross-workload report from approved fields",
        description:
          "Select sources and columns, define calculated fields, apply filters, and preview the semantic plan.",
        proof: "Sensitive fields remain visible to the policy layer during design.",
      },
      {
        id: "reporting-security",
        module: "Custom reports",
        anchor: "report-security",
        eyebrow: "Delivery controls",
        title: "Carry security and accountability into distribution",
        description:
          "Review scheduling, recipients, classification, masking, watermarking, and export justification controls.",
        proof: "The public tour stores no server-side schedule or external recipient.",
      },
      {
        id: "reporting-dashboard-design",
        module: "Dashboard designer",
        anchor: "dashboard-designer",
        eyebrow: "Role-aware presentation",
        title: "Assemble a decision view from governed widgets",
        description:
          "Explore widget selection, layout, sizing, and audience-aware presentation without modifying shared runtime state.",
        proof: "Tour changes remain local to the current browser session.",
      },
      {
        id: "reporting-value",
        module: "Value center",
        anchor: "value-model",
        eyebrow: "Business case",
        title: "Turn operational evidence into a discovery hypothesis",
        description:
          "Model administrative effort, tool overlap, and user scale while keeping assumptions explicit.",
        proof: "Illustrative value is not presented as a guaranteed saving.",
      },
      {
        id: "reporting-evidence",
        module: "Auditing",
        anchor: "audit-evidence",
        eyebrow: "Reporting accountability",
        title: "Verify who generated, changed, or distributed an artifact",
        description:
          "Close the lifecycle with actor, timestamp, object, correlation, and evidence integrity.",
        proof: "Report operations remain attributable in the local demonstration.",
      },
    ],
  },
] as const;

export function getGuidedDemoPersona(id: GuidedDemoPersonaId) {
  return (
    GUIDED_DEMO_PERSONAS.find((persona) => persona.id === id) ??
    GUIDED_DEMO_PERSONAS[0]
  );
}

export function createGuidedDemoProgress(
  persona: GuidedDemoPersonaId,
  experience: GuidedDemoExperience,
): GuidedDemoProgress {
  return {
    version: 1,
    persona,
    experience,
    stepIndex: 0,
    completed: [],
    complete: false,
    startedAt: new Date().toISOString(),
  };
}

export function readGuidedDemoProgress(): GuidedDemoProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GUIDED_DEMO_PROGRESS_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<GuidedDemoProgress>;
    if (
      value.version !== 1 ||
      !GUIDED_DEMO_PERSONAS.some((persona) => persona.id === value.persona) ||
      (value.experience !== "guided" && value.experience !== "free") ||
      typeof value.stepIndex !== "number" ||
      !Array.isArray(value.completed) ||
      typeof value.complete !== "boolean" ||
      typeof value.startedAt !== "string"
    ) {
      throw new Error("Invalid guided-demo state");
    }
    return value as GuidedDemoProgress;
  } catch {
    window.sessionStorage.removeItem(GUIDED_DEMO_PROGRESS_KEY);
    return null;
  }
}

export function writeGuidedDemoProgress(progress: GuidedDemoProgress) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      GUIDED_DEMO_PROGRESS_KEY,
      JSON.stringify(progress),
    );
  } catch {
    // A blocked storage API must not prevent the tour from operating in memory.
  }
}

export function clearGuidedDemoProgress() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(GUIDED_DEMO_PROGRESS_KEY);
  } catch {
    // The in-memory restart still succeeds when storage is unavailable.
  }
}

export function guidedDemoExpiry(value?: string | number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

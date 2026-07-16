"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert24Regular,
  Apps24Regular,
  ArrowDownload24Regular,
  ArrowTrending24Regular,
  Bot24Regular,
  CheckmarkCircle24Regular,
  ChevronDown16Regular,
  ClipboardTask24Regular,
  CloudCheckmark24Regular,
  DataTrending24Regular,
  Database24Regular,
  Desktop24Regular,
  DocumentBulletList24Regular,
  Grid24Regular,
  Key24Regular,
  LockClosed24Regular,
  Mail24Regular,
  MoneyHand24Regular,
  MoreHorizontal20Regular,
  Navigation20Regular,
  PeopleTeam24Regular,
  Person24Regular,
  Play24Regular,
  Search20Regular,
  Save24Regular,
  Settings24Regular,
  ShieldCheckmark24Regular,
  ShieldError24Regular,
  Sparkle24Filled,
  WeatherMoon24Regular,
  WindowDevTools24Regular,
} from "@fluentui/react-icons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  aiAnswer,
  aiPrompts,
  auditEvents,
  connectors,
  controls,
  departments,
  failedControls,
  findings,
  identities,
  licenses,
  relationships,
  reports,
  riskTrend,
  securitySignals,
  tenant,
  twinObjects,
  workflows,
  type Finding,
  type Severity,
} from "@/data/demo";
import { SuiteWorkspace } from "@/components/SuiteWorkspaces";
import { adoption, auditActivities, reportCatalogue } from "@/data/suite";
import { ProductStudio } from "@/components/ProductStudio";
import { DemoModePanel, LiveCompliancePanel, LiveLicensePanel, LiveSecurityPanel, User360Workspace } from "@/components/EnterpriseDemo";
import { CommercialWorkspaces } from "@/components/CommercialWorkspaces";
import {
  exportReportExcel,
  exportReportPdf,
  generateCustomReport,
  type GeneratedReport,
} from "@/lib/reporting";
import {
  askDemoAi,
  assignRuntimeFinding,
  createRuntimeWorkflowDraft,
  createRuntimeFindingRemediation,
  getRuntimeFindingCase,
  getRuntimeWorkflows,
  runRuntimeWorkflow,
  runtimeEventUrl,
  transitionRuntimeWorkflow,
  type RuntimeFindingCaseView,
  type RuntimeWorkflow,
} from "@/lib/runtime-api";
import { canOpenModule, canRunChanges } from "@/lib/access";
import { roleLabels, type PlatformRole } from "@/lib/identity";

type Icon = ComponentType<{ className?: string }>;
type NavItem = { label: string; icon: Icon; badge?: string };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Command center", icon: Grid24Regular },
      { label: "Explorer 360", icon: DataTrending24Regular },
      { label: "Dashboard designer", icon: Grid24Regular },
      { label: "Value center", icon: MoneyHand24Regular },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Security", icon: ShieldCheckmark24Regular, badge: "6" },
      { label: "Alerts", icon: Alert24Regular, badge: "4" },
      { label: "Identity", icon: Person24Regular },
      { label: "Management", icon: Settings24Regular },
      { label: "Automations", icon: Apps24Regular },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { label: "Reporting", icon: DocumentBulletList24Regular },
      { label: "Custom reports", icon: WindowDevTools24Regular },
      { label: "Auditing", icon: Search20Regular },
      { label: "Usage analytics", icon: ArrowTrending24Regular },
      { label: "Compliance", icon: ClipboardTask24Regular },
      { label: "Licenses", icon: MoneyHand24Regular },
      { label: "Digital twin", icon: Database24Regular },
      { label: "Report studio", icon: DocumentBulletList24Regular },
    ],
  },
  {
    label: "GOVERNANCE",
    items: [
      { label: "Governance", icon: ClipboardTask24Regular },
      { label: "Reminders", icon: Alert24Regular },
      { label: "Delegation", icon: PeopleTeam24Regular },
      { label: "Hybrid AD", icon: Database24Regular },
    ],
  },
  {
    label: "PLATFORM",
    items: [
      { label: "Connection center", icon: CloudCheckmark24Regular },
      { label: "Customer portal", icon: Key24Regular },
      { label: "AI analyst", icon: Bot24Regular },
      { label: "Configuration", icon: Settings24Regular },
      { label: "Administration", icon: Settings24Regular },
      { label: "Super Admin", icon: PeopleTeam24Regular },
    ],
  },
];
const allNavigation = navGroups.flatMap((group) => group.items);
type ShellNotification = {
  id: string;
  title: string;
  detail: string;
  time: string;
  target: string;
  read: boolean;
};
const DEFAULT_NOTIFICATIONS: ShellNotification[] = [
  { id: "identity-mfa", title: "Critical identity finding", detail: "45 privileged MFA gaps", time: "2m", target: "Identity", read: false },
  { id: "intune-delay", title: "Intune collection delayed", detail: "18 minutes behind SLA", time: "6m", target: "Management", read: false },
  { id: "workflow-approval", title: "Workflow awaiting approval", detail: "License reclamation · 87 users", time: "18m", target: "Automations", read: false },
  { id: "report-ready", title: "Scheduled report ready", detail: "Board Cyber Risk Briefing", time: "1h", target: "Reporting", read: false },
];
const NOTIFICATION_STORAGE_KEY = "aegis.shell.notifications.v1";
const slugFor = (label: string) =>
  label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const severityOrder: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}

function Button({
  children,
  primary = false,
  onClick,
  disabled = false,
  title,
  "data-testid": testId,
}: {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  "data-testid"?: string;
}) {
  return (
    <button
      className={primary ? "primary-button" : "secondary-button"}
      data-testid={testId}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  detail,
  icon: Icon,
  tone = "teal",
}: {
  label: string;
  value: string;
  detail: string;
  icon: Icon;
  tone?: string;
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-head">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </article>
  );
}

function SeverityPill({ value }: { value: string }) {
  const key = value.toLowerCase();
  return (
    <b className={`severity ${key}`}>
      <i />
      {value}
    </b>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`panel showcase-panel ${className}`}>
      <div className="panel-heading showcase-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </article>
  );
}

function DemoNotice() {
  return (
    <div className="demo-notice">
      <span>
        <Sparkle24Filled />
      </span>
      <div>
        <strong>Client demonstration environment</strong>
        <p>
          All people, events, risks, costs, and automated actions are synthetic.
          No Microsoft 365 tenant is connected.
        </p>
      </div>
      <b>DEMO DATA</b>
    </div>
  );
}

function FindingsTable({
  items,
  onOpen,
}: {
  items: Finding[];
  onOpen: (item: Finding) => void;
}) {
  return (
    <div className="data-table findings-data">
      <div className="data-head">
        <span>Finding</span>
        <span>Severity</span>
        <span>Affected</span>
        <span>Risk</span>
        <span>Status</span>
      </div>
      {items.map((item) => (
        <button className="data-row" data-testid={`finding-row-${item.id}`} key={item.id} onClick={() => onOpen(item)}>
          <span className="entity-cell">
            <i className={`entity-icon ${item.severity}`}>
              <ShieldError24Regular />
            </i>
            <span>
              <strong>{item.title}</strong>
              <small>
                {item.id} · {item.category} · {item.owner}
              </small>
            </span>
          </span>
          <span>
            <SeverityPill value={item.severity} />
          </span>
          <span className="number-cell">{item.affected}</span>
          <span>
            <span className="risk-meter">
              <i style={{ width: `${item.riskScore}%` }} />
            </span>
            <b>{item.riskScore}</b>
          </span>
          <span>
            <b className={`status ${item.status.toLowerCase()}`}>
              {item.status}
            </b>
          </span>
        </button>
      ))}
    </div>
  );
}

function CommandCenter({
  onFinding,
  onNavigate,
  notify,
}: {
  onFinding: (f: Finding) => void;
  onNavigate: (n: string) => void;
  notify: (message: string) => void;
}) {
  return (
    <>
      <DemoModePanel notify={notify} />
      <PageHeader
        eyebrow="OVERVIEW / COMMAND CENTER"
        title="Enterprise posture at a glance"
        description="Prioritized intelligence across security, governance, compliance, cost, and operations."
        actions={
          <>
            <span className="sync-state live">
              <i />
              Snapshot · {tenant.demoDate}
            </span>
            <Button onClick={() => onNavigate("Report studio")}>
              <DocumentBulletList24Regular /> Board report
            </Button>
            <Button primary onClick={() => onNavigate("AI analyst")}>
              <Sparkle24Filled /> Ask Aegis AI
            </Button>
          </>
        }
      />
      <div className="metrics-grid">
        <Stat
          label="SECURITY POSTURE"
          value="87/100"
          detail="Live enterprise baseline"
          icon={ShieldCheckmark24Regular}
        />
        <Stat
          label="CRITICAL EXPOSURE"
          value="1"
          detail="6 active findings · 2 overdue"
          icon={ShieldError24Regular}
          tone="red"
        />
        <Stat
          label="COMPLIANCE SCORE"
          value="91%"
          detail="ISO, NIST, CIS and SOC 2"
          icon={ClipboardTask24Regular}
          tone="blue"
        />
        <Stat
          label="SAVINGS OPPORTUNITY"
          value="$150K+"
          detail="modeled annual opportunity"
          icon={MoneyHand24Regular}
          tone="gold"
        />
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Security posture trend"
          subtitle="Weighted control effectiveness and exposure"
        >
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={riskTrend}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--chart-1)" stopOpacity=".28" />
                    <stop offset="1" stopColor="var(--chart-1)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                />
                <YAxis
                  domain={[50, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--chart-tooltip)",
                    border: "1px solid var(--stroke)",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  fill="url(#scoreFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-foot">
            <span>
              <i className="teal-dot" />
              Current <strong>87</strong>
            </span>
            <span>
              Financial services benchmark <strong>71</strong>
            </span>
            <span className="improving">
              <ArrowTrending24Regular /> Improving
            </span>
          </div>
        </Panel>
        <Panel title="Operational pulse" subtitle="Last 24 hours">
          <div className="pulse-grid">
            <div>
              <strong>100</strong>
              <small>Security alerts</small>
              <em className="good">↓ 15%</em>
            </div>
            <div>
              <strong>7,000</strong>
              <small>Managed devices</small>
              <em>92% compliant</em>
            </div>
            <div>
              <strong>47</strong>
              <small>Workflow runs</small>
              <em className="good">46 successful</em>
            </div>
            <div>
              <strong>99.2%</strong>
              <small>Collection SLA</small>
              <em className="warn">Intune delayed</em>
            </div>
          </div>
        </Panel>
      </div>
      <Panel
        title="Priority findings"
        subtitle="Risk-ranked issues requiring executive attention"
        action={
          <button
            className="text-button"
            onClick={() => onNavigate("Security")}
          >
            Open security workspace →
          </button>
        }
      >
        <FindingsTable items={findings.slice(0, 4)} onOpen={onFinding} />
      </Panel>
    </>
  );
}

function SecurityPage({ onFinding }: { onFinding: (f: Finding) => void }) {
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const selected =
    filter === "all" ? findings : findings.filter((f) => f.severity === filter);
  return (
    <>
      <PageHeader
        eyebrow="SECURITY OPERATIONS / DEFENDER XDR"
        title="Security operations center"
        description="Correlated identity, endpoint, application, and data threats with explainable response guidance."
        actions={
          <>
            <Button>
              <ArrowDownload24Regular /> Export incidents
            </Button>
            <Button primary>
              <Play24Regular /> Run investigation
            </Button>
          </>
        }
      />
      <LiveSecurityPanel />
      <div className="metrics-grid">
        <Stat
          label="ACTIVE INCIDENTS"
          value="24"
          detail="3 require immediate action"
          icon={Alert24Regular}
          tone="red"
        />
        <Stat
          label="MEAN TIME TO CONTAIN"
          value="18m"
          detail="↓ 7m from last month"
          icon={ShieldCheckmark24Regular}
        />
        <Stat
          label="RISKY IDENTITIES"
          value="92"
          detail="45 privileged exposures"
          icon={Person24Regular}
          tone="gold"
        />
        <Stat
          label="ALERT FIDELITY"
          value="94.6%"
          detail="1,842 signals correlated"
          icon={DataTrending24Regular}
          tone="blue"
        />
      </div>
      <div className="two-col">
        <Panel
          title="Threat activity"
          subtitle="Alerts correlated into incidents"
        >
          <div className="chart-wrap medium">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrend}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 5"
                />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--chart-tooltip)",
                    border: "1px solid var(--stroke)",
                  }}
                />
                <Area
                  dataKey="alerts"
                  stroke="var(--danger)"
                  fill="color-mix(in srgb, var(--danger) 14%, transparent)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Threat distribution" subtitle="By detection domain">
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { n: "Identity", v: 38 },
                    { n: "Endpoint", v: 27 },
                    { n: "Email", v: 21 },
                    { n: "Cloud apps", v: 14 },
                  ]}
                  dataKey="v"
                  nameKey="n"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                >
                  {colors.map((c) => (
                    <Cell key={c} fill={c} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--chart-tooltip)",
                    border: "1px solid var(--stroke)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>139</strong>
              <small>alerts</small>
            </div>
          </div>
          <div className="legend-row">
            <span>
              <i style={{ background: colors[0] }} />
              Identity 38%
            </span>
            <span>
              <i style={{ background: colors[1] }} />
              Endpoint 27%
            </span>
            <span>
              <i style={{ background: colors[2] }} />
              Email 21%
            </span>
          </div>
        </Panel>
      </div>
      <Panel
        title="Live security signals"
        subtitle="Correlated from local Microsoft 365 telemetry"
      >
        <div className="compact-table">
          <div className="compact-head">
            <span>Time</span>
            <span>Detection</span>
            <span>Entity</span>
            <span>Source</span>
            <span>Severity</span>
            <span>State</span>
          </div>
          {securitySignals.map((s) => (
            <div className="compact-row" key={s.time + s.type}>
              <span>{s.time}</span>
              <strong>{s.type}</strong>
              <span>{s.entity}</span>
              <span>{s.source}</span>
              <SeverityPill value={s.severity} />
              <b className="status active">{s.state}</b>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Exposure findings"
        subtitle="Deterministic rules with evidence and remediation"
      >
        <div className="filter-tabs">
          {(["all", "critical", "high", "medium"] as const).map((v) => (
            <button
              className={filter === v ? "selected" : ""}
              onClick={() => setFilter(v)}
              key={v}
            >
              {v}
            </button>
          ))}
        </div>
        <FindingsTable items={selected} onOpen={onFinding} />
      </Panel>
    </>
  );
}

function IdentityPage() {
  return (
    <>
      <PageHeader
        eyebrow="IDENTITY / ZERO TRUST"
        title="Identity intelligence"
        description="Understand workforce, guest, privilege, authentication, and access risk across every tenant."
        actions={
          <>
            <Button>Access review</Button>
            <Button primary>
              <Key24Regular /> New policy analysis
            </Button>
          </>
        }
      />
      <div className="metrics-grid">
        <Stat
          label="TOTAL IDENTITIES"
          value="5,000"
          detail="4,800 members · 200 guests"
          icon={PeopleTeam24Regular}
        />
        <Stat
          label="PRIVILEGED USERS"
          value="186"
          detail="45 MFA strength gaps"
          icon={Key24Regular}
          tone="red"
        />
        <Stat
          label="MFA COVERAGE"
          value="96.8%"
          detail="401 users incomplete"
          icon={ShieldCheckmark24Regular}
          tone="blue"
        />
        <Stat
          label="DORMANT ACCOUNTS"
          value="214"
          detail="90+ days without activity"
          icon={Person24Regular}
          tone="gold"
        />
      </div>
      <div className="two-col identity-grid">
        <Panel
          title="MFA posture by department"
          subtitle="Authentication-strength coverage"
        >
          <div className="bar-list">
            {departments.map((d) => (
              <div key={d.name}>
                <span>
                  <strong>{d.name}</strong>
                  <small>{d.users.toLocaleString()} identities</small>
                </span>
                <span className="wide-meter">
                  <i style={{ width: `${d.coverage}%` }} />
                </span>
                <b>{d.coverage}%</b>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Identity risk profile" subtitle="Current risk detections">
          <div className="risk-quadrants">
            <div className="critical">
              <strong>9</strong>
              <small>Critical</small>
            </div>
            <div className="high">
              <strong>83</strong>
              <small>High</small>
            </div>
            <div className="medium">
              <strong>276</strong>
              <small>Medium</small>
            </div>
            <div className="low">
              <strong>12,112</strong>
              <small>Low / none</small>
            </div>
          </div>
          <div className="insight-callout">
            <Sparkle24Filled />
            <span>
              <strong>AI insight</strong>
              <p>
                73% of high-risk users are concentrated in Retail Banking and
                Operations.
              </p>
            </span>
          </div>
        </Panel>
      </div>
      <Panel
        title="Identity watchlist"
        subtitle="Users prioritized by privilege, risk, and recent activity"
      >
        <div className="compact-table identity-table">
          <div className="compact-head">
            <span>Identity</span>
            <span>Department</span>
            <span>Risk</span>
            <span>Strongest method</span>
            <span>Activity</span>
            <span>Licenses</span>
          </div>
          {identities.map((i) => (
            <div className="compact-row" key={i.upn}>
              <span className="person-cell">
                <i>
                  {i.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </i>
                <span>
                  <strong>{i.name}</strong>
                  <small>{i.upn}</small>
                </span>
              </span>
              <span>{i.department}</span>
              <SeverityPill value={i.risk} />
              <span>{i.mfa}</span>
              <span>{i.activity}</span>
              <span>{i.licenses}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function CompliancePage() {
  return (
    <>
      <PageHeader
        eyebrow="GOVERNANCE / COMPLIANCE"
        title="Continuous compliance"
        description="Map Microsoft 365 evidence to regulatory obligations and prioritize control remediation."
        actions={
          <>
            <Button>
              <ArrowDownload24Regular /> Evidence pack
            </Button>
            <Button primary>
              <ClipboardTask24Regular /> Start assessment
            </Button>
          </>
        }
      />
      <LiveCompliancePanel />
      <div className="metrics-grid">
        <Stat
          label="OVERALL COMPLIANCE"
          value="86%"
          detail="↑ 2.4% this quarter"
          icon={ClipboardTask24Regular}
        />
        <Stat
          label="FAILED CONTROLS"
          value="41"
          detail="7 critical or high"
          icon={ShieldError24Regular}
          tone="red"
        />
        <Stat
          label="EVIDENCE FRESHNESS"
          value="94%"
          detail="18 items older than 30 days"
          icon={Database24Regular}
          tone="blue"
        />
        <Stat
          label="OPEN EXCEPTIONS"
          value="23"
          detail="5 expire this month"
          icon={Alert24Regular}
          tone="gold"
        />
      </div>
      <Panel
        title="Framework readiness"
        subtitle="Control status and locally collected evidence"
      >
        <div className="framework-grid">
          {controls.map((c, index) => (
            <div className="framework-card" key={c.framework}>
              <div
                className="ring"
                style={
                  {
                    "--score": `${c.score * 3.6}deg`,
                    "--ring-color": colors[index % colors.length],
                  } as React.CSSProperties
                }
              >
                <span>{c.score}%</span>
              </div>
              <div>
                <strong>{c.framework}</strong>
                <small>
                  {c.passed} controls passing · {c.failed} failed
                </small>
                <span>
                  Evidence coverage <b>{c.evidence}%</b>
                </span>
              </div>
              <b
                className={`status ${c.status === "Attention" ? "investigating" : "active"}`}
              >
                {c.status}
              </b>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Control remediation queue"
        subtitle="Failed controls ranked by residual risk"
      >
        <div className="compact-table control-table">
          <div className="compact-head">
            <span>Control</span>
            <span>Requirement</span>
            <span>Framework</span>
            <span>Owner</span>
            <span>Due</span>
            <span>Severity</span>
          </div>
          {failedControls.map((c) => (
            <div className="compact-row" key={c.id}>
              <strong>{c.id}</strong>
              <span>{c.name}</span>
              <span>{c.framework}</span>
              <span>{c.owner}</span>
              <span>{c.due}</span>
              <SeverityPill value={c.severity} />
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function LicensesPage() {
  const total = licenses.reduce((s, l) => s + l.monthly, 0);
  return (
    <>
      <PageHeader
        eyebrow="FINOPS / LICENSE INTELLIGENCE"
        title="License optimization"
        description="Convert usage signals into defensible cost decisions without disrupting business operations."
        actions={
          <>
            <Button>Pricing model</Button>
            <Button primary>
              <MoneyHand24Regular /> Create savings plan
            </Button>
          </>
        }
      />
      <LiveLicensePanel />
      <div className="metrics-grid">
        <Stat
          label="MONTHLY SPEND"
          value="$739K"
          detail="$8.87M annualized"
          icon={MoneyHand24Regular}
          tone="blue"
        />
        <Stat
          label="SAVINGS IDENTIFIED"
          value="$41.8K"
          detail="$501K annual opportunity"
          icon={ArrowTrending24Regular}
        />
        <Stat
          label="UNDERUTILIZED"
          value="1,463"
          detail="Across 5 priority SKUs"
          icon={Alert24Regular}
          tone="gold"
        />
        <Stat
          label="UTILIZATION"
          value="91.7%"
          detail="↑ 1.8% after automation"
          icon={DataTrending24Regular}
          tone="teal"
        />
      </div>
      <div className="two-col license-grid">
        <Panel
          title="Optimization opportunity"
          subtitle="Recoverable monthly value by SKU"
        >
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={licenses}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="sku"
                  width={110}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--chart-tooltip)",
                    border: "1px solid var(--stroke)",
                  }}
                />
                <Bar dataKey="monthly" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Business case" subtitle="Validated opportunity">
          <div className="business-case">
            <span>
              Monthly opportunity<strong>${total.toLocaleString()}</strong>
            </span>
            <span>
              Annualized value<strong>${(total * 12).toLocaleString()}</strong>
            </span>
            <span>
              Users requiring validation<strong>1,463</strong>
            </span>
            <span>
              Automatable after approval<strong>78%</strong>
            </span>
          </div>
          <div className="insight-callout">
            <Sparkle24Filled />
            <span>
              <strong>CFO narrative</strong>
              <p>
                Reclaiming validated dormant assignments would fund the current
                security improvement program within 11 months.
              </p>
            </span>
          </div>
        </Panel>
      </div>
      <Panel
        title="SKU utilization"
        subtitle="Activity-aware allocation analysis"
      >
        <div className="compact-table license-table">
          <div className="compact-head">
            <span>Product</span>
            <span>Purchased</span>
            <span>Assigned</span>
            <span>Active</span>
            <span>Opportunity</span>
            <span>Utilization</span>
          </div>
          {licenses.map((l) => (
            <div className="compact-row" key={l.sku}>
              <strong>{l.sku}</strong>
              <span>{l.purchased.toLocaleString()}</span>
              <span>{l.assigned.toLocaleString()}</span>
              <span>{l.active.toLocaleString()}</span>
              <span>
                {l.waste} · ${l.monthly.toLocaleString()}/mo
              </span>
              <span>
                <span className="wide-meter small">
                  <i style={{ width: `${l.utilization}%` }} />
                </span>{" "}
                {l.utilization}%
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function DigitalTwinPage() {
  const [history, setHistory] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="DATA PLATFORM / DIGITAL TWIN"
        title="Microsoft 365 digital twin"
        description="A temporal, relationship-aware local representation of identities, devices, collaboration, policies, and risk."
        actions={
          <>
            <Button onClick={() => setHistory(!history)}>
              <Database24Regular />{" "}
              {history ? "Current state" : "Show 6 months ago"}
            </Button>
            <Button primary>
              <Search20Regular /> Explore graph
            </Button>
          </>
        }
      />
      {history && (
        <div className="time-banner">
          <Database24Regular />
          <span>
            <strong>Historical snapshot · 15 January 2026</strong> Viewing
            reconstructed tenant state from immutable resource versions.
          </span>
          <button onClick={() => setHistory(false)}>Return to present</button>
        </div>
      )}
      <div className="twin-grid">
        {twinObjects.map((o, index) => {
          const Icon = [
            PeopleTeam24Regular,
            PeopleTeam24Regular,
            Desktop24Regular,
            WindowDevTools24Regular,
            Apps24Regular,
            Database24Regular,
            Mail24Regular,
            ClipboardTask24Regular,
          ][index];
          return (
            <article key={o.type}>
              <span>
                <Icon />
              </span>
              <div>
                <small>{o.type}</small>
                <strong>
                  {history
                    ? o.count.replace(
                        /\d$/,
                        String(Math.max(0, Number(o.count.slice(-1)) - 2)),
                      )
                    : o.count}
                </strong>
                <em>
                  {history
                    ? "Historical snapshot"
                    : o.change + " since last month"}
                </em>
              </div>
              <b>{o.health}% healthy</b>
            </article>
          );
        })}
      </div>
      <div className="two-col twin-panels">
        <Panel
          title="Relationship intelligence"
          subtitle="High-value edges across the tenant"
        >
          <div className="relationship-list">
            {relationships.map((r, i) => (
              <div key={i}>
                <span className="node">{r.from}</span>
                <span className="edge">— {r.relation} →</span>
                <span className="node">{r.to}</span>
                <SeverityPill value={r.risk} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Collection coverage" subtitle="Canonical resource health">
          <div className="bar-list">
            {connectors.map((c) => (
              <div key={c.name}>
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {c.objects} objects · {c.sync} lag
                  </small>
                </span>
                <span className="wide-meter">
                  <i
                    style={{ width: c.status === "Delayed" ? "78%" : "97%" }}
                  />
                </span>
                <b>{c.status}</b>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function ReportsPage({ onPreview }: { onPreview: (name: string) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="REPORTING / EXECUTIVE COMMUNICATION"
        title="Report studio"
        description="Generate evidence-backed operational, regulatory, and executive narratives from the local semantic model."
        actions={
          <>
            <Button>Import template</Button>
            <Button primary>
              <DocumentBulletList24Regular /> Build report
            </Button>
          </>
        }
      />
      <div className="metrics-grid">
        <Stat
          label="REPORTS GENERATED"
          value="184"
          detail="This quarter · 100% local"
          icon={DocumentBulletList24Regular}
        />
        <Stat
          label="SCHEDULED"
          value="27"
          detail="5 deliver today"
          icon={CloudCheckmark24Regular}
          tone="blue"
        />
        <Stat
          label="EXECUTIVE PACKS"
          value="12"
          detail="Board and risk committees"
          icon={PeopleTeam24Regular}
          tone="gold"
        />
        <Stat
          label="EXPORT POLICY"
          value="Compliant"
          detail="All exports audited"
          icon={ShieldCheckmark24Regular}
        />
      </div>
      <div className="template-grid">
        <button onClick={() => onPreview("Board Cyber Risk Briefing")}>
          <span>
            <ShieldCheckmark24Regular />
          </span>
          <strong>Board cyber briefing</strong>
          <small>Posture, material risk, trend, investment</small>
          <em>18-page template →</em>
        </button>
        <button onClick={() => onPreview("Regulatory Evidence Pack")}>
          <span>
            <ClipboardTask24Regular />
          </span>
          <strong>Regulatory evidence pack</strong>
          <small>Controls, evidence, exceptions, owners</small>
          <em>64-page template →</em>
        </button>
        <button onClick={() => onPreview("License Optimization Review")}>
          <span>
            <MoneyHand24Regular />
          </span>
          <strong>CFO optimization review</strong>
          <small>Spend, usage, savings, action plan</small>
          <em>9-page template →</em>
        </button>
        <button onClick={() => onPreview("SOC Operations Review")}>
          <span>
            <Alert24Regular />
          </span>
          <strong>SOC operations review</strong>
          <small>Incidents, response, exposure, SLA</small>
          <em>12-page template →</em>
        </button>
      </div>
      <Panel
        title="Report library"
        subtitle="Scheduled and on-demand publications"
      >
        <div className="compact-table report-table">
          <div className="compact-head">
            <span>Report</span>
            <span>Type</span>
            <span>Schedule</span>
            <span>Owner</span>
            <span>Last generated</span>
            <span>Status</span>
          </div>
          {reports.map((r) => (
            <button
              className="compact-row"
              key={r.name}
              onClick={() => onPreview(r.name)}
            >
              <span>
                <strong>{r.name}</strong>
                <small>{r.pages} pages · PDF / PowerPoint</small>
              </span>
              <span>{r.type}</span>
              <span>{r.schedule}</span>
              <span>{r.owner}</span>
              <span>{r.last}</span>
              <b
                className={`status ${r.status === "Attention" ? "investigating" : "active"}`}
              >
                {r.status}
              </b>
            </button>
          ))}
        </div>
      </Panel>
    </>
  );
}

function AutomationsPage({ notify, roles, username }: { notify: (message: string) => void; roles: PlatformRole[]; username?: string }) {
  const [selected, setSelected] = useState(workflows[0]);
  const [runtimeWorkflows, setRuntimeWorkflows] = useState<RuntimeWorkflow[]>([]);
  const refreshRuntime = async () => {
    try {
      const body = await getRuntimeWorkflows();
      setRuntimeWorkflows(body.items);
      return body.items;
    } catch {
      setRuntimeWorkflows([]);
      return [];
    }
  };
  useEffect(() => { refreshRuntime(); }, []);
  const transition = async (workflow: RuntimeWorkflow, action: "approve" | "reject" | "execute" | "rollback") => {
    try {
      const updated = await transitionRuntimeWorkflow(
        workflow.id,
        action,
        action === "reject" ? "Rejected during organization approval review; revise scope or exception evidence." : `${action} decision recorded from the Automation center.`,
      );
      notify(`${updated.title} moved to ${updated.state.replaceAll("_", " ")}.`);
      if (action === "execute" && updated.state === "running") {
        for (let attempt = 0; attempt < 40; attempt++) {
          await new Promise((resolve) => window.setTimeout(resolve, 200));
          const items = await refreshRuntime();
          const current = items.find((item) => item.id === workflow.id);
          if (current && current.state !== "running") {
            notify(
              current.execution
                ? `${current.title} ${current.state}: ${current.execution.succeeded} changed, ${current.execution.skipped ?? 0} excluded, ${current.execution.affected} evaluated.`
                : `${current.title} moved to ${current.state.replaceAll("_", " ")}.`,
            );
            return;
          }
        }
        notify(`${updated.title} is still running; the queue will refresh when the runtime emits its next result.`);
        return;
      }
      await refreshRuntime();
    } catch (error) { notify(error instanceof Error ? error.message : "Workflow transition failed."); }
  };
  return (
    <>
      <PageHeader
        eyebrow="ORCHESTRATION / CONTROLLED REMEDIATION"
        title="Automation center"
        description="Approval-aware, reversible playbooks transform findings into governed action."
        actions={
          <>
            <Button>Execution history</Button>
            <Button primary>
              <Apps24Regular /> New playbook
            </Button>
          </>
        }
      />
      <div className="metrics-grid">
        <Stat
          label="RUNS THIS MONTH"
          value="1,248"
          detail="97.8% successful"
          icon={Play24Regular}
        />
        <Stat
          label="AWAITING APPROVAL"
          value={String(runtimeWorkflows.filter((item) => item.state === "pending_approval").length)}
          detail="Persistent organization approval queue"
          icon={ClipboardTask24Regular}
          tone="gold"
        />
        <Stat
          label="TIME RETURNED"
          value="418h"
          detail="Estimated analyst capacity"
          icon={ArrowTrending24Regular}
          tone="blue"
        />
        <Stat
          label="ROLLBACKS"
          value="3"
          detail="All completed successfully"
          icon={ShieldCheckmark24Regular}
          tone="teal"
        />
      </div>
      <Panel title="Organization approval queue" subtitle="Requester, approver, execution, and rollback are enforced by signed workforce identity">
        <div className="compact-table report-table">
          <div className="compact-head"><span>Workflow</span><span>Requester</span><span>State</span><span>Approver</span><span>Result</span><span>Allowed action</span></div>
          {runtimeWorkflows.slice(0, 12).map((workflow) => (
            <div className="compact-row" key={workflow.id}>
              <span><strong>{workflow.title}</strong><small>{workflow.sourceFindingId ? `${workflow.sourceFindingId} · ` : ""}{workflow.id.slice(0, 8)}</small></span>
              <span>{workflow.requestedBy}</span>
              <b className="status active">{workflow.state.replaceAll("_", " ")}</b>
              <span>{workflow.approver ?? "Not assigned"}</span>
              <span>{workflow.execution ? `${workflow.execution.succeeded} changed${workflow.execution.skipped ? ` · ${workflow.execution.skipped} excluded` : ""} / ${workflow.execution.affected} evaluated` : "Not executed"}</span>
              <span>
                {workflow.state === "pending_approval" && roles.some((role) => ["platform-admin", "security-admin"].includes(role)) && workflow.requestedBy !== username && <><button onClick={() => transition(workflow, "approve")}>Approve</button><button onClick={() => transition(workflow, "reject")}>Reject</button></>}
                {workflow.state === "approved" && roles.some((role) => ["platform-admin", "m365-admin"].includes(role)) && <button onClick={() => transition(workflow, "execute")}>Execute</button>}
                {workflow.state === "completed" && roles.some((role) => ["platform-admin", "m365-admin"].includes(role)) && <button onClick={() => transition(workflow, "rollback")}>Rollback</button>}
                {workflow.state === "pending_approval" && workflow.requestedBy === username && <small>Independent approver required</small>}
                {!(["pending_approval", "approved", "completed"].includes(workflow.state)) && <small>No action</small>}
              </span>
            </div>
          ))}
          {!runtimeWorkflows.length && <p>No persistent workflows are visible for this role.</p>}
        </div>
      </Panel>
      <div className="automation-layout">
        <Panel title="Playbook catalog" subtitle="Select a workflow to inspect">
          <div className="workflow-list">
            {workflows.map((w) => (
              <button
                className={selected.name === w.name ? "selected" : ""}
                key={w.name}
                onClick={() => setSelected(w)}
              >
                <span>
                  <i className={w.state.toLowerCase()} />
                  <strong>{w.name}</strong>
                  <small>{w.trigger}</small>
                </span>
                <span>
                  <b>{w.runs}</b>
                  <small>runs</small>
                </span>
                <span>
                  <b>{w.success}%</b>
                  <small>success</small>
                </span>
              </button>
            ))}
          </div>
        </Panel>
        <Panel
          title={selected.name}
          subtitle={`Trigger: ${selected.trigger}`}
          action={
            <button
              className="primary-button"
              onClick={() =>
                notify(
                  `Dry run started for “${selected.name}” using synthetic demo entities.`,
                )
              }
            >
              <Play24Regular /> Dry run
            </button>
          }
        >
          <div className="workflow-canvas">
            {selected.steps.map((s, i) => (
              <div key={s}>
                <span>{i + 1}</span>
                <strong>{s}</strong>
                <small>
                  {i === 0
                    ? "Automatic evaluation"
                    : i === 1
                      ? "Separation of duties"
                      : "Idempotent action"}
                </small>
                {i < selected.steps.length - 1 && <i>↓</i>}
              </div>
            ))}
          </div>
          <div className="workflow-meta">
            <span>
              Value realized <strong>{selected.savings}</strong>
            </span>
            <span>
              Rollback <strong>Enabled</strong>
            </span>
            <span>
              Audit <strong>Immutable</strong>
            </span>
          </div>
        </Panel>
      </div>
    </>
  );
}

function AIPage({ notify }: { notify: (m: string) => void }) {
  const [query, setQuery] = useState(
    "Why did our security posture change this month?",
  );
  const [answer, setAnswer] = useState<{ answer: string; recommendations: string[]; sources: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async (question = query) => {
    if (!question.trim()) return;
    setLoading(true);
    try { setAnswer(await askDemoAi(question)); }
    catch (error) { notify(error instanceof Error ? error.message : "AI simulation failed."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void submit(query); }, []);
  return (
    <>
      <PageHeader
        eyebrow="PRIVATE AI / GROUNDED INTELLIGENCE"
        title="Aegis AI analyst"
        description="Ask questions across authorized local data. Responses are grounded, role-aware, filtered, and audited."
      />
      <div className="ai-layout">
        <aside className="ai-sidebar">
          <strong>Suggested analysis</strong>
          {aiPrompts.map((p) => (
            <button
              key={p}
              onClick={() => {
                setQuery(p);
                void submit(p);
              }}
            >
              <Sparkle24Filled />
              {p}
            </button>
          ))}
          <div>
            <ShieldCheckmark24Regular />
            <span>
              <strong>Sovereign inference</strong>
              <small>
                Phi model · local Ollama
                <br />
                No external data transfer
              </small>
            </span>
          </div>
        </aside>
        <section className="ai-conversation">
          <div className="ai-hero">
            <span>
              <Bot24Regular />
            </span>
            <h2>What would you like to understand?</h2>
            <p>
              I can analyze risk, explain changes, build reports, and draft
              governed workflows using this tenant’s authorized evidence.
            </p>
          </div>
          {answer && (
            <>
              <div className="chat user">
                <span>AM</span>
                <p>{query}</p>
              </div>
              <div className="chat assistant">
                <span>
                  <Sparkle24Filled />
                </span>
                <div>
                  <p>{answer.answer}</p>
                  <strong>Recommended actions</strong>
                  <ul>
                    {answer.recommendations.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                  <div className="ai-sources">
                    <strong>Grounded sources</strong>
                    {answer.sources.map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          notify(
                            `${s} evidence opened with lineage and freshness metadata.`,
                          )
                        }
                      >
                        <Database24Regular />
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="ai-actions">
                    <Button
                      onClick={() =>
                        notify(
                          "A governed workflow draft was created from this analysis.",
                        )
                      }
                    >
                      <DocumentBulletList24Regular /> Create report
                    </Button>
                    <Button>
                      <Apps24Regular /> Draft workflow
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="ai-input">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setAnswer(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ask about risk, compliance, cost, or operations…"
            />
            <button onClick={() => void submit()} disabled={loading} aria-busy={loading}>
              <Sparkle24Filled /> {loading ? "Analyzing…" : "Analyze"}
            </button>
            <small>
              <ShieldCheckmark24Regular /> RBAC filtered · Sensitive data masked
              · Interaction audited
            </small>
          </div>
        </section>
      </div>
    </>
  );
}

function AdminPage({ notify }: { notify: (m: string) => void }) {
  const [tab, setTab] = useState("Connectors");
  const [organizationUsers, setOrganizationUsers] = useState<Array<{ username: string; name: string; title: string; roles: PlatformRole[] }>>([]);
  useEffect(() => {
    fetch("/api/auth/users", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((body) => setOrganizationUsers(body.items))
      .catch(() => setOrganizationUsers([]));
  }, []);
  const tabs = [
    "Connectors",
    "Access control",
    "Audit",
    "Data protection",
    "Infrastructure",
  ];
  return (
    <>
      <PageHeader
        eyebrow="PLATFORM / ADMINISTRATION"
        title="Platform administration"
        description="Operate tenant connectivity, identity, data protection, audit, and local infrastructure."
        actions={
          <Button
            primary
            onClick={() =>
              notify(
                "Configuration validation completed: 42 passed, 1 advisory.",
              )
            }
          >
            Validate configuration
          </Button>
        }
      />
      <div className="admin-tabs">
        {tabs.map((item) => (
          <button
            key={item}
            className={tab === item ? "selected" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="metrics-grid">
        <Stat
          label="PLATFORM HEALTH"
          value="Healthy"
          detail="14 of 15 services nominal"
          icon={CloudCheckmark24Regular}
        />
        <Stat
          label="COLLECTION SLA"
          value="99.2%"
          detail="Intune currently delayed"
          icon={DataTrending24Regular}
          tone="gold"
        />
        <Stat
          label="AUDIT INTEGRITY"
          value="Verified"
          detail="Last chain check 08:00"
          icon={ShieldCheckmark24Regular}
          tone="blue"
        />
        <Stat
          label="BACKUP RPO"
          value="8m"
          detail="Target below 15 minutes"
          icon={Database24Regular}
        />
      </div>
      {tab === "Connectors" && (
        <Panel
          title="Microsoft 365 connectors"
          subtitle="Certificate-authenticated collection boundaries"
        >
          <div className="connector-grid">
            {connectors.map((c) => (
              <article key={c.name}>
                <span>
                  <CloudCheckmark24Regular />
                </span>
                <div>
                  <strong>{c.name}</strong>
                  <small>{c.scope}</small>
                  <em>{c.objects} normalized objects</em>
                </div>
                <div>
                  <b
                    className={`status ${c.status === "Delayed" ? "investigating" : "active"}`}
                  >
                    {c.status}
                  </b>
                  <small>{c.sync} ago</small>
                </div>
                <button
                  aria-label={`Open ${c.name} connector actions`}
                  title={`Open ${c.name} connector actions`}
                  onClick={() =>
                    notify(`${c.name} connection test passed in demo mode.`)
                  }
                >
                  <MoreHorizontal20Regular />
                </button>
              </article>
            ))}
          </div>
        </Panel>
      )}
      {tab === "Audit" && (
        <Panel
          title="Immutable audit activity"
          subtitle="Administrative and automated actions"
        >
          <div className="compact-table audit-table">
            <div className="compact-head">
              <span>Time</span>
              <span>Actor</span>
              <span>Action</span>
              <span>Object</span>
              <span>Result</span>
              <span>Source</span>
            </div>
            {auditEvents.map((a) => (
              <div className="compact-row" key={a.time}>
                <span>{a.time}</span>
                <strong>{a.actor}</strong>
                <code>{a.action}</code>
                <span>{a.object}</span>
                <span>{a.result}</span>
                <span>{a.ip}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {tab === "Access control" && (
        <Panel
          title="Role-based access control"
          subtitle="Least-privilege personas and scoped administration"
        >
          <div className="connector-grid">
            {organizationUsers.map((user) => (
              <article key={user.username}>
                <span>
                  <ShieldCheckmark24Regular />
                </span>
                <div>
                  <strong>{user.name}</strong>
                  <small>{user.username}</small>
                  <em>{user.roles.map((role) => roleLabels[role]).join(", ")}</em>
                </div>
                <button
                  aria-label={`Review access for ${user.name}`}
                  title={`Review access for ${user.name}`}
                  onClick={() => notify(`${user.name} access review opened with ${user.roles.length} assigned role.`)}
                >
                  <MoreHorizontal20Regular />
                </button>
              </article>
            ))}
          </div>
        </Panel>
      )}
      {tab === "Data protection" && (
        <Panel
          title="Data protection controls"
          subtitle="Encryption, masking, retention, and evidence integrity"
        >
          <div className="connector-grid">
            {[
              ["Encryption at rest", "AES-256", "Verified"],
              [
                "Sensitive data masking",
                "12 governed field classes",
                "Enforced",
              ],
              ["Immutable retention", "7-year compliance archive", "Locked"],
              ["Customer-managed keys", "Rotation due in 46 days", "Healthy"],
            ].map((control) => (
              <article key={control[0]}>
                <span>
                  <LockClosed24Regular />
                </span>
                <div>
                  <strong>{control[0]}</strong>
                  <small>{control[1]}</small>
                  <em>{control[2]}</em>
                </div>
                <button
                  aria-label={`Open ${control[0]} control details`}
                  title={`Open ${control[0]} control details`}
                  onClick={() =>
                    notify(`${control[0]} control details verified.`)
                  }
                >
                  <MoreHorizontal20Regular />
                </button>
              </article>
            ))}
          </div>
        </Panel>
      )}
      {tab === "Infrastructure" && (
        <Panel
          title="Local infrastructure"
          subtitle="Runtime, queues, storage, and recovery services"
        >
          <div className="connector-grid">
            {[
              ["Web application", "Port 3008", "Healthy"],
              ["Evidence database", "28.4 TB protected", "Healthy"],
              ["Collection workers", "14 of 15 nominal", "Advisory"],
              ["Recovery service", "RPO 8m / RTO 34m", "Ready"],
            ].map((service) => (
              <article key={service[0]}>
                <span>
                  <CloudCheckmark24Regular />
                </span>
                <div>
                  <strong>{service[0]}</strong>
                  <small>{service[1]}</small>
                  <em>{service[2]}</em>
                </div>
                <button
                  aria-label={`Run ${service[0]} diagnostic`}
                  title={`Run ${service[0]} diagnostic`}
                  onClick={() => notify(`${service[0]} diagnostic completed.`)}
                >
                  <MoreHorizontal20Regular />
                </button>
              </article>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

function FindingDrawer({
  finding,
  caseView,
  loading,
  canModify,
  onClose,
  onAssign,
  onRemediation,
  onOpenWorkflow,
}: {
  finding: Finding;
  caseView: RuntimeFindingCaseView | null;
  loading: boolean;
  canModify: boolean;
  onClose: () => void;
  onAssign: () => void;
  onRemediation: () => void;
  onOpenWorkflow: () => void;
}) {
  const caseState = caseView?.case;
  const caseStatus = caseState?.status.replaceAll("_", " ") ?? finding.status;
  const linkedWorkflowState = caseView?.remediationWorkflow?.state;
  const hasActiveRemediation = Boolean(
    linkedWorkflowState &&
      !["failed", "rejected", "rolled_back"].includes(linkedWorkflowState),
  );
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <aside
        className="detail-drawer"
        data-testid={`finding-drawer-${finding.id}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <span>
            <SeverityPill value={finding.severity} />
            <small>{finding.id}</small>
          </span>
          <button aria-label="Close finding" onClick={onClose}>×</button>
        </div>
        <h2>{finding.title}</h2>
        <p className="drawer-sub">
          {finding.category} · Evidence observed {tenant.demoDate}
        </p>
        <div className="risk-summary">
          <div>
            <small>Risk score</small>
            <strong>
              {finding.riskScore}
              <em>/100</em>
            </strong>
          </div>
          <div>
            <small>Affected</small>
            <strong>{finding.affected}</strong>
          </div>
          <div>
            <small>Status</small>
            <strong className="finding-case-status">{caseStatus}</strong>
          </div>
        </div>
        <section>
          <h3>Business impact</h3>
          <p>{finding.impact}</p>
        </section>
        <section>
          <h3>Evidence</h3>
          <div className="evidence-box">
            <Database24Regular />
            <p>{finding.evidence}</p>
            <b>Verified local snapshot</b>
          </div>
        </section>
        <section>
          <h3>Recommended action</h3>
          <p>{finding.recommendation}</p>
        </section>
        <section>
          <h3>Required action workflow</h3>
          <ol className="finding-required-actions">
            {(
              finding.id === "FND-1029"
                ? [
                    "Assign a FinOps owner, priority, due date, and accountability note.",
                    "Review all 87 candidates for leave, service-account, legal-hold, dependency, and business exceptions.",
                    "Save the remediation plan or submit it for an independent approval decision.",
                    "After approval, an M365 administrator executes the eligible cohort; excluded assignments remain licensed.",
                    "Verify per-assignment outcomes, realized savings, audit evidence, and rollback readiness.",
                  ]
                : [
                    "Assign an accountable owner and due date.",
                    "Validate affected objects and record approved exceptions.",
                    "Submit a governed remediation plan for independent approval.",
                    "Execute, verify the result, and retain rollback evidence.",
                  ]
            ).map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}
          </ol>
        </section>
        <section>
          <h3>Control mappings</h3>
          <div className="tag-list">
            {finding.framework.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
        </section>
        <section>
          <h3>Accountability</h3>
          <div className="owner-row">
            <span>
              Control owner<strong>{finding.owner}</strong>
            </span>
            <span>
              Automation
              <strong>
                {finding.automation
                  ? "Available · approval required"
                  : "Manual response"}
              </strong>
            </span>
          </div>
        </section>
        <section className="finding-case-section" aria-busy={loading}>
          <h3>Finding case</h3>
          {loading && <p>Loading tenant-scoped assignment and workflow state…</p>}
          {!loading && caseState && (
            <>
              <div className="finding-case-grid">
                <span>
                  Assignee
                  <strong>{caseState.assignee?.displayName ?? "Not assigned"}</strong>
                  <small>{caseState.assignee?.team ?? "Select an accountable owner"}</small>
                </span>
                <span>
                  Priority
                  <strong>{caseState.priority ?? "Not set"}</strong>
                  <small>{caseState.dueAt ? `Due ${new Date(caseState.dueAt).toLocaleDateString()}` : "No due date"}</small>
                </span>
              </div>
              {caseState.note && <p className="finding-case-note">{caseState.note}</p>}
              {caseState.remediationWorkflowId && (
                <button className="linked-workflow" data-testid="linked-workflow" onClick={onOpenWorkflow}>
                  <Apps24Regular />
                  <span>
                    <strong>Remediation workflow</strong>
                    <small>{caseState.remediationWorkflowId} · {caseStatus}</small>
                  </span>
                  Open in Automations
                </button>
              )}
            </>
          )}
        </section>
        {!!caseState?.activity.length && (
          <section data-testid="finding-activity">
            <h3>Activity history</h3>
            <div className="finding-activity">
              {[...caseState.activity].reverse().map((item) => (
                <article key={item.id}>
                  <i />
                  <span>
                    <strong>{item.summary}</strong>
                    <small>{item.actorId} · {new Date(item.occurredAt).toLocaleString()}</small>
                  </span>
                </article>
              ))}
            </div>
          </section>
        )}
        <div className="drawer-actions">
          <Button
            data-testid="assign-finding"
            disabled={loading || !canModify}
            title={!canModify ? "Your organization role has read-only finding access." : "Assign an accountable owner"}
            onClick={onAssign}
          >
            {caseState?.assignee ? "Reassign finding" : "Assign finding"}
          </Button>
          {finding.automation && (
            <Button
              primary
              data-testid="draft-remediation"
              disabled={loading || !canModify || hasActiveRemediation || !caseState?.assignee}
              title={
                !canModify
                  ? "Your organization role cannot create remediation workflows."
                  : !caseState?.assignee
                    ? "Assign an accountable owner before creating remediation."
                  : hasActiveRemediation
                    ? "An active remediation workflow is already linked."
                    : linkedWorkflowState
                      ? `Create a revised remediation after ${linkedWorkflowState.replaceAll("_", " ")}.`
                      : "Create a governed remediation plan"
              }
              onClick={onRemediation}
            >
              <Apps24Regular /> Draft remediation
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

const findingAssignees = [
  { id: "omar.rahman@apex.local", name: "Omar Rahman", team: "FinOps" },
  { id: "fatima.noor@apex.local", name: "Fatima Noor", team: "M365 Operations" },
  { id: "amira.malik@apex.local", name: "Amira Malik", team: "Compliance Office" },
  { id: "nadia.almasi@apex.local", name: "Nadia Almasi", team: "Security Operations" },
];

function FindingActionDialog({
  finding,
  mode,
  onClose,
  onAssign,
  onRemediation,
}: {
  finding: Finding;
  mode: "assign" | "remediation";
  onClose: () => void;
  onAssign: (value: {
    assigneeId: string;
    assigneeName: string;
    team: string;
    priority: "low" | "medium" | "high" | "urgent";
    dueAt: string;
    note: string;
  }) => Promise<void>;
  onRemediation: (value: {
    title: string;
    targetScope: string;
    justification: string;
    exceptionReview: string[];
    submitForApproval: boolean;
  }) => Promise<void>;
}) {
  const [assigneeId, setAssigneeId] = useState(findingAssignees[0].id);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">(
    finding.severity === "critical" ? "urgent" : finding.severity === "high" ? "high" : "medium",
  );
  const [dueAt, setDueAt] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [note, setNote] = useState(`Validate the ${finding.affected} affected objects and document business exceptions before action.`);
  const [title, setTitle] = useState(`Remediate ${finding.id}: ${finding.title}`);
  const [targetScope, setTargetScope] = useState(`${finding.affected} evidence-backed ${finding.category.toLowerCase()} objects from ${finding.id}`);
  const [justification, setJustification] = useState(finding.recommendation);
  const [exceptions, setExceptions] = useState<string[]>(
    finding.category === "Licensing"
      ? ["leave", "service_accounts", "legal_hold"]
      : ["business_exceptions", "dependencies"],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const execute = async (submitForApproval = false) => {
    setBusy(true);
    setError("");
    try {
      if (mode === "assign") {
        const assignee = findingAssignees.find((item) => item.id === assigneeId)!;
        await onAssign({
          assigneeId: assignee.id,
          assigneeName: assignee.name,
          team: assignee.team,
          priority,
          dueAt: new Date(`${dueAt}T17:00:00.000Z`).toISOString(),
          note,
        });
      } else {
        await onRemediation({ title, targetScope, justification, exceptionReview: exceptions, submitForApproval });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The finding action failed.");
    } finally {
      setBusy(false);
    }
  };
  const submitAssignment = (event: FormEvent) => {
    event.preventDefault();
    void execute();
  };
  const toggleException = (value: string) =>
    setExceptions((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);

  return (
    <div className="modal-backdrop action-modal-backdrop" onMouseDown={onClose}>
      <div
        className="action-dialog finding-action-dialog"
        data-testid={mode === "assign" ? "assignment-dialog" : "remediation-dialog"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span>{mode === "assign" ? <Person24Regular /> : <Apps24Regular />}</span>
          <div>
            <small>{finding.id} · GOVERNED FINDING ACTION</small>
            <h2>{mode === "assign" ? "Assign accountable ownership" : "Create remediation workflow"}</h2>
            <p>{finding.title}</p>
          </div>
          <button aria-label="Close finding action" onClick={onClose}>×</button>
        </header>
        {mode === "assign" ? (
          <form onSubmit={submitAssignment}>
            <section className="action-form">
              <label>
                Assignee
                <select data-testid="assignment-assignee" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                  {findingAssignees.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.team}</option>)}
                </select>
              </label>
              <label>
                Priority
                <select data-testid="assignment-priority" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </label>
              <label>
                Due date
                <input data-testid="assignment-due" type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} required value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
              </label>
              <label>
                Team
                <input data-testid="assignment-team" readOnly value={findingAssignees.find((item) => item.id === assigneeId)?.team ?? ""} />
              </label>
              <label>
                Assignment note
                <textarea data-testid="assignment-note" required maxLength={600} value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
            </section>
            {error && <p className="action-error" role="alert">{error}</p>}
            <footer>
              <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
              <button className="primary-button" data-testid="save-assignment" disabled={busy} type="submit">{busy ? "Assigning…" : "Save assignment"}</button>
            </footer>
          </form>
        ) : (
          <>
            <section className="action-form">
              <label>Workflow title<input data-testid="remediation-title" required value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label>Target scope<input data-testid="remediation-scope" required value={targetScope} onChange={(event) => setTargetScope(event.target.value)} /></label>
              <label>Justification<textarea data-testid="remediation-justification" required value={justification} onChange={(event) => setJustification(event.target.value)} /></label>
            </section>
            <section>
              <h3>Mandatory exception review</h3>
              <div className="exception-review">
                {[
                  ["leave", "Leave / absence"],
                  ["service_accounts", "Service accounts"],
                  ["legal_hold", "Legal hold"],
                  ["dependencies", "Workload dependencies"],
                  ["business_exceptions", "Business exceptions"],
                ].map(([value, label]) => (
                  <label key={value}><input type="checkbox" checked={exceptions.includes(value)} onChange={() => toggleException(value)} /> {label}</label>
                ))}
              </div>
            </section>
            <div className="action-warning"><ShieldCheckmark24Regular /><span><strong>No live Microsoft 365 change occurs at this step</strong><small>The plan is persisted locally and must pass independent approval before execution.</small></span></div>
            {error && <p className="action-error" role="alert">{error}</p>}
            <footer>
              <button className="secondary-button" onClick={onClose}>Cancel</button>
              <button className="secondary-button" data-testid="create-remediation-draft" disabled={busy || !title || !targetScope || !justification} onClick={() => void execute(false)}>{busy ? "Saving…" : "Save draft"}</button>
              <button className="primary-button" data-testid="submit-remediation" disabled={busy || !title || !targetScope || !justification} onClick={() => void execute(true)}>{busy ? "Submitting…" : "Submit for approval"}</button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function ReportPreview({
  name,
  onClose,
}: {
  name: string;
  onClose: () => void;
}) {
  const executiveReport = generateCustomReport(
    name,
    "Defender XDR",
    ["Decision", "Business owner", "Status", "Target date"],
    [
      [
        "Complete phishing-resistant MFA for 45 privileged identities",
        "CISO / IAM",
        "In progress",
        "31 Jul 2026",
      ],
      [
        "Approve staged external-sharing governance program",
        "Data Governance",
        "Approval required",
        "22 Jul 2026",
      ],
      [
        "Endorse annual license optimization plan",
        "CIO / Finance",
        "Decision required",
        "18 Jul 2026",
      ],
      [
        "Close Intune compliance baseline gaps",
        "Endpoint Operations",
        "Remediating",
        "25 Jul 2026",
      ],
    ],
  );
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="report-preview" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            <small>APEX FINANCIAL GROUP · CONFIDENTIAL</small>
            <h2>{name}</h2>
            <p>Executive intelligence briefing · {tenant.demoDate}</p>
          </div>
          <button onClick={onClose}>×</button>
        </header>
        <div className="preview-body">
          <div className="preview-score">
            <span>Enterprise posture</span>
            <strong>78</strong>
            <em>Improving</em>
          </div>
          <div>
            <h3>Executive summary</h3>
            <p>
              Security posture improved for a second consecutive month. Identity
              assurance and unmanaged sharing remain the most material residual
              risks. Remediation already in progress is expected to raise the
              posture score to 84.
            </p>
            <h3>Decisions requested</h3>
            <ul>
              <li>
                Sponsor phishing-resistant authentication completion for 45
                privileged identities.
              </li>
              <li>Approve the staged external-sharing governance program.</li>
              <li>Endorse the $501K annual license optimization plan.</li>
            </ul>
          </div>
        </div>
        <footer>
          <span>Generated locally from governed evidence · Demo content</span>
          <Button onClick={() => exportReportExcel(executiveReport)}>
            <ArrowDownload24Regular /> Export Excel
          </Button>
          <Button onClick={() => exportReportPdf(executiveReport)}>
            <ArrowDownload24Regular /> Export PDF
          </Button>
        </footer>
      </div>
    </div>
  );
}

type DemoAction = {
  title: string;
  description: string;
  kind: "create" | "review" | "configure" | "execute";
};
const actionDescriptions: Record<string, DemoAction> = {
  "Dashboard library": {
    title: "Dashboard library",
    description:
      "Browse published, personal, and role-assigned dashboards with owners and version history.",
    kind: "review",
  },
  "Run investigation": {
    title: "Start governed investigation",
    description:
      "Create a correlated security case, assign an owner, preserve evidence, and begin SLA tracking.",
    kind: "execute",
  },
  "Access review": {
    title: "Start identity access review",
    description:
      "Select identities, reviewers, recurrence, fallback decisions, and escalation policy.",
    kind: "create",
  },
  "New policy analysis": {
    title: "Conditional Access policy analysis",
    description:
      "Model policy coverage and exclusions against the local identity and sign-in digital twin.",
    kind: "create",
  },
  "Delivery history": {
    title: "Alert delivery history",
    description:
      "Inspect notification attempts, provider receipts, retries, suppressions, and escalation outcomes.",
    kind: "review",
  },
  "+ New alert policy": {
    title: "Create alert policy",
    description:
      "Choose a governed signal, conditions, severity, suppression, enrichment, recipients, and response SLA.",
    kind: "create",
  },
  "Job history": {
    title: "Management job history",
    description:
      "Review dry runs, approvals, executions, failures, rollbacks, and immutable evidence.",
    kind: "review",
  },
  "New custom job": {
    title: "Create governed management job",
    description:
      "Select an action, tenant scope, objects, approval route, execution window, and rollback policy.",
    kind: "create",
  },
  "Execution history": {
    title: "Automation execution history",
    description:
      "Inspect playbook runs, approvals, step results, compensations, and evidence.",
    kind: "review",
  },
  "New playbook": {
    title: "Create automation playbook",
    description:
      "Compose triggers, conditions, approvals, actions, verification, notifications, and rollback steps.",
    kind: "create",
  },
  "Export queue": {
    title: "Report export queue",
    description:
      "Monitor generated files, classifications, encryption, delivery, expiry, and download audit.",
    kind: "review",
  },
  "Advanced filters": {
    title: "Advanced report filters",
    description:
      "Build nested AND/OR conditions, relative dates, entity scopes, saved segments, and parameter prompts.",
    kind: "configure",
  },
  "Policy library": {
    title: "Governance policy library",
    description:
      "Manage naming, ownership, sharing, lifecycle, expiration, request, and exception policies.",
    kind: "review",
  },
  "+ New request": {
    title: "New governance request",
    description:
      "Request a governed Team, site, guest extension, sharing exception, retention exception, or application consent.",
    kind: "create",
  },
  "Message templates": {
    title: "Reminder message templates",
    description:
      "Manage localized email and Teams templates, variables, branding, escalation tone, and approval.",
    kind: "review",
  },
  "New agent": {
    title: "Create follow-up agent",
    description:
      "Define audience, completion evidence, cadence, escalation, quiet hours, and owner.",
    kind: "create",
  },
  "Access reviews": {
    title: "Delegated access reviews",
    description:
      "Review role members, scope, capabilities, activity, conflicts, expiry, and reviewer decisions.",
    kind: "review",
  },
  "+ Create delegated role": {
    title: "Create delegated role",
    description:
      "Select resource scope, permitted reports, actions, export rights, expiry, and separation-of-duties policy.",
    kind: "create",
  },
  "Collector settings": {
    title: "Hybrid collector settings",
    description:
      "Configure forest targets, service identity, certificates, schedules, sites, and health thresholds.",
    kind: "configure",
  },
  "Explore graph": {
    title: "Digital twin graph explorer",
    description:
      "Traverse identities, groups, devices, applications, collaboration resources, policies, and risks at a selected point in time.",
    kind: "review",
  },
  "Import template": {
    title: "Import report template",
    description:
      "Upload and validate a signed report definition without importing credentials or executable code.",
    kind: "create",
  },
  "Build report": {
    title: "Build executive report",
    description:
      "Select an approved narrative template, evidence period, audience, sections, and export policy.",
    kind: "create",
  },
  "Pricing model": {
    title: "License pricing model",
    description:
      "Configure contract currency, regional prices, commitments, discounts, renewal dates, and chargeback rules.",
    kind: "configure",
  },
  "Create savings plan": {
    title: "Create license savings plan",
    description:
      "Validate candidates, exceptions, owners, approval waves, notifications, rollback, and realized value.",
    kind: "create",
  },
  "Start assessment": {
    title: "Start compliance assessment",
    description:
      "Choose frameworks, organizational scope, evidence window, control owners, exceptions, and due dates.",
    kind: "create",
  },
  "Generate campaign": {
    title: "Generate adoption campaign",
    description:
      "Select an adoption segment, desired behavior, communication sequence, training, and success measure.",
    kind: "create",
  },
  "Show proof in product →": {
    title: "Product proof navigator",
    description:
      "Open the workspace and evidence that proves this differentiator during the client demonstration.",
    kind: "review",
  },
};

function ActionDialog({
  action,
  onClose,
  onComplete,
  onSaveDraft,
  onExecute,
}: {
  action: DemoAction;
  onClose: () => void;
  onComplete: (message: string) => void;
  onSaveDraft: (
    action: DemoAction,
    scope: string,
    justification: string,
    owner: string,
  ) => Promise<string>;
  onExecute: (
    action: DemoAction,
    scope: string,
    justification: string,
    owner: string,
  ) => Promise<string>;
}) {
  const [scope, setScope] = useState("Global Enterprise Holdings · Demo tenant");
  const [owner, setOwner] = useState("Alex Morgan");
  const [justification, setJustification] = useState(
    "First end-to-end acceptance execution of the governed product workflow.",
  );
  const [executing, setExecuting] = useState(false);
  const [actionError, setActionError] = useState("");
  return (
    <div className="modal-backdrop action-modal-backdrop" onMouseDown={onClose}>
      <div className="action-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <span>
            <Apps24Regular />
          </span>
          <div>
            <small>{action.kind.toUpperCase()} WORKFLOW</small>
            <h2>{action.title}</h2>
            <p>{action.description}</p>
          </div>
          <button onClick={onClose}>×</button>
        </header>
        <section>
          <h3>Scope and accountability</h3>
          <div className="action-form">
            <label>
              Target scope
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option>Global Enterprise Holdings · Demo tenant</option>
                <option>Security Operations business unit</option>
                <option>UAE regional scope</option>
              </select>
            </label>
            <label>
              Owner
              <input value={owner} onChange={(e) => setOwner(e.target.value)} />
            </label>
            <label>
              Change justification
              <textarea
                value={justification}
                onChange={(event) => setJustification(event.target.value)}
              />
            </label>
          </div>
        </section>
        <section>
          <h3>Governed execution path</h3>
          <div className="action-steps">
            {[
              "Validate authorization and scope",
              "Generate local preview or dry run",
              "Capture required approval",
              "Execute persistent local operation",
              "Verify result and record audit evidence",
            ].map((step, index) => (
              <span key={step}>
                <b>{index + 1}</b>
                {step}
                <CheckmarkCircle24Regular />
              </span>
            ))}
          </div>
        </section>
        <div className="action-warning">
          <ShieldCheckmark24Regular />
          <span>
            <strong>Persistent acceptance runtime</strong>
            <small>
              Authorization, dry run, independent approval, execution, result,
              and chained audit evidence are persisted locally. Microsoft 365
              changes remain disabled until tenant credentials are configured.
            </small>
          </span>
        </div>
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="secondary-button"
            disabled={executing || !scope || !owner || !justification}
            onClick={async () => {
              setExecuting(true);
              setActionError("");
              try {
                onComplete(await onSaveDraft(action, scope, justification, owner));
              } catch (error) {
                setActionError(error instanceof Error ? error.message : "Workflow draft could not be saved.");
              } finally {
                setExecuting(false);
              }
            }}
          >
            <Save24Regular /> Save draft
          </button>
          <button
            className="primary-button"
            disabled={executing}
            onClick={async () => {
              setExecuting(true);
              setActionError("");
              try {
                onComplete(await onExecute(action, scope, justification, owner));
              } catch (error) {
                setActionError(error instanceof Error ? error.message : "Workflow runtime failed.");
              } finally {
                setExecuting(false);
              }
            }}
          >
            <Play24Regular />
            {executing ? "Submitting workflow..." : "Submit for approval"}
          </button>
        </footer>
        {actionError && <p className="action-error" role="alert">{actionError}</p>}
      </div>
    </div>
  );
}

const shellExportLabels = [
  "Export incidents",
  "Export evidence",
  "Evidence pack",
  "Adoption pack",
  "Export proposal",
] as const;

type ShellExportLabel = (typeof shellExportLabels)[number];
type ProposalAssumptions = {
  users: number;
  admins: number;
  hourlyRate: number;
  toolOverlap: number;
};

const defaultProposalAssumptions: ProposalAssumptions = {
  users: 12500,
  admins: 18,
  hourlyRate: 75,
  toolOverlap: 180000,
};

function isShellExportLabel(value: string): value is ShellExportLabel {
  return shellExportLabels.some((label) => label === value);
}

function readProposalAssumptions(container: HTMLElement): ProposalAssumptions {
  const values = Array.from(
    container.querySelectorAll<HTMLInputElement>(".roi-inputs input[type='number']"),
  ).map((input) => Number(input.value));
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return defaultProposalAssumptions;
  }
  return {
    users: values[0],
    admins: values[1],
    hourlyRate: values[2],
    toolOverlap: values[3],
  };
}

function createShellExportReport(
  label: ShellExportLabel,
  proposal: ProposalAssumptions = defaultProposalAssumptions,
): GeneratedReport {
  const generatedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date());
  const base = {
    id: `LOCAL-${label.toUpperCase().replace(/[^A-Z]+/g, "-")}-${Date.now()}`,
    generatedAt,
    sourceFreshness: "Verified local synthetic snapshot",
  };

  if (label === "Export incidents") {
    return {
      ...base,
      name: "Security Incident Register - Local Demo Snapshot",
      workload: "Microsoft Defender XDR",
      description:
        "Synthetic incident evidence generated and retained inside this local demonstration instance.",
      totalRows: String(securitySignals.length),
      columns: ["Observed", "Detection", "Entity", "Source", "Severity", "State"],
      rows: securitySignals.map((signal) => [
        signal.time,
        signal.type,
        signal.entity,
        signal.source,
        signal.severity,
        signal.state,
      ]),
      metrics: [
        { label: "Active incidents", value: "24", detail: "3 require immediate action" },
        {
          label: "High / critical",
          value: String(securitySignals.filter((signal) => ["High", "Critical"].includes(signal.severity)).length),
          detail: "Signals included in this extract",
        },
        { label: "Mean time to contain", value: "18m", detail: "Seven minutes faster month over month" },
        { label: "Alert fidelity", value: "94.6%", detail: "1,842 signals correlated locally" },
      ],
    };
  }

  if (label === "Export evidence") {
    return {
      ...base,
      name: "Unified Audit Evidence Extract - Local Demo Snapshot",
      workload: "Microsoft 365 Unified Audit",
      description:
        "Synthetic normalized activities exported from the local audit evidence workspace.",
      totalRows: String(auditActivities.length),
      columns: ["Time", "Workload", "Activity", "Actor", "Target", "Result", "Risk", "Location"],
      rows: auditActivities.map((activity) => [
        activity.time,
        activity.workload,
        activity.activity,
        activity.actor,
        activity.target,
        activity.result,
        activity.risk,
        activity.location,
      ]),
      metrics: [
        { label: "Evidence events", value: String(auditActivities.length), detail: "Normalized local records" },
        {
          label: "Workloads",
          value: String(new Set(auditActivities.map((activity) => activity.workload)).size),
          detail: "Microsoft 365 services represented",
        },
        {
          label: "High / critical",
          value: String(auditActivities.filter((activity) => ["High", "Critical"].includes(activity.risk)).length),
          detail: "Priority events in extract",
        },
        { label: "Data boundary", value: "LOCAL", detail: "Synthetic evidence; no customer data" },
      ],
    };
  }

  if (label === "Evidence pack") {
    return {
      ...base,
      name: "Continuous Compliance Evidence Pack - Local Demo Snapshot",
      workload: "Microsoft Purview and Compliance",
      description:
        "Synthetic control exceptions and evidence status assembled locally for assessment review.",
      totalRows: String(failedControls.length),
      columns: ["Control", "Framework", "Exception", "Owner", "Due", "Severity", "Evidence state"],
      rows: failedControls.map((control) => [
        control.id,
        control.framework,
        control.name,
        control.owner,
        control.due,
        control.severity,
        "Review required",
      ]),
      metrics: [
        { label: "Overall compliance", value: "86%", detail: "Synthetic assessment posture" },
        { label: "Failed controls", value: "41", detail: "7 critical or high" },
        { label: "Evidence freshness", value: "94%", detail: "18 items older than 30 days" },
        { label: "Frameworks", value: String(controls.length), detail: "ISO, NIST, CIS, SOC 2 and GDPR" },
      ],
    };
  }

  if (label === "Adoption pack") {
    return {
      ...base,
      name: "Microsoft 365 Adoption and Value Pack - Local Demo Snapshot",
      workload: "Microsoft 365 Usage Analytics",
      description:
        "Synthetic service adoption, utilization depth, and opportunity data generated locally.",
      totalRows: String(adoption.length),
      columns: ["Service", "Active users", "Eligible users", "Adoption", "Trend", "Usage depth"],
      rows: adoption.map((service) => [
        service.service,
        service.active.toLocaleString("en-US"),
        service.eligible.toLocaleString("en-US"),
        `${service.adoption}%`,
        `${service.trend > 0 ? "+" : ""}${service.trend}%`,
        `${service.depth}%`,
      ]),
      metrics: [
        { label: "Active users", value: "11,942", detail: "95.7% of synthetic workforce" },
        { label: "Collaboration index", value: "82/100", detail: "Up 4.2 points this quarter" },
        { label: "Low-adoption users", value: "1,284", detail: "Six campaigns recommended" },
        { label: "License value realized", value: "91.7%", detail: "USD 28K equivalent uplift" },
      ],
    };
  }

  const hoursReturned = Math.round(proposal.admins * 22 * 12 * 0.48);
  const administrativeCapacity = hoursReturned * proposal.hourlyRate;
  const licenseOptimization = Math.round(proposal.users * 3.34 * 12);
  const totalAnnualValue = administrativeCapacity + licenseOptimization + proposal.toolOverlap;
  return {
    ...base,
    name: "Aegis M365 Illustrative Business Value Proposal",
    workload: "Executive Value Engineering",
    description:
      "Illustrative local business case; validate pricing, labor allocation, and adoption assumptions with the client.",
    totalRows: "4",
    columns: ["Value lever", "Model assumption", "Annual value", "Client validation required"],
    rows: [
      [
        "Administrative capacity",
        `${proposal.admins} admins; 48% of 22 hours/month`,
        `$${administrativeCapacity.toLocaleString("en-US")}`,
        "Validate loaded rate and recoverable hours",
      ],
      [
        "License optimization",
        `${proposal.users.toLocaleString("en-US")} users; $3.34/user/month`,
        `$${licenseOptimization.toLocaleString("en-US")}`,
        "Validate SKU mix and reclaim eligibility",
      ],
      [
        "Tool consolidation",
        "Current annual overlap",
        `$${proposal.toolOverlap.toLocaleString("en-US")}`,
        "Validate contracts and retirement dates",
      ],
      [
        "Illustrative total",
        "Capacity plus hard-dollar opportunity",
        `$${totalAnnualValue.toLocaleString("en-US")}`,
        "Approve benefits baseline before commitment",
      ],
    ],
    metrics: [
      { label: "Estimated annual value", value: `$${totalAnnualValue.toLocaleString("en-US")}`, detail: "Illustrative, not a contractual commitment" },
      { label: "Capacity returned", value: `${hoursReturned.toLocaleString("en-US")}h`, detail: "Annual administrative capacity" },
      { label: "Users modeled", value: proposal.users.toLocaleString("en-US"), detail: "Current on-screen proposal input" },
      { label: "Illustrative payback", value: "11 months", detail: "Validate against final commercial terms" },
    ],
  };
}

export default function Home() {
  const [active, setActive] = useState("Command center");
  const [sidebar, setSidebar] = useState(false);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [findingCase, setFindingCase] = useState<RuntimeFindingCaseView | null>(null);
  const [findingCaseLoading, setFindingCaseLoading] = useState(false);
  const [findingAction, setFindingAction] = useState<"assign" | "remediation" | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const [action, setAction] = useState<DemoAction | null>(null);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ShellNotification[]>(DEFAULT_NOTIFICATIONS);
  const [lightTheme, setLightTheme] = useState(true);
  const [runtimeOnline, setRuntimeOnline] = useState(false);
  const [runtimeEvents, setRuntimeEvents] = useState(0);
  const [identity, setIdentity] = useState<{ username: string; name: string; title: string; tenantId: string; roles: PlatformRole[] } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const notify = (message: string) => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => {
      setToast("");
      toastTimer.current = null;
    }, 4000);
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  };
  const navigateTo = (label: string) => {
    setActive(label);
    setGlobalQuery("");
    const slug = slugFor(label);
    if (window.location.hash !== `#${slug}`)
      window.history.pushState(null, "", `#${slug}`);
  };
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Session unavailable")))
      .then(setIdentity)
      .catch(() => window.location.assign("/login"));
  }, []);
  useEffect(() => {
    if (!finding) {
      setFindingCase(null);
      setFindingAction(null);
      return;
    }
    let current = true;
    setFindingCaseLoading(true);
    getRuntimeFindingCase(finding.id)
      .then((value) => {
        if (current) setFindingCase(value);
      })
      .catch((error) => {
        if (current) notify(error instanceof Error ? error.message : "Finding case could not be loaded.");
      })
      .finally(() => {
        if (current) setFindingCaseLoading(false);
      });
    return () => {
      current = false;
    };
  }, [finding?.id]);
  const availableNavigation = useMemo(
    () => identity ? allNavigation.filter((item) => canOpenModule(identity.roles, item.label)) : allNavigation.filter((item) => item.label === "Command center"),
    [identity],
  );
  const visibleGroups = useMemo(
    () => navGroups.map((group) => ({ ...group, items: group.items.filter((item) => availableNavigation.some((allowed) => allowed.label === item.label)) })).filter((group) => group.items.length),
    [availableNavigation],
  );
  useEffect(() => {
    if (identity && !canOpenModule(identity.roles, active)) setActive("Command center");
  }, [identity, active]);
  useEffect(() => {
    const sync = () => {
      const slug = window.location.hash.slice(1);
      const match = availableNavigation.find((item) => slugFor(item.label) === slug);
      if (match) setActive(match.label);
    };
    sync();
    const savedTheme = localStorage.getItem("aegis.theme");
    setLightTheme(savedTheme === null || savedTheme === "light");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [availableNavigation]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Array<{ id?: unknown; read?: unknown }>;
      if (!Array.isArray(saved)) throw new Error("Invalid notification state");
      setNotifications(
        DEFAULT_NOTIFICATIONS.map((item) => ({
          ...item,
          read:
            saved.find((candidate) => candidate.id === item.id)?.read === true,
        })),
      );
    } catch {
      localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    }
  }, []);
  useEffect(() => {
    const stream = new EventSource(runtimeEventUrl());
    stream.onopen = () => setRuntimeOnline(true);
    stream.onmessage = () => setRuntimeEvents((count) => count + 1);
    stream.onerror = () => setRuntimeOnline(false);
    return () => stream.close();
  }, []);
  const toggleTheme = () =>
    setLightTheme((value) => {
      const next = !value;
      localStorage.setItem("aegis.theme", next ? "light" : "dark");
      return next;
    });
  const updateNotifications = (
    update: (current: ShellNotification[]) => ShellNotification[],
  ) =>
    setNotifications((current) => {
      const next = update(current);
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const handleGlobalAction = async (event: React.MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button || button.closest("nav") || button.dataset.localAction === "true") return;
    const text = (button.textContent || button.getAttribute("aria-label") || "")
      .trim()
      .replace(/\s+/g, " ");
    if (isShellExportLabel(text)) {
      const generatedReport = createShellExportReport(
        text,
        text === "Export proposal"
          ? readProposalAssumptions(event.currentTarget)
          : undefined,
      );
      notify(`${text} PDF is being generated from the verified local synthetic snapshot.`);
      try {
        await exportReportPdf(generatedReport);
        notify(`${text} generated and downloaded locally as a populated PDF.`);
      } catch (error) {
        notify(
          error instanceof Error
            ? `${text} failed: ${error.message}`
            : `${text} could not be generated.`,
        );
      }
      return;
    }
    if (text === "Create report") {
      navigateTo("Custom reports");
      notify("Custom report builder opened.");
      return;
    }
    const mapped = actionDescriptions[text];
    if (mapped) setAction(mapped);
  };
  const globalResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return { modules: [], reports: [] };
    return {
      modules: availableNavigation
        .filter((item) => item.label.toLowerCase().includes(q))
        .slice(0, 5),
      reports: reportCatalogue
        .filter((item) =>
          `${item.name} ${item.workload} ${item.category}`
            .toLowerCase()
            .includes(q),
        )
        .slice(0, 5),
    };
  }, [globalQuery, availableNavigation]);
  const page = useMemo(() => {
    switch (active) {
      case "Security":
        return <SecurityPage onFinding={setFinding} />;
      case "Identity":
        return <IdentityPage />;
      case "Compliance":
        return <CompliancePage />;
      case "Licenses":
        return <LicensesPage />;
      case "Digital twin":
        return <DigitalTwinPage />;
      case "Report studio":
        return <ReportsPage onPreview={setReport} />;
      case "Automations":
        return <AutomationsPage notify={notify} roles={identity?.roles ?? []} username={identity?.username} />;
      case "AI analyst":
        return <AIPage notify={notify} />;
      case "Administration":
        return <AdminPage notify={notify} />;
      case "Connection center":
      case "Customer portal":
      case "Super Admin":
        return <CommercialWorkspaces page={active} notify={notify} />;
      case "Explorer 360":
        return <User360Workspace notify={notify} />;
      case "Reporting":
      case "Auditing":
      case "Management":
      case "Usage analytics":
      case "Governance":
      case "Alerts":
      case "Reminders":
      case "Delegation":
      case "Hybrid AD":
        return (
          <SuiteWorkspace
            page={active}
            notify={notify}
            roles={identity?.roles ?? []}
          />
        );
      case "Custom reports":
      case "Dashboard designer":
      case "Configuration":
      case "Value center":
        return <ProductStudio page={active} notify={notify} />;
      default:
        return <CommandCenter onFinding={setFinding} onNavigate={navigateTo} notify={notify} />;
    }
  }, [active, identity]);
  return (
    <div
      className={`app-shell ${lightTheme ? "light-theme" : ""}`}
      onClickCapture={handleGlobalAction}
    >
      <aside className={`sidebar suite-sidebar ${sidebar ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheckmark24Regular />
          </span>
          <span>
            <strong>Aegis</strong>
            <small>M365 Intelligence</small>
          </span>
        </div>
        <nav aria-label="Primary navigation">
          {visibleGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="workspace-label">{group.label}</div>
              {group.items.map(({ label, icon: Icon, badge }) => (
                <button
                  key={label}
                  className={active === label ? "active" : ""}
                  onClick={() => {
                    navigateTo(label);
                    setSidebar(false);
                  }}
                >
                  <Icon />
                  <span>{label}</span>
                  {badge && <em>{badge}</em>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-badge">
            <CloudCheckmark24Regular />
            <span>
              <strong>Sovereign demo</strong>
              <small>All processing local</small>
            </span>
            <i />
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setSidebar(!sidebar)}
          >
            <Navigation20Regular />
          </button>
          <button
            className="tenant-switch"
            onClick={() => setTenantOpen((value) => !value)}
          >
            <span className="tenant-avatar">{tenant.short}</span>
            <span>
              <strong>{tenant.name}</strong>
              <small>
                {tenant.industry} · {tenant.region}
              </small>
            </span>
            <ChevronDown16Regular />
          </button>
          {tenantOpen && (
            <div className="topbar-popover tenant-popover">
              <strong>AUTHORIZED TENANTS</strong>
              <button className="selected" onClick={() => setTenantOpen(false)}>
                <span className="tenant-avatar">AF</span>
                <span>
                  <b>Global Enterprise Holdings</b>
                  <small>Primary · UAE North · Healthy</small>
                </span>
                <CheckmarkCircle24Regular />
              </button>
              <button
                onClick={() => {
                  setTenantOpen(false);
                  notify(
                    "Northstar subsidiary tenant opened in read-only demo mode.",
                  );
                }}
              >
                <span className="tenant-avatar">NS</span>
                <span>
                  <b>Northstar Subsidiary</b>
                  <small>Secondary · Europe · Read only</small>
                </span>
                <ChevronDown16Regular />
              </button>
              <button
                onClick={() => {
                  setTenantOpen(false);
                  setAction({
                    title: "Connect Microsoft 365 tenant",
                    description:
                      "Register tenant ownership, certificate identity, least-privilege consent, collection scope, and retention policy.",
                    kind: "configure",
                  });
                }}
              >
                + Connect another tenant
              </button>
            </div>
          )}
          <div className="global-search-wrap">
            <label className="global-search">
              <Search20Regular />
              <input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Search modules and 947 report templates…"
              />
              <kbd>⌘ K</kbd>
            </label>
            {globalQuery && (
              <div className="global-results">
                <strong>WORKSPACES</strong>
                {globalResults.modules.map(({ label, icon: Icon }) => (
                  <button key={label} onClick={() => navigateTo(label)}>
                    <Icon />
                    <span>{label}</span>
                    <small>Open workspace</small>
                  </button>
                ))}
                <strong>REPORTS</strong>
                {globalResults.reports.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigateTo("Reporting");
                      notify(
                        `${item.name} selected in the reporting catalogue.`,
                      );
                    }}
                  >
                    <DocumentBulletList24Regular />
                    <span>{item.name}</span>
                    <small>{item.workload}</small>
                  </button>
                ))}
                {!globalResults.modules.length &&
                  !globalResults.reports.length && (
                    <p>No modules or reports match “{globalQuery}”.</p>
                  )}
              </div>
            )}
          </div>
          <button className="ask-ai" onClick={() => navigateTo("AI analyst")}>
            <Sparkle24Filled />
            Ask Aegis AI
          </button>
          <span
            className={`runtime-live ${runtimeOnline ? "online" : "offline"}`}
          >
            <i />
            {runtimeOnline
              ? `Runtime live · ${runtimeEvents} events`
              : "Runtime offline"}
          </span>
          {identity && (
            <span className="runtime-live online" title={identity.roles.map((role) => roleLabels[role]).join(", ")}>
              <ShieldCheckmark24Regular /> {roleLabels[identity.roles[0]]}
            </span>
          )}
          <button
            className="icon-button"
            aria-label="Theme"
            onClick={toggleTheme}
          >
            <WeatherMoon24Regular />
          </button>
          <button
            className="icon-button alert-button"
            aria-label="Notifications"
            title={`${unreadNotifications} unread notifications`}
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Alert24Regular />
            {unreadNotifications > 0 && <i />}
          </button>
          {notificationsOpen && (
            <div className="topbar-popover notification-popover">
              <header>
                <div>
                  <strong>Notification center</strong>
                  <small>{unreadNotifications} unread · Local event stream</small>
                </div>
                <button
                  onClick={() => {
                    updateNotifications((current) =>
                      current.map((item) => ({ ...item, read: true })),
                    );
                    setNotificationsOpen(false);
                    notify("All notifications marked as read and saved in this browser.");
                  }}
                >
                  Mark all read
                </button>
              </header>
              {notifications.map((item) => (
                <button
                  key={item.id}
                  className={item.read ? "read" : undefined}
                  onClick={() => {
                    updateNotifications((current) =>
                      current.map((candidate) =>
                        candidate.id === item.id
                          ? { ...candidate, read: true }
                          : candidate,
                      ),
                    );
                    setNotificationsOpen(false);
                    if (availableNavigation.some((module) => module.label === item.target)) {
                      navigateTo(item.target);
                      notify(`${item.title} opened in ${item.target}.`);
                    } else {
                      navigateTo("Command center");
                      notify(`${item.title} acknowledged. Your role cannot open ${item.target}.`);
                    }
                  }}
                >
                  {!item.read && <i />}
                  <span>
                    <b>{item.title}</b>
                    <small>{item.detail}</small>
                  </span>
                  <em>{item.time}</em>
                </button>
              ))}
            </div>
          )}
          <button
            className="profile"
            title={`Sign out ${identity?.name ?? "current user"}`}
            aria-label="Sign out"
            onClick={logout}
          >
            {identity?.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "--"}
          </button>
        </header>
        <section className="content presentation-content">
          {page}
          <footer>
            <span>
              <ShieldCheckmark24Regular /> Sovereign demonstration · Synthetic
              data · No external processing
            </span>
            <span>Aegis M365 Platform · 360° Client Showcase 2026</span>
          </footer>
        </section>
      </main>
      {finding && (
        <FindingDrawer
          finding={finding}
          caseView={findingCase}
          loading={findingCaseLoading}
          canModify={!!identity && canRunChanges(identity.roles)}
          onClose={() => setFinding(null)}
          onAssign={() => setFindingAction("assign")}
          onRemediation={() => setFindingAction("remediation")}
          onOpenWorkflow={() => {
            setFinding(null);
            navigateTo("Automations");
            notify("Linked remediation opened in the Automation approval queue.");
          }}
        />
      )}
      {finding && findingAction && (
        <FindingActionDialog
          finding={finding}
          mode={findingAction}
          onClose={() => setFindingAction(null)}
          onAssign={async (assignment) => {
            const updated = await assignRuntimeFinding(finding.id, assignment);
            setFindingCase(updated);
            setFindingAction(null);
            notify(`${finding.id} assigned to ${assignment.assigneeName}; ownership and audit history persisted.`);
          }}
          onRemediation={async (remediation) => {
            const updated = await createRuntimeFindingRemediation(finding.id, remediation);
            setFindingCase(updated);
            setFindingAction(null);
            notify(
              remediation.submitForApproval
                ? `${finding.id} remediation submitted for independent approval.`
                : `${finding.id} remediation draft persisted and linked to the finding.`,
            );
          }}
        />
      )}
      {report && (
        <ReportPreview name={report} onClose={() => setReport(null)} />
      )}{" "}
      {action && (
        <ActionDialog
          action={action}
          onClose={() => setAction(null)}
          onComplete={(message) => {
            setAction(null);
            notify(message);
          }}
          onSaveDraft={async (selectedAction, scope, justification, owner) => {
            if (!identity || !canRunChanges(identity.roles)) throw new Error("Your assigned organization role cannot create workflow drafts.");
            const workflow = await createRuntimeWorkflowDraft(
              selectedAction.title,
              scope,
              justification,
              `module-${selectedAction.kind}`,
              owner,
            );
            return `${selectedAction.title} draft ${workflow.id} saved for ${owner}.`;
          }}
          onExecute={async (selectedAction, scope, justification, owner) => {
            if (!identity || !canRunChanges(identity.roles)) throw new Error("Your assigned organization role cannot submit change workflows.");
            const workflow = await runRuntimeWorkflow(
              selectedAction.title,
              scope,
              justification,
              `module-${selectedAction.kind}`,
              owner,
            );
            if (workflow.state !== "pending_approval") throw new Error(workflow.execution?.message ?? `Workflow ended in ${workflow.state}.`);
            return `${selectedAction.title} submitted for independent approval. Workflow ID ${workflow.id}.`;
          }}
        />
      )}
      {toast && (
        <div className="toast">
          <CheckmarkCircle24Regular />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

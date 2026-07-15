"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
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
import { reportCatalogue } from "@/data/suite";
import { ProductStudio } from "@/components/ProductStudio";
import {
  exportReportExcel,
  exportReportPdf,
  generateCustomReport,
} from "@/lib/reporting";

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
      { label: "AI analyst", icon: Bot24Regular },
      { label: "Configuration", icon: Settings24Regular },
      { label: "Administration", icon: Settings24Regular },
    ],
  },
];
const allNavigation = navGroups.flatMap((group) => group.items);
const slugFor = (label: string) =>
  label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const colors = ["#49cbb2", "#62a9ea", "#a888e6", "#e8b458", "#ef6b72"];
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
}: {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={primary ? "primary-button" : "secondary-button"}
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
        <button className="data-row" key={item.id} onClick={() => onOpen(item)}>
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
}: {
  onFinding: (f: Finding) => void;
  onNavigate: (n: string) => void;
}) {
  return (
    <>
      <DemoNotice />
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
          value="78/100"
          detail="↗ 3.2% this month"
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
          value="86%"
          detail="428 of 497 controls passing"
          icon={ClipboardTask24Regular}
          tone="blue"
        />
        <Stat
          label="SAVINGS OPPORTUNITY"
          value="$41.8K"
          detail="per month · 1,463 assignments"
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
                    <stop offset="0" stopColor="#49cbb2" stopOpacity=".35" />
                    <stop offset="1" stopColor="#49cbb2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#253c48"
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8195a1", fontSize: 11 }}
                />
                <YAxis
                  domain={[50, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8195a1", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#142832",
                    border: "1px solid #29434f",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#49cbb2"
                  strokeWidth={3}
                  fill="url(#scoreFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-foot">
            <span>
              <i className="teal-dot" />
              Current <strong>78</strong>
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
              <strong>139</strong>
              <small>Security alerts</small>
              <em className="good">↓ 15%</em>
            </div>
            <div>
              <strong>18.9K</strong>
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
                  stroke="#253c48"
                  strokeDasharray="3 5"
                />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#142832",
                    border: "1px solid #29434f",
                  }}
                />
                <Area
                  dataKey="alerts"
                  stroke="#ef6b72"
                  fill="#ef6b7222"
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
                    background: "#142832",
                    border: "1px solid #29434f",
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
          value="12,480"
          detail="11,816 members · 664 guests"
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
                <CartesianGrid horizontal={false} stroke="#253c48" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="sku"
                  width={110}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ab0b8", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#142832",
                    border: "1px solid #29434f",
                  }}
                />
                <Bar dataKey="monthly" fill="#49cbb2" radius={[0, 5, 5, 0]} />
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

function AutomationsPage({ notify }: { notify: (message: string) => void }) {
  const [selected, setSelected] = useState(workflows[0]);
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
          value="14"
          detail="3 expire within 24 hours"
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
  const [answered, setAnswered] = useState(true);
  const submit = () => {
    if (query.trim()) setAnswered(true);
  };
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
                setAnswered(true);
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
          {answered && (
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
                  <p>{aiAnswer.summary}</p>
                  <strong>Key insights</strong>
                  <ul>
                    {aiAnswer.insights.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                  <div className="ai-sources">
                    <strong>Grounded sources</strong>
                    {aiAnswer.sources.map((s) => (
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
                setAnswered(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ask about risk, compliance, cost, or operations…"
            />
            <button onClick={submit}>
              <Sparkle24Filled /> Analyze
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
            {[
              [
                "Platform Administrator",
                "4 members",
                "Full configuration, no evidence deletion",
              ],
              [
                "Security Operator",
                "12 members",
                "Investigations and guarded remediation",
              ],
              [
                "Report Author",
                "28 members",
                "Semantic models and approved exports",
              ],
              [
                "Executive Viewer",
                "41 members",
                "Masked, read-only decision intelligence",
              ],
            ].map((role) => (
              <article key={role[0]}>
                <span>
                  <ShieldCheckmark24Regular />
                </span>
                <div>
                  <strong>{role[0]}</strong>
                  <small>{role[2]}</small>
                  <em>{role[1]}</em>
                </div>
                <button
                  onClick={() => notify(`${role[0]} access review opened.`)}
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
  onClose,
  onAction,
}: {
  finding: Finding;
  onClose: () => void;
  onAction: (m: string) => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <aside className="detail-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <span>
            <SeverityPill value={finding.severity} />
            <small>{finding.id}</small>
          </span>
          <button onClick={onClose}>×</button>
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
            <strong>{finding.status}</strong>
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
              Owner<strong>{finding.owner}</strong>
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
        <div className="drawer-actions">
          <Button
            onClick={() =>
              onAction(
                `${finding.id} assigned to the current investigation queue.`,
              )
            }
          >
            Assign finding
          </Button>
          <Button
            primary
            onClick={() =>
              onAction(
                `Remediation workflow drafted for ${finding.id}; no live action was performed.`,
              )
            }
          >
            <Apps24Regular /> Draft remediation
          </Button>
        </div>
      </aside>
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
}: {
  action: DemoAction;
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const [scope, setScope] = useState("Apex Financial Group · Demo tenant");
  const [owner, setOwner] = useState("Alex Morgan");
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
                <option>Apex Financial Group · Demo tenant</option>
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
              <textarea defaultValue="Client demonstration of the governed product workflow." />
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
              "Execute simulated demo operation",
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
            <strong>Safe demonstration mode</strong>
            <small>
              No Microsoft 365 resource will be changed. The completed result is
              stored only in the local presentation session.
            </small>
          </span>
        </div>
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="secondary-button"
            onClick={() =>
              onComplete(`${action.title} draft saved for ${owner}.`)
            }
          >
            <Save24Regular /> Save draft
          </button>
          <button
            className="primary-button"
            onClick={() =>
              onComplete(
                `${action.title} completed successfully in safe demo mode.`,
              )
            }
          >
            <Play24Regular /> Run demo workflow
          </button>
        </footer>
      </div>
    </div>
  );
}

function downloadDemoFile(label: string) {
  const content = `Aegis M365 Platform\n${label}\nGenerated: ${new Date().toISOString()}\nTenant: Apex Financial Group\nClassification: Confidential · Synthetic demo data\n\nThis locally generated demonstration artifact contains no customer Microsoft 365 data.\n`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `aegis-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [active, setActive] = useState("Command center");
  const [sidebar, setSidebar] = useState(false);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const [action, setAction] = useState<DemoAction | null>(null);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lightTheme, setLightTheme] = useState(false);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4000);
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
    const sync = () => {
      const slug = window.location.hash.slice(1);
      const match = allNavigation.find((item) => slugFor(item.label) === slug);
      if (match) setActive(match.label);
    };
    sync();
    setLightTheme(localStorage.getItem("aegis.theme") === "light");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const toggleTheme = () =>
    setLightTheme((value) => {
      const next = !value;
      localStorage.setItem("aegis.theme", next ? "light" : "dark");
      return next;
    });
  const handleGlobalAction = (event: React.MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button || button.closest("nav")) return;
    const text = (button.textContent || button.getAttribute("aria-label") || "")
      .trim()
      .replace(/\s+/g, " ");
    if (
      [
        "Export incidents",
        "Export evidence",
        "Export proposal",
        "Adoption pack",
        "Evidence pack",
      ].includes(text)
    ) {
      downloadDemoFile(text);
      notify(`${text} generated and downloaded locally.`);
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
      modules: allNavigation
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
  }, [globalQuery]);
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
        return <AutomationsPage notify={notify} />;
      case "AI analyst":
        return <AIPage notify={notify} />;
      case "Administration":
        return <AdminPage notify={notify} />;
      case "Explorer 360":
      case "Reporting":
      case "Auditing":
      case "Management":
      case "Usage analytics":
      case "Governance":
      case "Alerts":
      case "Reminders":
      case "Delegation":
      case "Hybrid AD":
        return <SuiteWorkspace page={active} notify={notify} />;
      case "Custom reports":
      case "Dashboard designer":
      case "Configuration":
      case "Value center":
        return <ProductStudio page={active} notify={notify} />;
      default:
        return <CommandCenter onFinding={setFinding} onNavigate={navigateTo} />;
    }
  }, [active]);
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
          {navGroups.map((group) => (
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
                  <b>Apex Financial Group</b>
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
                placeholder="Search modules and 947 reports…"
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
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Alert24Regular />
            <i />
          </button>
          {notificationsOpen && (
            <div className="topbar-popover notification-popover">
              <header>
                <div>
                  <strong>Notification center</strong>
                  <small>4 unread · Local event stream</small>
                </div>
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    notify("All notifications marked as read.");
                  }}
                >
                  Mark all read
                </button>
              </header>
              {[
                ["Critical identity finding", "45 privileged MFA gaps", "2m"],
                ["Intune collection delayed", "18 minutes behind SLA", "6m"],
                [
                  "Workflow awaiting approval",
                  "License reclamation · 87 users",
                  "18m",
                ],
                ["Scheduled report ready", "Board Cyber Risk Briefing", "1h"],
              ].map(([title, detail, time]) => (
                <button
                  key={title}
                  onClick={() => {
                    setNotificationsOpen(false);
                    notify(`${title} opened.`);
                  }}
                >
                  <i />
                  <span>
                    <b>{title}</b>
                    <small>{detail}</small>
                  </span>
                  <em>{time}</em>
                </button>
              ))}
            </div>
          )}
          <button
            className="profile"
            title="Sign out Alex Morgan"
            aria-label="Sign out"
            onClick={logout}
          >
            AM
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
          onClose={() => setFinding(null)}
          onAction={(m) => {
            notify(m);
            setFinding(null);
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

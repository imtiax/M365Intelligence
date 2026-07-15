"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Alert24Regular,
  Apps24Regular,
  ArrowDownload24Regular,
  ArrowSync24Regular,
  CalendarClock24Regular,
  CheckmarkCircle24Regular,
  ChevronRight20Regular,
  ClipboardTask24Regular,
  CloudCheckmark24Regular,
  DataTrending24Regular,
  Database24Regular,
  Desktop24Regular,
  DocumentBulletList24Regular,
  Filter24Regular,
  Folder24Regular,
  Key24Regular,
  Mail24Regular,
  MoneyHand24Regular,
  PeopleTeam24Regular,
  Person24Regular,
  Play24Regular,
  Search20Regular,
  Settings24Regular,
  ShieldCheckmark24Regular,
  ShieldError24Regular,
  Sparkle24Filled,
  WindowDevTools24Regular,
} from "@fluentui/react-icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  adoption,
  alertPolicies,
  auditActivities,
  delegatedRoles,
  governanceRequests,
  hybridHealth,
  managementActions,
  reminderAgents,
  reportCatalogue,
  suiteModules,
  type CatalogueReport,
} from "@/data/suite";
import { GeneratedReportViewer } from "@/components/GeneratedReportViewer";
import {
  dashboardFor,
  generateCatalogueReport,
  type GeneratedReport,
} from "@/lib/reporting";

type Props = { page: string; notify: (message: string) => void };

function Header({
  path,
  title,
  description,
  children,
}: {
  path: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading suite-page-heading">
      <div>
        <div className="eyebrow">{path}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
function Btn({
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
function Card({
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
    <article className={`panel suite-card ${className}`}>
      <header>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </article>
  );
}
function Kpi({
  label,
  value,
  detail,
  tone = "teal",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <article className={`suite-kpi ${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
      <i />
    </article>
  );
}
function Risk({ value }: { value: string }) {
  return (
    <b className={`severity ${value.toLowerCase()}`}>
      <i />
      {value}
    </b>
  );
}
function DemoTag() {
  return (
    <span className="suite-demo-tag">
      <Sparkle24Filled /> SYNTHETIC DEMO DATA
    </span>
  );
}

function Explorer({ notify }: { notify: (m: string) => void }) {
  const [query, setQuery] = useState("");
  const visible = suiteModules.filter((m) =>
    `${m.name} ${m.family} ${m.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <Header
        path="MICROSOFT 365 / EXPLORER 360"
        title="Microsoft 365 Explorer"
        description="One operational map across every workload, object, relationship, report, and management surface."
      >
        <DemoTag />
        <Btn
          primary
          onClick={() =>
            notify("Cross-workload inventory refresh queued in demo mode.")
          }
        >
          <ArrowSync24Regular /> Refresh inventory
        </Btn>
      </Header>
      <div className="explorer-hero">
        <div>
          <span>360°</span>
          <div>
            <small>LOCAL DIGITAL TWIN COVERAGE</small>
            <strong>99.2%</strong>
            <p>
              158,482 normalized objects · 1.8M relationships · 947 intelligence
              reports
            </p>
          </div>
        </div>
        <div className="explorer-search">
          <Search20Regular />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a workload, resource type, report, or control…"
          />
          <kbd>947 reports</kbd>
        </div>
      </div>
      <div className="suite-module-grid">
        {visible.map((m, index) => {
          const icons = [
            Key24Regular,
            Mail24Regular,
            PeopleTeam24Regular,
            Folder24Regular,
            CloudCheckmark24Regular,
            Desktop24Regular,
            ShieldError24Regular,
            ClipboardTask24Regular,
            MoneyHand24Regular,
            Database24Regular,
          ];
          const Icon = icons[index % suiteModules.length];
          return (
            <article
              key={m.name}
              style={{ "--module-accent": m.accent } as React.CSSProperties}
            >
              <header>
                <span>
                  <Icon />
                </span>
                <b>{m.health}%</b>
              </header>
              <h2>{m.name}</h2>
              <em>{m.family}</em>
              <p>{m.description}</p>
              <div>
                <span>
                  <strong>{m.reports}</strong> reports
                </span>
                <span>{m.signals}</span>
              </div>
              <button
                onClick={() =>
                  notify(
                    `${m.name} workspace selected. Use Reporting for its complete catalogue.`,
                  )
                }
              >
                Explore workload <ChevronRight20Regular />
              </button>
            </article>
          );
        })}
      </div>
      <div className="suite-three">
        <Card
          title="Inventory composition"
          subtitle="Normalized object distribution"
        >
          <div className="mini-bars">
            {[
              { n: "Identity", v: 38 },
              { n: "Collaboration", v: 27 },
              { n: "Endpoint", v: 18 },
              { n: "Security", v: 10 },
              { n: "Compliance", v: 7 },
            ].map((x) => (
              <div key={x.n}>
                <span>{x.n}</span>
                <i>
                  <b style={{ width: `${x.v * 2.2}%` }} />
                </i>
                <strong>{x.v}%</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Collection assurance" subtitle="Connector service level">
          <div className="assurance-score">
            <strong>99.2%</strong>
            <span>30-day collection SLA</span>
            <p>
              <i /> 9 healthy <i className="warning" /> 1 delayed
            </p>
          </div>
        </Card>
        <Card title="Historical depth" subtitle="Local temporal snapshots">
          <div className="history-stats">
            <span>
              <strong>24 months</strong>identity and configuration
            </span>
            <span>
              <strong>13 months</strong>activity and audit signals
            </span>
            <span>
              <strong>7 years</strong>immutable compliance evidence
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}

function Reporting({ notify }: { notify: (m: string) => void }) {
  const [view, setView] = useState<"dashboards" | "catalogue">("dashboards");
  const [query, setQuery] = useState("");
  const [workload, setWorkload] = useState("All workloads");
  const [selected, setSelected] = useState<CatalogueReport | null>(null);
  const [favorites, setFavorites] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [dashboardWorkload, setDashboardWorkload] = useState(
    suiteModules[0].name,
  );
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);
  const dashboard = dashboardFor(dashboardWorkload);
  const dashboardReports = reportCatalogue
    .filter((report) => report.workload === dashboardWorkload)
    .slice(0, 6);
  const workloads = [
    "All workloads",
    ...Array.from(new Set(reportCatalogue.map((r) => r.workload))),
  ];
  const filtered = useMemo(
    () =>
      reportCatalogue
        .filter(
          (r) =>
            (workload === "All workloads" || r.workload === workload) &&
            (!favorites || r.favorite) &&
            (!scheduled || r.scheduled) &&
            `${r.name} ${r.description} ${r.category}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .slice(0, 30),
    [query, workload, favorites, scheduled],
  );
  return (
    <>
      <Header
        path="INTELLIGENCE / REPORTING"
        title="Microsoft 365 report center"
        description="Search, customize, schedule, export, and delegate a unified catalogue of 947 operational reports."
      >
        <Btn>
          <ArrowDownload24Regular /> Export queue
        </Btn>
        <Btn
          primary
          onClick={() =>
            notify(
              "Custom report designer opened with the governed semantic model.",
            )
          }
        >
          <DocumentBulletList24Regular /> Create report
        </Btn>
      </Header>
      <div className="report-summary">
        <Kpi
          label="REPORT CATALOGUE"
          value="947"
          detail="Across 10 connected workloads"
        />
        <Kpi
          label="CUSTOM REPORTS"
          value="184"
          detail="42 shared with teams"
          tone="blue"
        />
        <Kpi
          label="SCHEDULES"
          value="67"
          detail="12 delivering today"
          tone="gold"
        />
        <Kpi
          label="FAVORITES"
          value="29"
          detail="Personal quick access"
          tone="purple"
        />
      </div>
      <div className="report-mode-tabs">
        <button
          className={view === "dashboards" ? "selected" : ""}
          onClick={() => setView("dashboards")}
        >
          <DataTrending24Regular /> Admin center dashboards
        </button>
        <button
          className={view === "catalogue" ? "selected" : ""}
          onClick={() => setView("catalogue")}
        >
          <DocumentBulletList24Regular /> Report catalogue
        </button>
      </div>
      {view === "dashboards" && (
        <div className="admin-dashboard-layout">
          <aside className="admin-center-list">
            <strong>ADMIN CENTERS</strong>
            {suiteModules.map((module) => (
              <button
                key={module.name}
                className={dashboardWorkload === module.name ? "selected" : ""}
                onClick={() => setDashboardWorkload(module.name)}
              >
                <span style={{ background: module.accent }}>
                  <CloudCheckmark24Regular />
                </span>
                <div>
                  <b>{module.name}</b>
                  <small>
                    {module.family} · {module.reports} reports
                  </small>
                </div>
                <em>{module.health}%</em>
              </button>
            ))}
          </aside>
          <section className="admin-dashboard">
            <header>
              <div>
                <small>
                  {suiteModules
                    .find((module) => module.name === dashboardWorkload)
                    ?.family.toUpperCase()}{" "}
                  ADMIN CENTER
                </small>
                <h2>{dashboardWorkload} operational dashboard</h2>
                <p>
                  {
                    suiteModules.find(
                      (module) => module.name === dashboardWorkload,
                    )?.description
                  }
                </p>
              </div>
              <span>
                <i /> Data current · governed snapshot
              </span>
            </header>
            <div className="admin-dashboard-metrics">
              {dashboard.metrics.map((metric) => (
                <article key={metric.label}>
                  <small>{metric.label}</small>
                  <strong>{metric.value}</strong>
                  <span>{metric.detail}</span>
                </article>
              ))}
            </div>
            <div className="admin-dashboard-grid">
              <article className="admin-health-card">
                <header>
                  <div>
                    <strong>Operational posture</strong>
                    <small>Health, coverage, risk, and freshness</small>
                  </div>
                  <b>
                    {
                      suiteModules.find(
                        (module) => module.name === dashboardWorkload,
                      )?.health
                    }
                    %
                  </b>
                </header>
                {[
                  "Configuration health",
                  "Security coverage",
                  "Data quality",
                  "Collection freshness",
                ].map((label, index) => {
                  const score = Math.max(
                    76,
                    (suiteModules.find(
                      (module) => module.name === dashboardWorkload,
                    )?.health ?? 90) -
                      index * 3 +
                      (index === 2 ? 4 : 0),
                  );
                  return (
                    <div className="admin-health-row" key={label}>
                      <span>{label}</span>
                      <i>
                        <b style={{ width: `${score}%` }} />
                      </i>
                      <em>{score}%</em>
                    </div>
                  );
                })}
              </article>
              <article className="admin-trend-card">
                <header>
                  <strong>30-day activity and risk trend</strong>
                  <small>Normalized daily signals</small>
                </header>
                <div>
                  {[42, 58, 49, 72, 63, 81, 74, 88, 69, 76, 91, 83].map(
                    (value, index) => (
                      <i
                        key={index}
                        style={{ height: `${value}%` }}
                        title={`Day ${index + 1}: ${value}`}
                      />
                    ),
                  )}
                </div>
                <footer>
                  <span>01 Jul</span>
                  <span>15 Jul</span>
                </footer>
              </article>
            </div>
            <section className="admin-dashboard-table">
              <header>
                <div>
                  <strong>Priority data view</strong>
                  <small>Highest-value records for this admin center</small>
                </div>
                <button
                  onClick={() =>
                    setGenerated(generateCatalogueReport(dashboardReports[0]))
                  }
                >
                  <Play24Regular />
                  Generate full dashboard report
                </button>
              </header>
              <div className="admin-data-scroll">
                <table>
                  <thead>
                    <tr>
                      {dashboard.columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.rows.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, index) => (
                          <td key={`${index}-${cell}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="admin-quick-reports">
              <header>
                <strong>Recommended reports</strong>
                <small>
                  Generate, review, and export without leaving the dashboard
                </small>
              </header>
              <div>
                {dashboardReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() =>
                      setGenerated(generateCatalogueReport(report))
                    }
                  >
                    <DocumentBulletList24Regular />
                    <span>
                      <b>{report.name}</b>
                      <small>
                        {report.category} · {report.rows} rows
                      </small>
                    </span>
                    <Play24Regular />
                  </button>
                ))}
              </div>
            </section>
          </section>
        </div>
      )}
      {view === "catalogue" && (
        <div className="report-workspace">
          <aside className="report-tree">
            <strong>WORKLOADS</strong>
            {workloads.map((w) => (
              <button
                className={workload === w ? "selected" : ""}
                key={w}
                onClick={() => setWorkload(w)}
              >
                <Folder24Regular />
                <span>{w}</span>
                <b>
                  {w === "All workloads"
                    ? 947
                    : reportCatalogue.filter((r) => r.workload === w).length *
                        9 +
                      4}
                </b>
              </button>
            ))}
            <strong>MY WORKSPACE</strong>
            <button
              className={favorites ? "selected" : ""}
              onClick={() => setFavorites(!favorites)}
            >
              <Sparkle24Filled />
              <span>Favorites</span>
              <b>29</b>
            </button>
            <button
              className={scheduled ? "selected" : ""}
              onClick={() => setScheduled(!scheduled)}
            >
              <CalendarClock24Regular />
              <span>Scheduled reports</span>
              <b>67</b>
            </button>
          </aside>
          <section className="report-results">
            <div className="catalogue-toolbar">
              <label>
                <Search20Regular />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search report name, category, or field…"
                />
              </label>
              <button>
                <Filter24Regular /> Advanced filters
              </button>
              <span>{filtered.length} shown</span>
            </div>
            <div className="catalogue-list">
              <div className="catalogue-head">
                <span>Report</span>
                <span>Workload</span>
                <span>Rows</span>
                <span>Freshness</span>
                <span />
              </div>
              {filtered.map((r) => (
                <button key={r.id} onClick={() => setSelected(r)}>
                  <span className="catalogue-name">
                    <i>
                      <DocumentBulletList24Regular />
                    </i>
                    <span>
                      <strong>{r.name}</strong>
                      <small>
                        {r.id} · {r.category} · {r.description}
                      </small>
                    </span>
                    {r.favorite && <em>★</em>}
                  </span>
                  <span>{r.workload}</span>
                  <span>{r.rows}</span>
                  <span>
                    <i className="fresh-dot" />
                    {r.updated} ago
                  </span>
                  <ChevronRight20Regular />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      {selected && (
        <ReportDrawer
          report={selected}
          onClose={() => setSelected(null)}
          notify={notify}
          onRun={() => {
            setGenerated(generateCatalogueReport(selected));
            setSelected(null);
          }}
        />
      )}
      {generated && (
        <GeneratedReportViewer
          report={generated}
          onClose={() => setGenerated(null)}
          notify={notify}
        />
      )}
    </>
  );
}

function ReportDrawer({
  report,
  onClose,
  notify,
  onRun,
}: {
  report: CatalogueReport;
  onClose: () => void;
  notify: (m: string) => void;
  onRun: () => void;
}) {
  const [tab, setTab] = useState("Preview");
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <aside
        className="detail-drawer suite-drawer"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <span>
            <b className="catalogue-id">{report.id}</b>
            <small>{report.workload}</small>
          </span>
          <button onClick={onClose}>×</button>
        </div>
        <h2>{report.name}</h2>
        <p className="drawer-sub">{report.description}</p>
        <div className="drawer-tabs">
          {["Preview", "Columns", "Filters", "Schedule"].map((item) => (
            <button
              key={item}
              className={tab === item ? "selected" : ""}
              onClick={() => {
                setTab(item);
                notify(
                  `${report.name}: ${item.toLowerCase()} configuration selected.`,
                );
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="report-config">
          <section>
            <h3>Report scope</h3>
            <div className="config-row">
              <span>
                Tenant<strong>Apex Financial Group</strong>
              </span>
              <span>
                Snapshot<strong>Current · {report.updated} old</strong>
              </span>
            </div>
          </section>
          <section>
            <h3>Selected columns</h3>
            <div className="tag-list">
              <span>Display name</span>
              <span>Object ID</span>
              <span>Department</span>
              <span>Status</span>
              <span>Last activity</span>
              <span>Risk</span>
              <span>+ 8 more</span>
            </div>
          </section>
          <section>
            <h3>Active filters</h3>
            <div className="filter-builder">
              <span>
                Account state <b>equals</b> Enabled
              </span>
              <span>
                Activity date <b>before</b> 90 days
              </span>
              <button
                onClick={() =>
                  notify(`A new filter condition was added to ${report.name}.`)
                }
              >
                + Add condition
              </button>
            </div>
          </section>
          <section>
            <h3>Preview</h3>
            <div className="preview-table">
              <div>
                <b>Display name</b>
                <b>Department</b>
                <b>Status</b>
              </div>
              {["Nadia Almasi", "Robert Santos", "Li Chen"].map((n, i) => (
                <div key={n}>
                  <span>{n}</span>
                  <span>
                    {["Private Banking", "Infrastructure", "Treasury"][i]}
                  </span>
                  <span>Review</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="drawer-actions">
          <Btn onClick={() => notify(`${report.name} added to favorites.`)}>
            ☆ Favorite
          </Btn>
          <Btn
            onClick={() => notify(`Schedule draft created for ${report.name}.`)}
          >
            <CalendarClock24Regular /> Schedule
          </Btn>
          <Btn
            primary
            onClick={() => {
              notify(
                `${report.name} generated locally with ${report.rows} rows.`,
              );
              onRun();
            }}
          >
            <Play24Regular /> Run report
          </Btn>
        </div>
      </aside>
    </div>
  );
}

function Auditing({ notify }: { notify: (m: string) => void }) {
  const [query, setQuery] = useState("");
  const [workload, setWorkload] = useState("All workloads");
  const [highRisk, setHighRisk] = useState(false);
  const [result, setResult] = useState("Any");
  const [selected, setSelected] = useState<
    (typeof auditActivities)[number] | null
  >(null);
  const auditWorkloads = [
    "All workloads",
    ...Array.from(new Set(auditActivities.map((a) => a.workload))),
  ];
  const results = [
    "Any",
    ...Array.from(new Set(auditActivities.map((a) => a.result))),
  ];
  const events = auditActivities.filter(
    (a) =>
      `${a.activity} ${a.actor} ${a.target} ${a.workload}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (workload === "All workloads" || a.workload === workload) &&
      (!highRisk || ["High", "Critical"].includes(a.risk)) &&
      (result === "Any" || a.result === result),
  );
  return (
    <>
      <Header
        path="INTELLIGENCE / UNIFIED AUDIT"
        title="Microsoft 365 audit explorer"
        description="Investigate normalized activities across workloads with long-term local retention and rapid filtering."
      >
        <Btn>
          <ArrowDownload24Regular /> Export evidence
        </Btn>
        <Btn
          primary
          onClick={() =>
            notify(
              "Audit search saved as a continuously evaluated alert policy.",
            )
          }
        >
          <Alert24Regular /> Create alert
        </Btn>
      </Header>
      <div className="report-summary">
        <Kpi label="EVENTS TODAY" value="184,216" detail="Across 8 workloads" />
        <Kpi
          label="HIGH-RISK EVENTS"
          value="142"
          detail="31 under investigation"
          tone="red"
        />
        <Kpi
          label="AUDIT RETENTION"
          value="7 years"
          detail="Immutable local archive"
          tone="blue"
        />
        <Kpi
          label="INGESTION LAG"
          value="2m 14s"
          detail="Within collection SLA"
          tone="gold"
        />
      </div>
      <Card
        title="Audit activity trend"
        subtitle="Normalized events over the last 24 hours"
      >
        <div className="audit-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { h: "00", v: 4200 },
                { h: "04", v: 3100 },
                { h: "08", v: 11200 },
                { h: "12", v: 14800 },
                { h: "16", v: 12100 },
                { h: "20", v: 6800 },
              ]}
            >
              <CartesianGrid vertical={false} stroke="#253c48" />
              <XAxis dataKey="h" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  background: "#142832",
                  border: "1px solid #29434f",
                }}
              />
              <Bar dataKey="v" fill="#4bc5ad" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card
        title="Activity investigation"
        subtitle="Click an event for full normalized context"
        action={<DemoTag />}
      >
        <div className="audit-toolbar">
          <label>
            <Search20Regular />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actor, activity, target, or workload…"
            />
          </label>
          <button
            onClick={() =>
              setWorkload(
                auditWorkloads[
                  (auditWorkloads.indexOf(workload) + 1) % auditWorkloads.length
                ],
              )
            }
          >
            {workload}
            <ChevronRight20Regular />
          </button>
          <button
            className={highRisk ? "selected" : ""}
            onClick={() => setHighRisk(!highRisk)}
          >
            Risk: {highRisk ? "High+" : "Any"}
            <ChevronRight20Regular />
          </button>
          <button
            onClick={() =>
              setResult(results[(results.indexOf(result) + 1) % results.length])
            }
          >
            Result: {result}
            <ChevronRight20Regular />
          </button>
          <button
            onClick={() =>
              notify(
                "Time range is fixed to the last 24 hours for this governed demo snapshot.",
              )
            }
          >
            Last 24 hours
            <ChevronRight20Regular />
          </button>
        </div>
        <div className="audit-events">
          <div className="audit-head">
            <span>Time</span>
            <span>Workload / activity</span>
            <span>Actor</span>
            <span>Target</span>
            <span>Result</span>
            <span>Risk</span>
          </div>
          {events.map((a) => (
            <button key={a.time} onClick={() => setSelected(a)}>
              <span>
                {a.time}
                <small>{a.location}</small>
              </span>
              <span>
                <strong>{a.activity}</strong>
                <small>{a.workload}</small>
              </span>
              <span>{a.actor}</span>
              <span>{a.target}</span>
              <span>{a.result}</span>
              <Risk value={a.risk} />
            </button>
          ))}
        </div>
      </Card>
      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <aside
            className="detail-drawer suite-drawer"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <span>
                <Risk value={selected.risk} />
                <small>{selected.time}</small>
              </span>
              <button onClick={() => setSelected(null)}>×</button>
            </div>
            <h2>{selected.activity}</h2>
            <p className="drawer-sub">
              {selected.workload} · {selected.location}
            </p>
            <div className="audit-detail-grid">
              {Object.entries(selected).map(([k, v]) => (
                <span key={k}>
                  <small>{k}</small>
                  <strong>{v}</strong>
                </span>
              ))}
            </div>
            <section>
              <h3>Correlation</h3>
              <p>
                Linked to 3 sign-in events, 1 identity risk detection, and 2
                configuration snapshots in the local digital twin.
              </p>
            </section>
            <section>
              <h3>Raw evidence integrity</h3>
              <div className="evidence-box">
                <Database24Regular />
                <p>
                  SHA-256 evidence hash verified against immutable audit chain
                  segment 2026-07-15/10.
                </p>
                <b>Integrity verified</b>
              </div>
            </section>
            <div className="drawer-actions">
              <Btn
                onClick={() =>
                  notify("Audit event attached to investigation CASE-4428.")
                }
              >
                Add to case
              </Btn>
              <Btn
                primary
                onClick={() =>
                  notify(
                    "Alert policy drafted from this audit activity pattern.",
                  )
                }
              >
                <Alert24Regular /> Create alert
              </Btn>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Management({ notify }: { notify: (m: string) => void }) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All areas");
  const [selected, setSelected] = useState<
    (typeof managementActions)[number] | null
  >(null);
  const actions = managementActions.filter(
    (a) =>
      `${a.name} ${a.area} ${a.objects}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (area === "All areas" || a.area === area),
  );
  return (
    <>
      <Header
        path="OPERATIONS / MANAGEMENT"
        title="Microsoft 365 management center"
        description="Perform bulk and scheduled administration through guarded, approval-aware operations."
      >
        <Btn>Job history</Btn>
        <Btn
          primary
          onClick={() =>
            notify("A blank governed management job has been created.")
          }
        >
          <Settings24Regular /> New custom job
        </Btn>
      </Header>
      <div className="management-banner">
        <ShieldCheckmark24Regular />
        <div>
          <strong>Guarded execution enabled</strong>
          <p>
            Every operation performs preflight validation, authorization,
            approval, dry run, idempotency, audit, and rollback checks.
          </p>
        </div>
        <span>0 destructive actions pending</span>
      </div>
      <div className="report-summary">
        <Kpi label="ACTIONS AVAILABLE" value="68" detail="Across 9 workloads" />
        <Kpi
          label="JOBS THIS MONTH"
          value="2,418"
          detail="98.7% successful"
          tone="blue"
        />
        <Kpi
          label="AWAITING APPROVAL"
          value="14"
          detail="Oldest is 19 hours"
          tone="gold"
        />
        <Kpi
          label="ROLLBACK SUCCESS"
          value="100%"
          detail="3 of 3 completed"
          tone="purple"
        />
      </div>
      <div className="action-layout">
        <aside className="action-categories">
          <strong>ACTION AREAS</strong>
          <button
            className={area === "All areas" ? "selected" : ""}
            onClick={() => setArea("All areas")}
          >
            <span>All areas</span>
            <b>{managementActions.length}</b>
          </button>
          {Array.from(new Set(managementActions.map((a) => a.area))).map(
            (areaName) => (
              <button
                key={areaName}
                className={area === areaName ? "selected" : ""}
                onClick={() => setArea(areaName)}
              >
                <span>{areaName}</span>
                <b>
                  {managementActions.filter((a) => a.area === areaName).length}
                </b>
              </button>
            ),
          )}
        </aside>
        <section>
          <div className="action-search">
            <Search20Regular />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a management action…"
            />
          </div>
          <div className="action-grid">
            {actions.map((a, i) => {
              const Icon = [
                Person24Regular,
                Key24Regular,
                MoneyHand24Regular,
                PeopleTeam24Regular,
                Mail24Regular,
                Mail24Regular,
                Apps24Regular,
                Folder24Regular,
                CloudCheckmark24Regular,
                Desktop24Regular,
                ShieldError24Regular,
                ClipboardTask24Regular,
              ][i];
              return (
                <button key={a.name} onClick={() => setSelected(a)}>
                  <span>
                    <Icon />
                  </span>
                  <div>
                    <strong>{a.name}</strong>
                    <small>
                      {a.area} · {a.objects}
                    </small>
                    <p>{a.description}</p>
                  </div>
                  <Risk value={a.risk} />
                </button>
              );
            })}
          </div>
        </section>
      </div>
      {selected && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <aside
            className="detail-drawer suite-drawer"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <span>
                <Risk value={selected.risk} />
                <small>{selected.area}</small>
              </span>
              <button onClick={() => setSelected(null)}>×</button>
            </div>
            <h2>{selected.name}</h2>
            <p className="drawer-sub">{selected.description}</p>
            <div className="execution-flow">
              {[
                "Select governed scope",
                "Validate objects and exclusions",
                "Generate dry-run change set",
                selected.approval,
                "Execute with idempotency",
                "Verify and record evidence",
              ].map((s, i) => (
                <div key={s}>
                  <span>{i + 1}</span>
                  <strong>{s}</strong>
                  <small>
                    {i === 3
                      ? "Required approval boundary"
                      : "Automated safety stage"}
                  </small>
                </div>
              ))}
            </div>
            <section>
              <h3>Safety guarantees</h3>
              <div className="check-list">
                <span>
                  <CheckmarkCircle24Regular /> No client secrets stored
                </span>
                <span>
                  <CheckmarkCircle24Regular /> Before-state captured
                </span>
                <span>
                  <CheckmarkCircle24Regular /> Rollback plan generated
                </span>
                <span>
                  <CheckmarkCircle24Regular /> Immutable audit evidence
                </span>
              </div>
            </section>
            <div className="drawer-actions">
              <Btn
                onClick={() =>
                  notify(
                    `Dry run for “${selected.name}” produced 12 synthetic changes and 2 exclusions.`,
                  )
                }
              >
                <Play24Regular /> Dry run
              </Btn>
              <Btn
                primary
                onClick={() =>
                  notify(
                    `Draft management job created for “${selected.name}”; approval is required.`,
                  )
                }
              >
                Create governed job
              </Btn>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Usage() {
  return (
    <>
      <Header
        path="INTELLIGENCE / USAGE & ADOPTION"
        title="Microsoft 365 adoption analytics"
        description="Measure active use, depth, business value, and training opportunities across services and organization."
      >
        <Btn>
          <ArrowDownload24Regular /> Adoption pack
        </Btn>
        <Btn primary>
          <Sparkle24Filled /> Generate campaign
        </Btn>
      </Header>
      <div className="report-summary">
        <Kpi label="ACTIVE USERS" value="11,942" detail="95.7% of workforce" />
        <Kpi
          label="COLLABORATION INDEX"
          value="82/100"
          detail="↑ 4.2 points this quarter"
          tone="blue"
        />
        <Kpi
          label="LOW-ADOPTION USERS"
          value="1,284"
          detail="6 campaigns recommended"
          tone="gold"
        />
        <Kpi
          label="LICENSE VALUE REALIZED"
          value="91.7%"
          detail="↑ $28K equivalent value"
          tone="purple"
        />
      </div>
      <div className="usage-grid">
        <Card
          title="Service adoption"
          subtitle="Eligible versus monthly active users"
        >
          <div className="service-adoption">
            {adoption.map((a) => (
              <div key={a.service}>
                <span>
                  <strong>{a.service}</strong>
                  <small>
                    {a.active.toLocaleString()} of {a.eligible.toLocaleString()}{" "}
                    active
                  </small>
                </span>
                <i>
                  <b style={{ width: `${a.adoption}%` }} />
                </i>
                <strong>{a.adoption}%</strong>
                <em className={a.trend < 0 ? "down" : ""}>
                  {a.trend > 0 ? "↑" : "↓"} {Math.abs(a.trend)}%
                </em>
              </div>
            ))}
          </div>
        </Card>
        <Card
          title="Adoption by organization"
          subtitle="Monthly active collaboration"
        >
          <div className="heatmap">
            <div />
            <b>Exchange</b>
            <b>Teams</b>
            <b>SharePoint</b>
            <b>OneDrive</b>
            {[
              "Corporate Banking",
              "Retail Banking",
              "Technology",
              "Operations",
              "Risk & Compliance",
            ].flatMap((d, di) => [
              <strong key={`${d}n`}>{d}</strong>,
              ...["E", "T", "S", "O"].map((x, i) => (
                <span
                  key={`${d}${x}`}
                  style={{ opacity: 0.35 + (((di + i) * 17) % 60) / 100 }}
                >
                  {82 + ((di * 7 + i * 3) % 17)}%
                </span>
              )),
            ])}
          </div>
        </Card>
      </div>
      <Card
        title="Adoption opportunity segments"
        subtitle="Actionable populations derived from usage behavior"
      >
        <div className="opportunity-grid">
          {[
            {
              t: "Teams meeting-only users",
              c: "842 users",
              a: "Channel collaboration coaching",
              v: "Medium",
            },
            {
              t: "Licensed but inactive Power BI users",
              c: "424 users",
              a: "Validate need or reclaim license",
              v: "High",
            },
            {
              t: "OneDrive local-storage preference",
              c: "631 users",
              a: "Migration and sync campaign",
              v: "Medium",
            },
            {
              t: "Viva Engage non-adopters",
              c: "3,282 users",
              a: "Community value assessment",
              v: "Low",
            },
          ].map((x) => (
            <article key={x.t}>
              <span>
                <DataTrending24Regular />
              </span>
              <div>
                <strong>{x.t}</strong>
                <small>{x.c}</small>
                <p>{x.a}</p>
              </div>
              <Risk value={x.v} />
            </article>
          ))}
        </div>
      </Card>
    </>
  );
}

function Governance({ notify }: { notify: (m: string) => void }) {
  return (
    <>
      <Header
        path="GOVERNANCE / REQUEST PORTAL"
        title="Microsoft 365 governance portal"
        description="Standardize resource requests, ownership, lifecycle, exceptions, approvals, and policy evidence."
      >
        <Btn>Policy library</Btn>
        <Btn
          primary
          onClick={() => notify("New governed resource request form opened.")}
        >
          + New request
        </Btn>
      </Header>
      <div className="report-summary">
        <Kpi label="OPEN REQUESTS" value="47" detail="8 require attention" />
        <Kpi
          label="MEDIAN FULFILLMENT"
          value="6.4h"
          detail="↓ 1.8h this quarter"
          tone="blue"
        />
        <Kpi
          label="OWNER COVERAGE"
          value="97.2%"
          detail="86 resources need owners"
          tone="gold"
        />
        <Kpi
          label="LIFECYCLE COMPLIANCE"
          value="92%"
          detail="612 stale resources queued"
          tone="purple"
        />
      </div>
      <div className="governance-flow">
        {[
          "Request",
          "Validate policy",
          "Risk assessment",
          "Owner approval",
          "Provision",
          "Recertify",
        ].map((x, i) => (
          <div key={x}>
            <span>{i + 1}</span>
            <strong>{x}</strong>
            <small>{[47, 31, 18, 14, 9, 612][i]} items</small>
            {i < 5 && <i>→</i>}
          </div>
        ))}
      </div>
      <Card
        title="Governance request queue"
        subtitle="Business requests with policy and approval context"
      >
        <div className="governance-table">
          <div>
            <span>ID</span>
            <span>Request</span>
            <span>Requester / resource</span>
            <span>Current stage</span>
            <span>Age</span>
            <span>Risk</span>
            <span />
          </div>
          {governanceRequests.map((r) => (
            <button
              key={r.id}
              onClick={() =>
                notify(
                  `${r.id} opened with policy evaluation and approval history.`,
                )
              }
            >
              <b>{r.id}</b>
              <span>{r.type}</span>
              <span>
                <strong>{r.requester}</strong>
                <small>{r.resource}</small>
              </span>
              <span>{r.stage}</span>
              <span>{r.age}</span>
              <Risk value={r.risk} />
              <ChevronRight20Regular />
            </button>
          ))}
        </div>
      </Card>
      <div className="suite-three">
        <Card title="Ownership policy" subtitle="Accountability health">
          <div className="assurance-score">
            <strong>97.2%</strong>
            <span>Resources with active owners</span>
            <p>
              <i /> 7,188 compliant
            </p>
          </div>
        </Card>
        <Card title="Naming policy" subtitle="Standard conformance">
          <div className="assurance-score">
            <strong>94.8%</strong>
            <span>Resources meeting taxonomy</span>
            <p>
              <i /> 382 exceptions
            </p>
          </div>
        </Card>
        <Card title="Recertification" subtitle="Review completion">
          <div className="assurance-score">
            <strong>91.4%</strong>
            <span>Current cycle complete</span>
            <p>
              <i className="warning" /> 47 overdue reviews
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

function Alerts({ notify }: { notify: (m: string) => void }) {
  return (
    <>
      <Header
        path="OPERATIONS / ALERTING"
        title="Intelligent alert policies"
        description="Detect meaningful Microsoft 365 changes and route enriched notifications without alert fatigue."
      >
        <Btn>Delivery history</Btn>
        <Btn
          primary
          onClick={() =>
            notify(
              "Alert policy builder opened with 947 report signals available.",
            )
          }
        >
          + New alert policy
        </Btn>
      </Header>
      <div className="report-summary">
        <Kpi label="ACTIVE POLICIES" value="48" detail="Across 9 workloads" />
        <Kpi
          label="TRIGGERED TODAY"
          value="26"
          detail="4 critical · 11 resolved"
          tone="red"
        />
        <Kpi
          label="NOISE REDUCTION"
          value="83%"
          detail="Correlation and suppression"
          tone="blue"
        />
        <Kpi
          label="DELIVERY SUCCESS"
          value="99.7%"
          detail="Email, Teams, SMS, ITSM"
          tone="purple"
        />
      </div>
      <Card
        title="Alert policy library"
        subtitle="Versioned conditions, enrichment, routing, and suppression"
      >
        <div className="policy-grid">
          {alertPolicies.map((p) => (
            <article key={p.name}>
              <header>
                <span>
                  <Alert24Regular />
                </span>
                <b className="status active">{p.state}</b>
              </header>
              <h3>{p.name}</h3>
              <p>
                {p.category} · Evaluation {p.latency}
              </p>
              <div>
                <span>
                  <small>Severity</small>
                  <Risk value={p.severity} />
                </span>
                <span>
                  <small>Matches 30d</small>
                  <strong>{p.matches}</strong>
                </span>
              </div>
              <footer>
                <span>{p.channels}</span>
                <button
                  onClick={() =>
                    notify(`Test notification sent for “${p.name}”.`)
                  }
                >
                  Test
                </button>
              </footer>
            </article>
          ))}
        </div>
      </Card>
      <div className="two-col">
        <Card
          title="Delivery channels"
          subtitle="Notification and ITSM integrations"
        >
          <div className="channel-list">
            {[
              ["Microsoft Teams", "Healthy", "312 delivered"],
              ["Email relay", "Healthy", "1,842 delivered"],
              ["ServiceNow", "Healthy", "76 incidents"],
              ["SMS gateway", "Healthy", "19 critical"],
              ["Webhook / SIEM", "Healthy", "628 events"],
            ].map((x) => (
              <div key={x[0]}>
                <span>
                  <CloudCheckmark24Regular />
                </span>
                <strong>{x[0]}</strong>
                <b>{x[1]}</b>
                <small>{x[2]}</small>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Suppression effectiveness" subtitle="Last 30 days">
          <div className="suppression">
            <strong>12,842</strong>
            <span>raw matching signals</span>
            <i>↓</i>
            <strong>2,184</strong>
            <span>correlated notifications</span>
            <em>83% noise reduction</em>
          </div>
        </Card>
      </div>
    </>
  );
}

function Reminders({ notify }: { notify: (m: string) => void }) {
  return (
    <>
      <Header
        path="GOVERNANCE / REMINDERS & FOLLOW-UPS"
        title="Reminder and follow-up agents"
        description="Drive user, manager, owner, and reviewer action through measured, escalating campaigns."
      >
        <Btn>Message templates</Btn>
        <Btn
          primary
          onClick={() =>
            notify("New follow-up agent wizard opened in demo mode.")
          }
        >
          <CalendarClock24Regular /> New agent
        </Btn>
      </Header>
      <div className="report-summary">
        <Kpi
          label="ACTIVE AGENTS"
          value="18"
          detail="5,284 recipients in scope"
        />
        <Kpi
          label="COMPLETION RATE"
          value="78.6%"
          detail="↑ 6.2% this quarter"
          tone="blue"
        />
        <Kpi
          label="ESCALATIONS"
          value="142"
          detail="31 manager escalations today"
          tone="gold"
        />
        <Kpi
          label="HOURS SAVED"
          value="284h"
          detail="Estimated monthly effort"
          tone="purple"
        />
      </div>
      <Card
        title="Active follow-up agents"
        subtitle="Automated reminders with completion evidence"
      >
        <div className="agent-grid">
          {reminderAgents.map((a) => (
            <article key={a.name}>
              <header>
                <span>
                  <CalendarClock24Regular />
                </span>
                <b className="status active">Active</b>
              </header>
              <h3>{a.name}</h3>
              <p>
                {a.audience} · {a.owner}
              </p>
              <div
                className="completion-ring"
                style={
                  {
                    "--completion": `${a.completion * 3.6}deg`,
                  } as React.CSSProperties
                }
              >
                <span>{a.completion}%</span>
              </div>
              <dl>
                <dt>Cadence</dt>
                <dd>{a.cadence}</dd>
                <dt>Next run</dt>
                <dd>{a.next}</dd>
              </dl>
              <button
                onClick={() =>
                  notify(`Preview opened for the next “${a.name}” message.`)
                }
              >
                Preview next message
              </button>
            </article>
          ))}
        </div>
      </Card>
      <Card
        title="Campaign effectiveness"
        subtitle="Completion by reminder sequence"
      >
        <div className="reminder-funnel">
          {[
            ["Initial request", 5284, 100],
            ["First reminder", 3128, 59],
            ["Final reminder", 1764, 33],
            ["Manager escalation", 612, 12],
            ["Completed", 4154, 79],
          ].map((x) => (
            <div key={x[0] as string}>
              <span>{x[0]}</span>
              <i style={{ width: `${x[2]}%` }} />
              <strong>{(x[1] as number).toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function Delegation({ notify }: { notify: (m: string) => void }) {
  return (
    <>
      <Header
        path="GOVERNANCE / DELEGATED ADMINISTRATION"
        title="Least-privilege delegation"
        description="Give regional teams and non-admin specialists exactly the reports, objects, and actions they need."
      >
        <Btn>Access reviews</Btn>
        <Btn
          primary
          onClick={() =>
            notify(
              "Delegated role designer opened with deny-by-default permissions.",
            )
          }
        >
          + Create delegated role
        </Btn>
      </Header>
      <div className="report-summary">
        <Kpi label="DELEGATED ROLES" value="24" detail="73 active members" />
        <Kpi
          label="SCOPED PERMISSIONS"
          value="186"
          detail="Across reports and actions"
          tone="blue"
        />
        <Kpi
          label="REVIEWS DUE"
          value="7"
          detail="2 expire within 7 days"
          tone="gold"
        />
        <Kpi
          label="POLICY VIOLATIONS"
          value="0"
          detail="No privilege boundary breaches"
          tone="purple"
        />
      </div>
      <Card
        title="Delegated role assignments"
        subtitle="Role, scope, capabilities, review, and residual risk"
      >
        <div className="delegation-grid">
          {delegatedRoles.map((r) => (
            <article key={r.name}>
              <header>
                <span>
                  <PeopleTeam24Regular />
                </span>
                <Risk value={r.risk} />
              </header>
              <h3>{r.name}</h3>
              <p>{r.scope}</p>
              <div>
                <span>
                  <small>Members</small>
                  <strong>{r.members}</strong>
                </span>
                <span>
                  <small>Capabilities</small>
                  <strong>{r.permissions}</strong>
                </span>
              </div>
              <footer>
                <span>
                  <CalendarClock24Regular />
                  {r.expires}
                </span>
                <button
                  onClick={() => notify(`Access review started for ${r.name}.`)}
                >
                  Review
                </button>
              </footer>
            </article>
          ))}
        </div>
      </Card>
      <div className="two-col">
        <Card title="Permission model" subtitle="Effective authorization flow">
          <div className="permission-flow">
            {[
              "Verified identity",
              "Platform role",
              "Tenant membership",
              "Resource scope",
              "Action policy",
              "Approval state",
            ].map((x, i) => (
              <span key={x}>
                <b>{i + 1}</b>
                {x}
                {i < 5 && <i>→</i>}
              </span>
            ))}
          </div>
        </Card>
        <Card title="Separation of duties" subtitle="Policy validation">
          <div className="check-list delegation-checks">
            <span>
              <CheckmarkCircle24Regular /> Requester cannot approve own action
            </span>
            <span>
              <CheckmarkCircle24Regular /> Report access does not grant export
            </span>
            <span>
              <CheckmarkCircle24Regular /> Regional scopes exclude global
              objects
            </span>
            <span>
              <CheckmarkCircle24Regular /> Privileged actions require step-up
              MFA
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}

function Hybrid({ notify }: { notify: (m: string) => void }) {
  return (
    <>
      <Header
        path="HYBRID / ACTIVE DIRECTORY"
        title="Hybrid Active Directory operations"
        description="Unify on-premises directory health, synchronization, privilege, GPO, and Microsoft 365 identity context."
      >
        <Btn>Collector settings</Btn>
        <Btn
          primary
          onClick={() =>
            notify(
              "Hybrid directory health scan queued for all four synthetic domains.",
            )
          }
        >
          <ArrowSync24Regular /> Run health scan
        </Btn>
      </Header>
      <div className="report-summary">
        <Kpi
          label="DIRECTORY OBJECTS"
          value="34,296"
          detail="Across 4 domains"
        />
        <Kpi
          label="DOMAIN CONTROLLERS"
          value="20"
          detail="19 healthy · 1 warning"
          tone="blue"
        />
        <Kpi
          label="SYNC ERRORS"
          value="73"
          detail="18 high-priority objects"
          tone="gold"
        />
        <Kpi
          label="PRIVILEGED ACCOUNTS"
          value="142"
          detail="18 inactive 30+ days"
          tone="red"
        />
      </div>
      <Card
        title="Forest and domain health"
        subtitle="Replication, inventory, and collection freshness"
      >
        <div className="domain-grid">
          {hybridHealth.map((d) => (
            <article key={d.name}>
              <header>
                <span>
                  <Database24Regular />
                </span>
                <b
                  className={`status ${d.replication === "Warning" ? "investigating" : "active"}`}
                >
                  {d.replication}
                </b>
              </header>
              <h3>{d.name}</h3>
              <p>{d.type}</p>
              <div>
                <span>
                  <small>Controllers</small>
                  <strong>{d.controllers}</strong>
                </span>
                <span>
                  <small>Objects</small>
                  <strong>{d.objects}</strong>
                </span>
                <span>
                  <small>Last sync</small>
                  <strong>{d.sync}</strong>
                </span>
              </div>
              <button
                onClick={() =>
                  notify(
                    `${d.name} topology opened with replication links and site coverage.`,
                  )
                }
              >
                Explore topology <ChevronRight20Regular />
              </button>
            </article>
          ))}
        </div>
      </Card>
      <div className="two-col">
        <Card
          title="Identity synchronization"
          subtitle="Entra Connect object flow"
        >
          <div className="sync-flow">
            <span>
              <Database24Regular />
              <b>Active Directory</b>
              <small>34,296 objects</small>
            </span>
            <i>→</i>
            <span>
              <ArrowSync24Regular />
              <b>Sync engine</b>
              <small>73 errors</small>
            </span>
            <i>→</i>
            <span>
              <CloudCheckmark24Regular />
              <b>Microsoft Entra ID</b>
              <small>33,982 linked</small>
            </span>
          </div>
        </Card>
        <Card
          title="Hybrid risk priorities"
          subtitle="Cross-directory intelligence"
        >
          <div className="hybrid-risks">
            {[
              ["Tier-0 accounts without PAW sign-in", "12", "Critical"],
              ["Stale privileged accounts", "18", "High"],
              ["Unlinked cloud identities", "314", "Medium"],
              ["GPO baseline drift", "7", "High"],
            ].map((x) => (
              <div key={x[0]}>
                <ShieldError24Regular />
                <span>
                  <strong>{x[0]}</strong>
                  <small>{x[1]} affected</small>
                </span>
                <Risk value={x[2]} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export function SuiteWorkspace({ page, notify }: Props) {
  switch (page) {
    case "Explorer 360":
      return <Explorer notify={notify} />;
    case "Reporting":
      return <Reporting notify={notify} />;
    case "Auditing":
      return <Auditing notify={notify} />;
    case "Management":
      return <Management notify={notify} />;
    case "Usage analytics":
      return <Usage />;
    case "Governance":
      return <Governance notify={notify} />;
    case "Alerts":
      return <Alerts notify={notify} />;
    case "Reminders":
      return <Reminders notify={notify} />;
    case "Delegation":
      return <Delegation notify={notify} />;
    case "Hybrid AD":
      return <Hybrid notify={notify} />;
    default:
      return <Explorer notify={notify} />;
  }
}

"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
import { dashboardFor, type GeneratedReport } from "@/lib/reporting";
import type { PlatformRole } from "@/lib/identity";
import {
  createRuntimeReportAlert,
  createRuntimeReportSchedule,
  createRuntimeReportView,
  getAdminCenters,
  getRuntimeReportOperations,
  runRuntimeReport,
  runRuntimeReportSchedule,
  runRuntimeSavedReportView,
  type ReportFilter,
  type RuntimeAdminCenter,
  type RuntimeReportOperations,
  type RuntimeReportView,
} from "@/lib/runtime-api";

type Props = {
  page: string;
  notify: (message: string) => void;
  roles: PlatformRole[];
};

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
  localAction = false,
  disabled = false,
}: {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
  localAction?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className={primary ? "primary-button" : "secondary-button"}
      onClick={onClick}
      disabled={disabled}
      data-local-action={localAction ? "true" : undefined}
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
              158,482 normalized objects · 1.8M relationships · 947 governed
              catalogue templates
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
          <kbd>947 report templates</kbd>
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
                  <strong>{m.reports}</strong> templates
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

const enterpriseReportColumns = [
  "Display name",
  "Object ID",
  "Type",
  "Status",
  "Risk score",
  "Department",
  "Region",
  "Owner",
  "Activity score",
  "External",
  "Last updated",
] as const;

type ReportRunConfiguration = {
  columns: string[];
  filters: ReportFilter[];
  viewId?: string;
};

type ReportPlane = "All planes" | "State" | "Audit" | "Analytics";

function reportPlaneFor(report: CatalogueReport): Exclude<ReportPlane, "All planes"> {
  const signal = `${report.name} ${report.category} ${report.description}`.toLowerCase();
  if (/audit|activity|sign-in|forwarding|permission|dlp|incident/.test(signal)) return "Audit";
  if (/trend|growth|usage|forecast|adoption|analytics|capacity/.test(signal)) return "Analytics";
  return "State";
}

function ReportFinderWorkspace({
  query,
  reports,
  total,
  workloads,
  selectedWorkload,
  plane,
  onQueryChange,
  onWorkloadChange,
  onPlaneChange,
  onOpen,
  onBrowseCatalogue,
}: {
  query: string;
  reports: CatalogueReport[];
  total: number;
  workloads: string[];
  selectedWorkload: string;
  plane: ReportPlane;
  onQueryChange: (value: string) => void;
  onWorkloadChange: (value: string) => void;
  onPlaneChange: (value: ReportPlane) => void;
  onOpen: (report: CatalogueReport) => void;
  onBrowseCatalogue: () => void;
}) {
  const topWorkloads = workloads.filter((item) => item !== "All workloads").slice(0, 7);
  const hasScopedFilters = Boolean(query.trim()) || selectedWorkload !== "All workloads" || plane !== "All planes";
  const matched = hasScopedFilters ? reports : reportCatalogue.slice(0, 18);
  const sections = hasScopedFilters
    ? [{ label: query.trim() ? "Search results" : "Filtered report results", hint: `${matched.length} matching templates`, items: matched.slice(0, 8) }]
    : [
        {
          label: "Recently used",
          hint: "Continue evidence work already in motion",
          items: reportCatalogue.filter((item) => item.scheduled || item.favorite).slice(0, 6),
        },
        {
          label: "Operator essentials",
          hint: "High-value reports for daily administration",
          items: reportCatalogue.filter((item) => /user|mailbox|license|sign-in/i.test(item.name)).slice(0, 6),
        },
        {
          label: "Risk and governance signals",
          hint: "Evidence used in leadership and audit reviews",
          items: reportCatalogue.filter((item) => /risk|audit|external|inactive|security/i.test(`${item.name} ${item.category}`)).slice(0, 6),
        },
      ];

  return (
    <section className="report-finder" data-testid="report-finder-workspace">
      <header className="report-finder-hero">
        <div>
          <span className="report-finder-kicker"><Sparkle24Filled /> AEGIS REPORT INTELLIGENCE</span>
          <h2>Find the next report by decision, not by menu.</h2>
          <p>Search titles, workloads, and governed reporting categories across {total.toLocaleString("en-US")} local templates.</p>
        </div>
        <button type="button" className="report-finder-browse" onClick={onBrowseCatalogue} data-local-action="true">
          Browse full catalogue <ChevronRight20Regular />
        </button>
      </header>
      <div className="report-finder-search">
        <Search20Regular />
        <input
          aria-label="Find a report"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search users, risk, mailboxes, licenses, audit evidence…"
        />
        {query && <button type="button" onClick={() => onQueryChange("")} aria-label="Clear report search">Clear</button>}
      </div>
      <div className="report-finder-filters" aria-label="Workload filters">
        <button className={selectedWorkload === "All workloads" ? "selected" : ""} onClick={() => onWorkloadChange("All workloads")}>All workloads</button>
        {topWorkloads.map((item) => (
          <button key={item} className={selectedWorkload === item ? "selected" : ""} onClick={() => onWorkloadChange(item)}>{item}</button>
        ))}
      </div>
      <div className="report-plane-filters" aria-label="Report plane filters">
        <span>Service plane</span>
        {(["All planes", "State", "Audit", "Analytics"] as ReportPlane[]).map((item) => (
          <button key={item} className={plane === item ? "selected" : ""} onClick={() => onPlaneChange(item)}>{item}</button>
        ))}
        <small>Every service follows the same state, audit, and analytics model.</small>
      </div>
      <div className="report-finder-sections">
        {sections.map((section) => (
          <article key={section.label} className="report-finder-section">
            <header>
              <div><h3>{section.label}</h3><p>{section.hint}</p></div>
              <span>{section.items.length} reports</span>
            </header>
            <div className="report-finder-cards">
              {section.items.map((report) => (
                <button key={report.id} type="button" className="report-finder-card" onClick={() => onOpen(report)}>
                  <span><DocumentBulletList24Regular /></span>
                  <div>
                    <strong>{report.name}</strong>
                    <p>{report.description}</p>
                    <small><b>{report.workload}</b><b>{report.category}</b><b>{report.rows} rows</b></small>
                  </div>
                  <ChevronRight20Regular />
                </button>
              ))}
            </div>
            {!section.items.length && <div className="report-finder-empty">No templates match this search. Try a broader term or workload.</div>}
          </article>
        ))}
      </div>
    </section>
  );
}

function ServiceOverview({ onOpenDashboard }: { onOpenDashboard: (service: string) => void }) {
  const services = [
    suiteModules.find((item) => item.name === "Microsoft Entra ID"),
    suiteModules.find((item) => item.name === "Defender XDR"),
    suiteModules.find((item) => item.name === "Exchange Online"),
  ].filter((item): item is (typeof suiteModules)[number] => Boolean(item));

  return (
    <section className="service-overview" data-testid="service-overview-workspace">
      <header>
        <div>
          <span className="report-finder-kicker"><DataTrending24Regular /> AEGIS SERVICE POSTURE</span>
          <h2>Microsoft 365 at a glance</h2>
          <p>Start with the service signal, then open its governed dashboard and supporting evidence.</p>
        </div>
        <span className="service-overview-status"><i /> Local snapshot current</span>
      </header>
      <div className="service-overview-grid">
        {services.map((service) => {
          const dashboard = dashboardFor(service.name);
          return (
            <article key={service.name} className="service-overview-card" style={{ "--service-accent": service.accent } as CSSProperties}>
              <header>
                <span><CloudCheckmark24Regular /></span>
                <div><small>{service.family.toUpperCase()} SERVICE</small><h3>{service.name}</h3></div>
                <b>{service.health}%</b>
              </header>
              <p>{service.description}</p>
              <div className="service-overview-metrics">
                {dashboard.metrics.slice(0, 4).map((metric) => <span key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><em>{metric.detail}</em></span>)}
              </div>
              <footer>
                <span>{service.reports} governed reports</span>
                <button type="button" onClick={() => onOpenDashboard(service.name)} data-local-action="true">Open dashboard <ChevronRight20Regular /></button>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Reporting({
  notify,
  canManage,
}: {
  notify: (m: string) => void;
  canManage: boolean;
}) {
  const [view, setView] = useState<
    "finder" | "service-overview" | "dashboards" | "catalogue" | "operations"
  >("dashboards");
  const [query, setQuery] = useState("");
  const [workload, setWorkload] = useState("All workloads");
  const [plane, setPlane] = useState<ReportPlane>("All planes");
  const [category, setCategory] = useState("All categories");
  const [freshness, setFreshness] = useState("Any freshness");
  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [selected, setSelected] = useState<CatalogueReport | null>(null);
  const [selectedSavedView, setSelectedSavedView] =
    useState<RuntimeReportView | null>(null);
  const [favorites, setFavorites] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [dashboardWorkload, setDashboardWorkload] = useState(
    suiteModules[0].name,
  );
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);
  const [runtimeCenters, setRuntimeCenters] = useState<RuntimeAdminCenter[]>(
    [],
  );
  const [runtimeState, setRuntimeState] = useState<
    "connecting" | "online" | "offline"
  >("connecting");
  const [generating, setGenerating] = useState<string | null>(null);
  const [operations, setOperations] = useState<RuntimeReportOperations | null>(
    null,
  );
  const [operationsState, setOperationsState] = useState<
    "loading" | "ready" | "offline"
  >("loading");
  const [drilldown, setDrilldown] = useState<{
    label: string;
    value: string;
    detail: string;
  } | null>(null);
  const dashboard = dashboardFor(dashboardWorkload);
  const dashboardReports = reportCatalogue
    .filter((report) => report.workload === dashboardWorkload)
    .slice(0, 6);
  const workloads = [
    "All workloads",
    ...Array.from(new Set(reportCatalogue.map((r) => r.workload))),
  ];
  const categories = [
    "All categories",
    ...Array.from(new Set(reportCatalogue.map((r) => r.category))).sort(),
  ];
  const isFresh = (updated: string) => {
    if (freshness === "Any freshness") return true;
    if (updated === "Live") return true;
    const minutes = updated.endsWith("h")
      ? Number.parseInt(updated, 10) * 60
      : Number.parseInt(updated, 10);
    return Number.isFinite(minutes) &&
      (freshness === "Under 15 minutes" ? minutes <= 15 : minutes <= 60);
  };
  const filtered = useMemo(
    () =>
      reportCatalogue
        .filter(
          (r) =>
            (workload === "All workloads" || r.workload === workload) &&
            (plane === "All planes" || reportPlaneFor(r) === plane) &&
            (category === "All categories" || r.category === category) &&
            isFresh(r.updated) &&
            (!favorites || r.favorite) &&
            (!scheduled || r.scheduled) &&
            `${r.name} ${r.description} ${r.category}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .slice(0, 75),
    [query, workload, plane, category, freshness, favorites, scheduled],
  );
  const refreshOperations = async () => {
    try {
      setOperations(await getRuntimeReportOperations());
      setOperationsState("ready");
    } catch {
      setOperationsState("offline");
    }
  };
  useEffect(() => {
    getAdminCenters()
      .then((response) => {
        setRuntimeCenters(response.items);
        setRuntimeState("online");
      })
      .catch(() => setRuntimeState("offline"));
    void refreshOperations();
  }, []);
  const generate = async (
    report: CatalogueReport,
    configuration?: ReportRunConfiguration,
  ) => {
    if (!canManage) {
      notify("Your organization role can inspect reports but cannot execute report jobs.");
      return;
    }
    setGenerating(report.id);
    notify(`${report.name} queued in the persistent report runtime.`);
    try {
      setGenerated(
        configuration?.viewId
          ? await runRuntimeSavedReportView(configuration.viewId)
          : await runRuntimeReport(
              report.name,
              report.workload,
              configuration?.columns,
              configuration?.filters,
            ),
      );
      void refreshOperations();
      notify(
        `${report.name} completed with persisted rows and audit evidence.`,
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "Report runtime failed.");
    } finally {
      setGenerating(null);
    }
  };
  const runSchedule = async (scheduleId: string) => {
    if (!canManage) {
      notify("Only a Platform Administrator or Report Administrator can run schedules.");
      return;
    }
    setGenerating(scheduleId);
    notify("Scheduled view queued for a governed local execution.");
    try {
      setGenerated(await runRuntimeReportSchedule(scheduleId));
      await refreshOperations();
      notify("Scheduled view completed and its run history was persisted.");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Scheduled report execution failed.",
      );
    } finally {
      setGenerating(null);
    }
  };
  return (
    <>
      <Header
        path="INTELLIGENCE / REPORTING"
        title={
          view === "finder"
            ? "Report Finder"
            : view === "service-overview"
              ? "Microsoft 365 service overview"
              : "Microsoft 365 report center"
        }
        description={
          view === "finder"
            ? "Find the right evidence in seconds, then run it through Aegis's governed local reporting workflow."
            : view === "service-overview"
              ? "Compare identity, security, and collaboration posture in one decision-ready operational view."
              : "Search and customize 947 presentation templates across governed Microsoft 365 workload schemas."
        }
      >
        <Btn localAction onClick={() => setView("finder")}>
          <Search20Regular /> Open Report Finder
        </Btn>
        <Btn localAction onClick={() => { setView("operations"); void refreshOperations(); }}>
          <ArrowDownload24Regular /> Run &amp; export history
        </Btn>
        {canManage && (
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
        )}
      </Header>
      <div className="report-summary">
        <Kpi
          label="REPORT CATALOGUE"
          value={reportCatalogue.length.toLocaleString("en-US")}
          detail="Original presentation templates"
        />
        <Kpi
          label="SAVED VIEWS"
          value={String(operations?.summary.views ?? 0)}
          detail={`${operations?.views.filter((item) => item.visibility === "team").length ?? 0} shared with teams`}
          tone="blue"
        />
        <Kpi
          label="ACTIVE SCHEDULES"
          value={String(operations?.summary.activeSchedules ?? 0)}
          detail="Local archive delivery"
          tone="gold"
        />
        <Kpi
          label="MONITORED VIEWS"
          value={String(operations?.summary.activeAlerts ?? 0)}
          detail="Threshold policies active"
          tone="purple"
        />
      </div>
      <div className="report-mode-tabs">
        <button
          className={view === "finder" ? "selected" : ""}
          onClick={() => setView("finder")}
          data-testid="report-finder-tab"
        >
          <Search20Regular /> Report Finder
        </button>
        <button
          className={view === "service-overview" ? "selected" : ""}
          onClick={() => setView("service-overview")}
          data-testid="service-overview-tab"
        >
          <Apps24Regular /> Service overview
        </button>
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
        <button
          className={view === "operations" ? "selected" : ""}
          onClick={() => {
            setView("operations");
            void refreshOperations();
          }}
          data-local-action="true"
        >
          <CalendarClock24Regular /> Views &amp; operations
        </button>
      </div>
      {view === "finder" && (
        <ReportFinderWorkspace
          query={query}
          reports={filtered}
          total={reportCatalogue.length}
          workloads={workloads}
          selectedWorkload={workload}
          plane={plane}
          onQueryChange={setQuery}
          onWorkloadChange={setWorkload}
          onPlaneChange={setPlane}
          onOpen={(report) => {
            setSelectedSavedView(null);
            setSelected(report);
          }}
          onBrowseCatalogue={() => setView("catalogue")}
        />
      )}
      {view === "service-overview" && (
        <ServiceOverview
          onOpenDashboard={(service) => {
            setDashboardWorkload(service);
            setView("dashboards");
          }}
        />
      )}
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
              <span className={`runtime-${runtimeState}`}>
                <i /> Data current · governed snapshot
                {runtimeState === "online" &&
                  ` · ${runtimeCenters.reduce((total, item) => total + item.total, 0).toLocaleString()} persisted objects`}
                {runtimeState === "offline" && " · runtime API offline"}
              </span>
            </header>
            <div className="admin-dashboard-metrics">
              {dashboard.metrics.map((metric) => (
                <button
                  key={metric.label}
                  type="button"
                  data-local-action="true"
                  onClick={() => setDrilldown(metric)}
                  aria-label={`Drill into ${metric.label}`}
                >
                  <small>{metric.label}</small>
                  <strong>{metric.value}</strong>
                  <span>{metric.detail}</span>
                  <em>Open records →</em>
                </button>
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
                  onClick={() => void generate(dashboardReports[0])}
                  disabled={generating !== null || !canManage}
                >
                  <Play24Regular />
                  {!canManage
                    ? "Read-only access"
                    : generating
                    ? "Generating..."
                    : "Generate full dashboard report"}
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
                    onClick={() => void generate(report)}
                    disabled={generating !== null || !canManage}
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
                    ? reportCatalogue.length
                    : reportCatalogue.filter((r) => r.workload === w).length}
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
              <b>{reportCatalogue.filter((item) => item.favorite).length}</b>
            </button>
            <button
              className={scheduled ? "selected" : ""}
              onClick={() => setScheduled(!scheduled)}
            >
              <CalendarClock24Regular />
              <span>Scheduled reports</span>
              <b>{reportCatalogue.filter((item) => item.scheduled).length}</b>
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
              <button
                type="button"
                data-local-action="true"
                className={advancedFilters ? "selected" : ""}
                onClick={() => setAdvancedFilters((current) => !current)}
              >
                <Filter24Regular /> Advanced filters
              </button>
              <span>{filtered.length} of {reportCatalogue.length} shown</span>
            </div>
            {advancedFilters && (
              <div className="catalogue-filters" data-testid="catalogue-advanced-filters">
                <label>
                  Category
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Data freshness
                  <select
                    value={freshness}
                    onChange={(event) => setFreshness(event.target.value)}
                  >
                    <option>Any freshness</option>
                    <option>Under 15 minutes</option>
                    <option>Under 60 minutes</option>
                  </select>
                </label>
                <label className="catalogue-toggle">
                  <input
                    type="checkbox"
                    checked={favorites}
                    onChange={(event) => setFavorites(event.target.checked)}
                  />
                  Favorites only
                </label>
                <label className="catalogue-toggle">
                  <input
                    type="checkbox"
                    checked={scheduled}
                    onChange={(event) => setScheduled(event.target.checked)}
                  />
                  Scheduled templates
                </label>
                <button
                  type="button"
                  data-local-action="true"
                  onClick={() => {
                    setCategory("All categories");
                    setFreshness("Any freshness");
                    setFavorites(false);
                    setScheduled(false);
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
            <div className="catalogue-list">
              <div className="catalogue-head">
                <span>Report</span>
                <span>Workload</span>
                <span>Rows</span>
                <span>Freshness</span>
                <span />
              </div>
              {filtered.map((r) => (
                <button key={r.id} onClick={() => { setSelectedSavedView(null); setSelected(r); }}>
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
      {view === "operations" && (
        <ReportOperationsWorkspace
          operations={operations}
          state={operationsState}
          canManage={canManage}
          generating={generating}
          onRefresh={() => void refreshOperations()}
          onRun={(scheduleId) => void runSchedule(scheduleId)}
          onOpen={(savedView) => {
            const report = reportCatalogue.find(
              (item) => item.id === savedView.reportId,
            );
            if (report) {
              setSelectedSavedView(savedView);
              setSelected(report);
              return;
            }
            notify("The source template is no longer present in this catalogue.");
          }}
        />
      )}
      {drilldown && (
        <DashboardMetricDrilldown
          workload={dashboardWorkload}
          metric={drilldown}
          columns={dashboard.columns}
          rows={dashboard.rows}
          canManage={canManage}
          onClose={() => setDrilldown(null)}
          onRun={() => {
            const report = dashboardReports[0];
            if (report) void generate(report);
            setDrilldown(null);
          }}
        />
      )}
      {selected && (
        <ReportDrawer
          report={selected}
          initialView={selectedSavedView}
          onClose={() => { setSelected(null); setSelectedSavedView(null); }}
          notify={notify}
          onRun={(configuration) => {
            void generate(selected, configuration);
            setSelected(null);
            setSelectedSavedView(null);
          }}
          onSaved={() => void refreshOperations()}
          canManage={canManage}
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

function DashboardMetricDrilldown({
  workload,
  metric,
  columns,
  rows,
  canManage,
  onClose,
  onRun,
}: {
  workload: string;
  metric: { label: string; value: string; detail: string };
  columns: string[];
  rows: string[][];
  canManage: boolean;
  onClose: () => void;
  onRun: () => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <aside className="detail-drawer suite-drawer metric-drilldown" data-testid="dashboard-metric-drilldown" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head"><span><DataTrending24Regular /><small>COUNT DRILL-DOWN · {workload}</small></span><button type="button" data-local-action="true" onClick={onClose}>×</button></div>
        <h2>{metric.label}</h2>
        <p className="drawer-sub">{metric.value} · {metric.detail}</p>
        <section><h3>Records contributing to this indicator</h3><p>The table is a synthetic workload preview. Generate the full report to query the persistent local resource store.</p><div className="metric-drill-table"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.slice(0, 8).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table></div></section>
        <section><h3>Evidence context</h3><div className="report-definition-summary"><span><b>{workload}</b> source</span><span><b>Current</b> snapshot</span><span><b>Local</b> boundary</span><span><b>Audited</b> execution</span></div></section>
        {!canManage && <div className="report-readonly"><ShieldCheckmark24Regular /> Read-only access: ask a Report Administrator to execute or save this view.</div>}
        <div className="drawer-actions"><Btn localAction onClick={onClose}>Close</Btn>{canManage && <Btn primary localAction onClick={onRun}><Play24Regular /> Generate full evidence</Btn>}</div>
      </aside>
    </div>
  );
}

function ReportOperationsWorkspace({
  operations,
  state,
  canManage,
  generating,
  onRefresh,
  onRun,
  onOpen,
}: {
  operations: RuntimeReportOperations | null;
  state: "loading" | "ready" | "offline";
  canManage: boolean;
  generating: string | null;
  onRefresh: () => void;
  onRun: (scheduleId: string) => void;
  onOpen: (view: RuntimeReportView) => void;
}) {
  const viewById = new Map(
    (operations?.views ?? []).map((item) => [item.id, item]),
  );
  return (
    <div className="report-operations" data-testid="report-operations">
      <header>
        <div>
          <small>LOCAL REPORT CONTROL PLANE</small>
          <h2>Saved views, schedules, alerts, and execution evidence</h2>
          <p>
            Every object is tenant-scoped and persisted locally. Scheduled runs
            currently retain results in the local runtime archive; external email or
            Teams delivery requires a configured connector.
          </p>
        </div>
        <button type="button" data-local-action="true" onClick={onRefresh}>
          <ArrowSync24Regular /> Refresh
        </button>
      </header>
      {state !== "ready" ? (
        <div className={`report-operations-state ${state}`}>
          {state === "loading"
            ? "Loading persistent reporting state…"
            : "The local reporting API is unavailable. Start the API to manage saved views."}
        </div>
      ) : (
        <>
          <div className="report-operations-summary">
            {[
              ["Saved views", operations?.summary.views ?? 0, "Reusable report definitions"],
              ["Active schedules", operations?.summary.activeSchedules ?? 0, "Next-run metadata tracked"],
              ["Active alerts", operations?.summary.activeAlerts ?? 0, "Threshold policies evaluated"],
              ["Completed runs", operations?.summary.completedRuns ?? 0, "Execution evidence retained"],
            ].map(([label, value, detail]) => (
              <article key={String(label)}>
                <small>{label}</small>
                <strong>{value}</strong>
                <span>{detail}</span>
              </article>
            ))}
          </div>
          <section className="report-operation-section">
            <header>
              <div><strong>Saved report views</strong><small>Filters and columns are immutable execution inputs</small></div>
              <b>{operations?.views.length ?? 0}</b>
            </header>
            <div className="saved-view-grid">
              {(operations?.views ?? []).map((item) => (
                <article key={item.id}>
                  <span><DocumentBulletList24Regular /></span>
                  <div>
                    <small>{item.workload} · {item.visibility}</small>
                    <strong>{item.name}</strong>
                    <p>{item.filters.length} filters · {item.columns.length} columns · owner {item.createdBy}</p>
                  </div>
                  <button type="button" data-local-action="true" onClick={() => onOpen(item)}>Open</button>
                </article>
              ))}
              {!operations?.views.length && <p className="empty-operation">Save a configured report view to begin.</p>}
            </div>
          </section>
          <div className="report-operation-grid">
            <section className="report-operation-section">
              <header><div><strong>Schedules</strong><small>Manual acceptance runs and next-run plan</small></div><b>{operations?.schedules.length ?? 0}</b></header>
              <div className="operation-list">
                {(operations?.schedules ?? []).map((item) => (
                  <article key={item.id}>
                    <div><strong>{item.name}</strong><small>{item.cadence} at {item.runAt} · {item.timezone}</small></div>
                    <span className={`operation-status ${item.status}`}>{item.status}</span>
                    <small>Next {item.nextRunAt ? new Date(item.nextRunAt).toLocaleString() : "pending calculation"}</small>
                    <button type="button" data-local-action="true" disabled={generating !== null || !canManage} onClick={() => onRun(item.id)}>{!canManage ? "Read-only" : generating === item.id ? "Running…" : "Run now"}</button>
                  </article>
                ))}
                {!operations?.schedules.length && <p className="empty-operation">No scheduled views yet.</p>}
              </div>
            </section>
            <section className="report-operation-section">
              <header><div><strong>Threshold alerts</strong><small>Evaluated whenever the linked view runs</small></div><b>{operations?.alerts.length ?? 0}</b></header>
              <div className="operation-list">
                {(operations?.alerts ?? []).map((item) => (
                  <article key={item.id}>
                    <div><strong>{item.name}</strong><small>{item.metric.replaceAll("_", " ")} {item.operator} {item.threshold}</small></div>
                    <span className={`alert-severity ${item.severity}`}>{item.severity}</span>
                    <small>{item.lastObservedValue === undefined ? "Awaiting first evaluation" : `Last value ${item.lastObservedValue}`}</small>
                    <b>{item.status}</b>
                  </article>
                ))}
                {!operations?.alerts.length && <p className="empty-operation">No report alerts yet.</p>}
              </div>
            </section>
          </div>
          <section className="report-operation-section">
            <header><div><strong>Execution history</strong><small>Interactive and scheduled report jobs</small></div><b>{operations?.runs.length ?? 0}</b></header>
            <div className="report-run-table">
              <div><b>Report</b><b>Trigger</b><b>Status</b><b>Rows</b><b>Started</b></div>
              {(operations?.runs ?? []).slice(0, 12).map((item) => (
                <div key={item.id}>
                  <span>{viewById.get(item.viewId ?? "")?.name ?? item.name}</span>
                  <span>{item.trigger?.replaceAll("_", " ") ?? "interactive"}</span>
                  <span className={`operation-status ${item.status}`}>{item.status}</span>
                  <span>{item.result?.totalRows?.toLocaleString("en-US") ?? "—"}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {!operations?.runs.length && <p className="empty-operation">Run history appears after the first report execution.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ReportDrawer({
  report,
  initialView,
  onClose,
  notify,
  onRun,
  onSaved,
  canManage,
}: {
  report: CatalogueReport;
  initialView: RuntimeReportView | null;
  onClose: () => void;
  notify: (m: string) => void;
  onRun: (configuration: ReportRunConfiguration) => void;
  onSaved: () => void;
  canManage: boolean;
}) {
  const [tab, setTab] = useState<"Preview" | "Columns" | "Filters" | "Schedule" | "Alert">("Preview");
  const [viewName, setViewName] = useState(
    initialView?.name ?? `${report.name} · operations view`,
  );
  const [visibility, setVisibility] = useState<"private" | "team">(
    initialView?.visibility ?? "team",
  );
  const [favorite, setFavorite] = useState(
    initialView?.favorite ?? report.favorite,
  );
  const [columns, setColumns] = useState<string[]>(
    initialView?.columns ?? enterpriseReportColumns.slice(0, 8),
  );
  const [filters, setFilters] = useState<ReportFilter[]>(
    initialView?.filters.map((filter) => ({ ...filter })) ?? [],
  );
  const [savedView, setSavedView] = useState<RuntimeReportView | null>(
    initialView,
  );
  const [savedVersions, setSavedVersions] = useState(initialView ? 1 : 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scheduleName, setScheduleName] = useState(`${report.name} · weekly review`);
  const [cadence, setCadence] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [runAt, setRunAt] = useState("08:00");
  const [timezone, setTimezone] = useState("Asia/Dubai");
  const [scheduleCreated, setScheduleCreated] = useState("");
  const [alertName, setAlertName] = useState(`${report.name} · risk threshold`);
  const [alertMetric, setAlertMetric] = useState<"row_count" | "critical_count" | "warning_count" | "average_risk">("critical_count");
  const [alertOperator, setAlertOperator] = useState<"gt" | "gte" | "eq" | "lte" | "lt">("gte");
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [alertSeverity, setAlertSeverity] = useState<"info" | "warning" | "critical">("warning");
  const [alertCreated, setAlertCreated] = useState("");

  const saveView = async () => {
    if (!viewName.trim()) throw new Error("A saved view name is required.");
    if (!columns.length) throw new Error("Select at least one report column.");
    setSaving(true);
    setError("");
    try {
      const created = await createRuntimeReportView({
        reportId: report.id,
        name: savedVersions
          ? `${viewName.trim()} · revision ${savedVersions + 1}`
          : viewName.trim(),
        reportName: report.name,
        workload: report.workload,
        description: report.description,
        columns,
        filters,
        visibility,
        favorite,
      });
      setSavedView(created);
      setSavedVersions((current) => current + 1);
      onSaved();
      notify(`${created.name} saved with ${filters.length} filters and ${columns.length} columns.`);
      return created;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The report view could not be saved.";
      setError(message);
      throw caught;
    } finally {
      setSaving(false);
    }
  };
  const ensureView = async () => savedView ?? saveView();
  const saveSchedule = async () => {
    setSaving(true);
    setError("");
    try {
      const view = await ensureView();
      const created = await createRuntimeReportSchedule(view.id, {
        name: scheduleName,
        cadence,
        timezone,
        runAt,
        ...(cadence === "weekly" ? { dayOfWeek: 1 } : {}),
        ...(cadence === "monthly" ? { dayOfMonth: 1 } : {}),
        delivery: "local_archive",
        status: "active",
      });
      setScheduleCreated(`Active · next ${created.nextRunAt ? new Date(created.nextRunAt).toLocaleString() : "run calculated"}`);
      onSaved();
      notify(`${created.name} activated with governed local-archive delivery.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The schedule could not be created.");
    } finally {
      setSaving(false);
    }
  };
  const saveAlert = async () => {
    setSaving(true);
    setError("");
    try {
      const view = await ensureView();
      const created = await createRuntimeReportAlert(view.id, {
        name: alertName,
        metric: alertMetric,
        operator: alertOperator,
        threshold: alertThreshold,
        severity: alertSeverity,
        status: "active",
      });
      setAlertCreated(`Active · ${created.metric.replaceAll("_", " ")} ${created.operator} ${created.threshold}`);
      onSaved();
      notify(`${created.name} activated and linked to this report view.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The alert could not be created.");
    } finally {
      setSaving(false);
    }
  };
  const quickFilters: Array<{ label: string; filter: ReportFilter }> = [
    { label: "High risk", filter: { field: "risk", operator: "gte", value: "70", logic: "and" } },
    { label: "External exposure", filter: { field: "external", operator: "equals", value: "true", logic: "and" } },
    { label: "Needs attention", filter: { field: "status", operator: "equals", value: "warning", logic: "and" } },
    { label: "Low activity", filter: { field: "activityScore", operator: "lte", value: "25", logic: "and" } },
  ];
  const applyQuickFilter = (candidate: ReportFilter) => {
    setSavedView(null);
    setFilters((current) => current.some((item) => item.field === candidate.field && item.operator === candidate.operator && item.value === candidate.value)
      ? current
      : [...current, candidate]);
    notify(`${candidate.field.replace(/([A-Z])/g, " $1")} filter added to this report definition.`);
  };
  const insightBars = [44, 61, 53, 78, 68, 88, 74, 92, 71, 84, 96, 81];
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
          <button type="button" data-local-action="true" onClick={onClose}>×</button>
        </div>
        <h2>{report.name}</h2>
        <p className="drawer-sub">{report.description}</p>
        <div className="drawer-tabs">
          {(["Preview", "Columns", "Filters", ...(canManage ? ["Schedule", "Alert"] as const : [])] as const).map((item) => (
            <button
              key={item}
              type="button"
              data-local-action="true"
              className={tab === item ? "selected" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="report-config">
          {tab === "Preview" && (
            <>
              <section>
                <h3>Easy filters</h3>
                <p className="config-help">Apply common decision filters without building expressions. Each selection becomes a visible server-side condition.</p>
                <div className="report-easy-filters">
                  {quickFilters.map((item) => {
                    const active = filters.some((filter) => filter.field === item.filter.field && filter.operator === item.filter.operator && filter.value === item.filter.value);
                    return <button type="button" key={item.label} className={active ? "selected" : ""} onClick={() => applyQuickFilter(item.filter)}>{active ? "✓ " : ""}{item.label}</button>;
                  })}
                  {filters.length > 0 && <button type="button" className="clear" onClick={() => { setSavedView(null); setFilters([]); notify("All report filters cleared."); }}>Clear filters</button>}
                </div>
              </section>
              <section>
                <h3>Report scope</h3>
                <div className="config-row">
                  <span>Tenant<strong>Northstar Example Group (synthetic)</strong></span>
                  <span>Snapshot<strong>Current · {report.updated} old</strong></span>
                </div>
              </section>
              <section className="report-visual-signal">
                <header><div><h3>Live visual context</h3><p>Signal distribution updates when this saved definition runs.</p></div><span>30-day trend</span></header>
                <div className="report-visual-bars" aria-label="Thirty day report trend">
                  {insightBars.map((value, index) => <i key={index} style={{ height: `${value}%` }} title={`Interval ${index + 1}: ${value}`} />)}
                </div>
                <footer><span>Earlier</span><b>Current evidence set</b><span>Now</span></footer>
              </section>
              <section>
                <h3>Execution definition</h3>
                <div className="report-definition-summary">
                  <span><b>{columns.length}</b> selected columns</span>
                  <span><b>{filters.length}</b> active filters</span>
                  <span><b>{visibility}</b> visibility</span>
                  <span><b>{favorite ? "yes" : "no"}</b> favorite</span>
                </div>
              </section>
              <section>
                <h3>Schema preview</h3>
                <div className="preview-table dynamic-preview">
                  <div><b>Display name</b><b>Department</b><b>Status</b></div>
                  {[
                    ["Identity 00042", "Finance", "warning"],
                    ["Identity 00118", "Security", "critical"],
                    ["Identity 00273", "Operations", "healthy"],
                  ].map((row) => <div key={row[0]}>{row.map((value) => <span key={value}>{value}</span>)}</div>)}
                </div>
                <p className="config-disclosure">Synthetic schema preview. Run report queries the tenant-scoped local resource store using this exact definition.</p>
              </section>
            </>
          )}
          {tab === "Columns" && (
            <section>
              <h3>Column designer</h3>
              <p className="config-help">Select the fields included in interactive, exported, and scheduled results.</p>
              <div className="column-picker">
                {enterpriseReportColumns.map((column) => (
                  <label key={column}>
                    <input
                      type="checkbox"
                      checked={columns.includes(column)}
                      onChange={(event) => {
                        setSavedView(null);
                        setColumns((current) => event.target.checked ? [...current, column] : current.filter((item) => item !== column));
                      }}
                    />
                    <span>{column}</span>
                    <small>{columns.includes(column) ? `Position ${columns.indexOf(column) + 1}` : "Excluded"}</small>
                  </label>
                ))}
              </div>
            </section>
          )}
          {tab === "Filters" && (
            <section>
              <h3>Advanced filter builder</h3>
              <p className="config-help">AND/OR conditions are validated and applied server-side before rows and metrics are calculated.</p>
              <div className="advanced-filter-builder">
                {filters.map((filter, index) => (
                  <div key={`${filter.field}-${index}`}>
                    <select value={filter.logic} disabled={index === 0} onChange={(event) => { setSavedView(null); setFilters((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, logic: event.target.value as "and" | "or" } : item)); }}><option value="and">AND</option><option value="or">OR</option></select>
                    <select value={filter.field} onChange={(event) => { setSavedView(null); setFilters((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, field: event.target.value as ReportFilter["field"] } : item)); }}>
                      {["status", "risk", "department", "region", "type", "external", "activityScore"].map((field) => <option key={field} value={field}>{field.replace(/([A-Z])/g, " $1")}</option>)}
                    </select>
                    <select value={filter.operator} onChange={(event) => { setSavedView(null); setFilters((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, operator: event.target.value as ReportFilter["operator"] } : item)); }}><option value="equals">equals</option><option value="not_equals">does not equal</option><option value="contains">contains</option><option value="gte">greater/equal</option><option value="lte">less/equal</option></select>
                    <input aria-label={`Filter ${index + 1} value`} value={filter.value} placeholder="Value" onChange={(event) => { setSavedView(null); setFilters((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item)); }} />
                    <button type="button" data-local-action="true" aria-label={`Remove filter ${index + 1}`} onClick={() => { setSavedView(null); setFilters((current) => current.filter((_, itemIndex) => itemIndex !== index)); }}>×</button>
                  </div>
                ))}
                <button type="button" data-local-action="true" onClick={() => { setSavedView(null); setFilters((current) => [...current, { field: "status", operator: "equals", value: "warning", logic: "and" }]); }}>+ Add condition</button>
              </div>
              {!filters.length && <div className="empty-config">No filters: execution includes every resource in the selected workload.</div>}
            </section>
          )}
          {tab === "Schedule" && (
            <section>
              <h3>Schedule this exact view</h3>
              <p className="config-help">The persisted filter and column snapshot is reused on each run. Delivery remains inside this instance.</p>
              <div className="report-form-grid">
                <label>Schedule name<input value={scheduleName} onChange={(event) => setScheduleName(event.target.value)} /></label>
                <label>Cadence<select value={cadence} onChange={(event) => setCadence(event.target.value as typeof cadence)}><option value="daily">Daily</option><option value="weekly">Weekly · Monday</option><option value="monthly">Monthly · first day</option></select></label>
                <label>Run at<input type="time" value={runAt} onChange={(event) => setRunAt(event.target.value)} /></label>
                <label>Timezone<select value={timezone} onChange={(event) => setTimezone(event.target.value)}><option>Asia/Dubai</option><option>UTC</option><option>Europe/London</option><option>Asia/Singapore</option></select></label>
                <label className="full-field">Delivery target<input value="Local runtime report archive" disabled /></label>
              </div>
              {scheduleCreated && <div className="config-success"><CheckmarkCircle24Regular /> {scheduleCreated}</div>}
            </section>
          )}
          {tab === "Alert" && (
            <section>
              <h3>Monitor report results</h3>
              <p className="config-help">Evaluate a governed threshold each time this exact saved view completes.</p>
              <div className="report-form-grid">
                <label>Alert name<input value={alertName} onChange={(event) => setAlertName(event.target.value)} /></label>
                <label>Metric<select value={alertMetric} onChange={(event) => setAlertMetric(event.target.value as typeof alertMetric)}><option value="row_count">Row count</option><option value="critical_count">Critical count</option><option value="warning_count">Warning count</option><option value="average_risk">Average risk</option></select></label>
                <label>Operator<select value={alertOperator} onChange={(event) => setAlertOperator(event.target.value as typeof alertOperator)}><option value="gt">Greater than</option><option value="gte">Greater or equal</option><option value="eq">Equals</option><option value="lte">Less or equal</option><option value="lt">Less than</option></select></label>
                <label>Threshold<input type="number" min="0" value={alertThreshold} onChange={(event) => setAlertThreshold(Number(event.target.value))} /></label>
                <label>Severity<select value={alertSeverity} onChange={(event) => setAlertSeverity(event.target.value as typeof alertSeverity)}><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label>
              </div>
              {alertCreated && <div className="config-success"><CheckmarkCircle24Regular /> {alertCreated}</div>}
            </section>
          )}
        </div>
        {canManage && <div className="saved-view-strip">
          <label>Saved view name<input value={viewName} onChange={(event) => { setViewName(event.target.value); setSavedView(null); }} /></label>
          <label>Visibility<select value={visibility} onChange={(event) => { setVisibility(event.target.value as "private" | "team"); setSavedView(null); }}><option value="team">Team</option><option value="private">Private</option></select></label>
          {savedView && <span><CheckmarkCircle24Regular /> Persisted · {savedView.id.slice(0, 8)}</span>}
        </div>}
        {error && <div className="report-config-error" role="alert">{error}</div>}
        {!canManage && <div className="report-readonly"><ShieldCheckmark24Regular /> Read-only access: view configuration is available, but execution and persistence require Report Administrator or Platform Administrator.</div>}
        <div className="drawer-actions">
          {canManage && <Btn localAction onClick={() => { setFavorite((current) => !current); setSavedView(null); }}>
            {favorite ? "★ Favorited" : "☆ Favorite"}
          </Btn>}
          {canManage && <Btn localAction disabled={saving} onClick={() => void saveView().catch(() => undefined)}>
            {saving ? "Saving…" : savedVersions ? "Save revision" : "Save view"}
          </Btn>}
          {canManage && tab === "Schedule" && <Btn localAction disabled={saving} onClick={() => void saveSchedule()}><CalendarClock24Regular /> Activate schedule</Btn>}
          {canManage && tab === "Alert" && <Btn localAction disabled={saving} onClick={() => void saveAlert()}><Alert24Regular /> Activate alert</Btn>}
          {canManage && <Btn
            primary
            localAction
            onClick={() => {
              if (!columns.length) {
                setError("Select at least one report column before running.");
                return;
              }
              notify(`${report.name} submitted with ${filters.length} server-side filters.`);
              onRun({ columns, filters, viewId: savedView?.id });
            }}
          >
            <Play24Regular /> Run report
          </Btn>}
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
  const [caseEvents, setCaseEvents] = useState<string[]>([]);
  const [savedAlert, setSavedAlert] = useState<string | null>(null);
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
          onClick={() => {
            const name = `Audit policy · ${workload} · ${highRisk ? "High+" : "all risks"}`;
            setSavedAlert(name);
            notify(`${name} saved with ${events.length} current matches.`);
          }}
        >
          <Alert24Regular /> Create alert
        </Btn>
      </Header>
      {(savedAlert || caseEvents.length > 0) && (
        <div className="demo-notice" data-testid="audit-action-outcome">
          <span><CheckmarkCircle24Regular /></span>
          <div>
            <strong>AUDIT WORKFLOW STATE</strong>
            <p>{savedAlert ? `${savedAlert} is active. ` : ""}{caseEvents.length} event{caseEvents.length === 1 ? "" : "s"} attached to CASE-4428.</p>
          </div>
          <b>LOCAL · PERSISTED IN SESSION</b>
        </div>
      )}
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
          detail="Hash-chain integrity checks"
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
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="h" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  background: "var(--chart-tooltip)",
                  border: "1px solid var(--stroke)",
                }}
              />
              <Bar dataKey="v" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
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
                onClick={() => {
                  const key = `${selected.time}-${selected.activity}`;
                  setCaseEvents((items) => items.includes(key) ? items : [...items, key]);
                  notify("Audit event attached to investigation CASE-4428.");
                }}
              >
                Add to case
              </Btn>
              <Btn
                primary
                onClick={() => {
                  setSavedAlert(`Alert from ${selected.activity}`);
                  notify("Alert policy drafted from this audit activity pattern.");
                }}
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
  const [showDeliveryHistory, setShowDeliveryHistory] = useState(false);
  const [deliveryResults, setDeliveryResults] = useState<Array<{ policy: string; channels: string; at: string }>>([]);
  return (
    <>
      <Header
        path="OPERATIONS / ALERTING"
        title="Intelligent alert policies"
        description="Detect meaningful Microsoft 365 changes and route enriched notifications without alert fatigue."
      >
        <Btn localAction onClick={() => setShowDeliveryHistory((value) => !value)}>Delivery history</Btn>
        <Btn
          primary
          onClick={() =>
            notify(
              "Alert policy builder opened with governed reporting signals available.",
            )
          }
        >
          + New alert policy
        </Btn>
      </Header>
      {showDeliveryHistory && (
        <Card title="Delivery test history" subtitle="Synthetic provider acknowledgements created by policy tests">
          <div className="compact-table" data-testid="alert-delivery-history">
            <div className="compact-head"><span>Policy</span><span>Channels</span><span>Result</span><span>Observed</span></div>
            {deliveryResults.map((item) => (
              <div className="compact-row" key={`${item.policy}-${item.at}`}>
                <strong>{item.policy}</strong><span>{item.channels}</span><b className="status active">Delivered</b><span>{item.at}</span>
              </div>
            ))}
            {!deliveryResults.length && <p className="suite-empty">No test deliveries in this session. Use Test on a policy to create a traceable result.</p>}
          </div>
        </Card>
      )}
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
                  onClick={() => {
                    const at = new Date().toLocaleTimeString();
                    setDeliveryResults((items) => [{ policy: p.name, channels: p.channels, at }, ...items].slice(0, 20));
                    setShowDeliveryHistory(true);
                    notify(`Synthetic test delivery acknowledged for “${p.name}” across ${p.channels}.`);
                  }}
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
  const [preview, setPreview] = useState<(typeof reminderAgents)[number] | null>(null);
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
                onClick={() => {
                  setPreview(a);
                  notify(`Preview prepared for the next “${a.name}” message.`);
                }}
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
      {preview && (
        <div className="modal-backdrop" onMouseDown={() => setPreview(null)}>
          <aside className="detail-drawer suite-drawer" data-testid="reminder-message-preview" onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-head"><span><CalendarClock24Regular /><small>LOCAL MESSAGE PREVIEW</small></span><button aria-label="Close reminder preview" onClick={() => setPreview(null)}>×</button></div>
            <h2>{preview.name}</h2>
            <p className="drawer-sub">Audience: {preview.audience} · Owner: {preview.owner}</p>
            <section><h3>Subject</h3><p>Action required: complete {preview.name.toLowerCase()}</p></section>
            <section><h3>Rendered message</h3><div className="evidence-box"><Mail24Regular /><p>Hello {'{{displayName}}'}, your required action remains incomplete. Please complete it before {'{{dueDate}}'} or contact {preview.owner} for an approved exception.</p><b>Synthetic preview · no message sent</b></div></section>
            <section><h3>Delivery plan</h3><p>{preview.cadence} · next evaluated run {preview.next} · manager escalation enabled after final reminder.</p></section>
            <div className="drawer-actions"><Btn onClick={() => setPreview(null)}>Close preview</Btn></div>
          </aside>
        </div>
      )}
    </>
  );
}

function Delegation({ notify }: { notify: (m: string) => void }) {
  const [reviewing, setReviewing] = useState<(typeof delegatedRoles)[number] | null>(null);
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, string>>({});
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
                  {reviewDecisions[r.name] ?? r.expires}
                </span>
                <button
                  onClick={() => {
                    setReviewing(r);
                    notify(`Access review opened for ${r.name}.`);
                  }}
                >
                  Review
                </button>
              </footer>
            </article>
          ))}
        </div>
      </Card>
      {reviewing && (
        <div className="modal-backdrop" onMouseDown={() => setReviewing(null)}>
          <aside className="detail-drawer suite-drawer" data-testid="delegation-access-review" onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-head"><span><PeopleTeam24Regular /><small>ACCESS REVIEW</small></span><button aria-label="Close access review" onClick={() => setReviewing(null)}>×</button></div>
            <h2>{reviewing.name}</h2>
            <p className="drawer-sub">{reviewing.scope} · {reviewing.members} members · {reviewing.permissions} capabilities</p>
            <section><h3>Effective access</h3><p>This review is scoped to the displayed delegated role. No Microsoft 365 directory role is changed by the local demonstration.</p></section>
            <section><h3>Reviewer decision</h3><div className="owner-row"><span>Residual risk<strong>{reviewing.risk}</strong></span><span>Current expiry<strong>{reviewing.expires}</strong></span></div></section>
            <div className="drawer-actions">
              <Btn onClick={() => { setReviewDecisions((items) => ({ ...items, [reviewing.name]: "Revocation requested" })); notify(`${reviewing.name} revocation request recorded.`); setReviewing(null); }}>Request revoke</Btn>
              <Btn primary onClick={() => { setReviewDecisions((items) => ({ ...items, [reviewing.name]: "Reviewed · 90 days" })); notify(`${reviewing.name} approved for 90 days in the local review record.`); setReviewing(null); }}>Approve 90 days</Btn>
            </div>
          </aside>
        </div>
      )}
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
  const [scan, setScan] = useState<{ at: string; healthy: number; warnings: number } | null>(null);
  const [topology, setTopology] = useState<(typeof hybridHealth)[number] | null>(null);
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
          onClick={() => {
            const result = {
              at: new Date().toLocaleString(),
              healthy: hybridHealth.filter((item) => item.replication !== "Warning").length,
              warnings: hybridHealth.filter((item) => item.replication === "Warning").length,
            };
            setScan(result);
            notify(`Hybrid health scan completed: ${result.healthy} healthy, ${result.warnings} warning.`);
          }}
        >
          <ArrowSync24Regular /> Run health scan
        </Btn>
      </Header>
      {scan && (
        <div className="demo-notice" data-testid="hybrid-scan-result">
          <span><ArrowSync24Regular /></span><div><strong>HEALTH SCAN COMPLETED</strong><p>{scan.healthy} healthy domains · {scan.warnings} warning · observed {scan.at}</p></div><b>SYNTHETIC · LOCAL</b>
        </div>
      )}
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
                onClick={() => {
                  setTopology(d);
                  notify(`${d.name} topology loaded from the local directory snapshot.`);
                }}
              >
                Explore topology <ChevronRight20Regular />
              </button>
            </article>
          ))}
        </div>
      </Card>
      {topology && (
        <div className="modal-backdrop" onMouseDown={() => setTopology(null)}>
          <aside className="detail-drawer suite-drawer" data-testid="hybrid-topology" onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-head"><span><Database24Regular /><small>DIRECTORY TOPOLOGY</small></span><button aria-label="Close topology" onClick={() => setTopology(null)}>×</button></div>
            <h2>{topology.name}</h2><p className="drawer-sub">{topology.type} · local collector snapshot</p>
            <section><h3>Topology summary</h3><div className="owner-row"><span>Controllers<strong>{topology.controllers}</strong></span><span>Objects<strong>{topology.objects}</strong></span></div></section>
            <section><h3>Replication path</h3><div className="action-steps">{["Primary site → Hub controller", "Hub controller → Regional sites", "Regional sites → Entra Connect staging"].map((step, index) => <span key={step}><b>{index + 1}</b>{step}<CheckmarkCircle24Regular /></span>)}</div></section>
            <section><h3>Collection evidence</h3><p>Last synchronization {topology.sync}. Replication state: {topology.replication}. This view uses synthetic directory metadata and performs no remote query.</p></section>
            <div className="drawer-actions"><Btn onClick={() => setTopology(null)}>Close topology</Btn></div>
          </aside>
        </div>
      )}
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

export function SuiteWorkspace({ page, notify, roles }: Props) {
  switch (page) {
    case "Explorer 360":
      return <Explorer notify={notify} />;
    case "Reporting":
      return (
        <Reporting
          notify={notify}
          canManage={roles.some((role) =>
            ["platform-admin", "report-admin"].includes(role),
          )}
        />
      );
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

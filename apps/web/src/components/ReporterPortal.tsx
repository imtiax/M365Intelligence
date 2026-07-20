"use client";

// Reporter 360 is an original reporting portal backed by the synthetic tenant.
// Every control is live: exports produce real files through the platform
// reporting engine, schedules execute with run history and empty-result
// suppression, alert policies evaluate against the data, and workspace state
// (views/schedules/alerts) is seeded and persisted per browser.

import { useEffect, useMemo, useState } from "react";
import {
  Alert24Regular,
  ArrowDownload24Regular,
  ChevronDown16Regular,
  ClipboardTask24Regular,
  CloudCheckmark24Regular,
  Database24Regular,
  Desktop24Regular,
  DocumentBulletList24Regular,
  Grid24Regular,
  Mail24Regular,
  PeopleTeam24Regular,
  Person24Regular,
  Save24Regular,
  Search20Regular,
  Settings24Regular,
  ShieldCheckmark24Regular,
} from "@fluentui/react-icons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  analyticsSeries,
  columnCatalog,
  dashboardTiles,
  PLANE_LABEL,
  reportCatalog,
  seedAlerts,
  seedSchedules,
  seedViews,
  SERVICES,
  tables,
  type Column,
  type Filter,
  type Plane,
  type PortalAlert,
  type PortalSchedule,
  type PortalView,
  type ReportDef,
  type Row,
  type ScheduleRun,
  type SortSpec,
} from "@/data/portal";
import {
  applyFilter,
  baseRows as engineBaseRows,
  columnTypeFor,
  columnsFor,
  computeRows,
  evaluateAlertPolicy,
  findReport,
  metricHistory,
  scheduleWindowLabel,
  sortRows,
  toGeneratedReport,
} from "@/lib/portal-engine";
import {
  exportReportCsv,
  exportReportExcel,
  exportReportHtml,
  exportReportPdf,
  exportReportRaw,
} from "@/lib/reporting";
import { roleLabels, type PlatformRole } from "@/lib/identity";

// Validated categorical palette (dataviz skill, references/palette.md) — fixed
// hue order, red reserved for critical status and never assigned to a service.
const PALETTE = ["#2a78d6", "#008300", "#e87ba4", "#eda100", "#1baf7a", "#eb6834", "#4a3aa7", "#e34948"];
const OTHER_FILL = "#c9c7bd";
const SERVICE_COLOR: Record<string, string> = {
  "Entra ID": "#2a78d6", "Exchange Online": "#008300", "Microsoft Teams": "#e87ba4",
  "SharePoint Online": "#eda100", OneDrive: "#1baf7a", "Intune & Devices": "#eb6834", "Security & Compliance": "#4a3aa7",
};
const SERVICE_ICON: Record<string, typeof Person24Regular> = {
  "Entra ID": Person24Regular, "Exchange Online": Mail24Regular, "Microsoft Teams": PeopleTeam24Regular,
  "SharePoint Online": Database24Regular, OneDrive: CloudCheckmark24Regular, "Intune & Devices": Desktop24Regular,
  "Security & Compliance": ShieldCheckmark24Regular,
};
// Status series (pass/fail semantics) draw from the reserved status palette
// instead of the categorical order, so "good" always reads green everywhere.
const STATUS_SERIES_COLOR: Record<string, string> = {
  Success: "#0ca30c", Compliant: "#0ca30c", Failure: "#d03b3b", "Non-compliant": "#d03b3b",
};
const CHART_TOOLTIP_STYLE = { borderRadius: 10, border: "1px solid rgba(11,11,11,0.08)", boxShadow: "0 12px 28px rgba(11,11,11,0.10)", fontSize: 12, padding: "8px 12px" };
const LEGEND_STYLE = { fontSize: 11.5, color: "#52514e" };

const GOOD = new Set(["Success", "Compliant", "Enabled", "Licensed", "Yes", "Enforced", "Satisfied", "None", "Member", "Private", "Blocked", "Active", "Closed", "Normal", "delivered", "Delivered"]);
const BAD = new Set(["Failure", "Failed", "Non-compliant", "High", "No", "Anyone links", "Public", "Fired"]);
const WARN = new Set(["Medium", "In grace period", "Unlicensed", "Guest", "External", "Report-only", "Legacy client", "Litigation hold", "Paused", "Investigating", "suppressed", "Suppressed"]);

type Route =
  | { kind: "home" }
  | { kind: "report"; id: string; preset?: Filter[]; presetColumns?: string[]; presetSort?: SortSpec[] }
  | { kind: "views" }
  | { kind: "schedules" }
  | { kind: "alerts" };

type Snapshot = { columns: string[]; filters: Filter[]; sort: SortSpec[] };
type Delivery = { def: ReportDef; schedule: PortalSchedule; rows: Row[]; outcome: "delivered" | "suppressed"; windowLabel: string };
type Profile = { username: string; name: string; title: string; roles: PlatformRole[] };

const fmt = (n: number) => n.toLocaleString("en-US");
const nowStamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

function badgeClass(value: string): string {
  if (GOOD.has(value)) return "pr-badge pr-good";
  if (BAD.has(value)) return "pr-badge pr-bad";
  if (WARN.has(value)) return "pr-badge pr-warn";
  return "pr-badge pr-info";
}

async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text; area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch { return false; }
  }
}

function downloadJson(name: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useStored<T>(key: string, seed: T, normalize?: (value: T) => T): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(seed);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        window.localStorage.setItem(key, JSON.stringify(seed));
        setValue(seed);
      } else {
        const parsed = JSON.parse(raw) as T;
        setValue(normalize ? normalize(parsed) : parsed);
      }
    } catch { setValue(seed); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = (next: T) => {
    setValue(next);
    try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };
  return [value, update];
}

// --------------------------------------------------------------------- portal

export function ReporterPortal() {
  const [route, setRoute] = useState<Route>({ kind: "home" });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "Entra ID": true });
  const [navSearch, setNavSearch] = useState("");
  const [views, setViews] = useStored<PortalView[]>("pr360.views", seedViews);
  const [schedules, setSchedules] = useStored<PortalSchedule[]>("pr360.schedules", seedSchedules,
    (list) => list.map((s) => ({ ...s, runs: s.runs ?? [], filters: s.filters ?? [], sort: s.sort ?? [], columns: s.columns ?? findReport(s.reportId)?.columns ?? [] })));
  const [alerts, setAlerts] = useStored<PortalAlert[]>("pr360.alerts", seedAlerts,
    (list) => list.map((a) => ({ ...a, filters: a.filters ?? [] })));
  const [toast, setToast] = useState("");
  const [drawerRow, setDrawerRow] = useState<{ def: ReportDef; row: Row } | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data) setProfile(data as Profile); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const activeReport = route.kind === "report" ? findReport(route.id) : undefined;
  const navQuery = navSearch.trim().toLowerCase();
  const openReport = (id: string, preset?: Filter[]) => setRoute({ kind: "report", id, preset });

  const runScheduleNow = async (s: PortalSchedule) => {
    const def = findReport(s.reportId);
    if (!def) { setToast("The scheduled report no longer exists."); return; }
    const rows = computeRows(def, s.filters, s.sort);
    const windowLabel = scheduleWindowLabel(s.frequency);
    const outcome: ScheduleRun["outcome"] = rows.length === 0 && s.suppressEmpty ? "suppressed" : "delivered";
    if (outcome === "delivered") {
      const generated = toGeneratedReport(def, columnsFor(def, s.columns), rows, windowLabel);
      if (s.format === "CSV") exportReportCsv(generated);
      else if (s.format === "PDF") await exportReportPdf(generated);
      else if (s.format === "HTML") exportReportHtml(generated);
      else exportReportExcel(generated);
    }
    const run: ScheduleRun = { at: nowStamp(), rows: rows.length, outcome };
    setSchedules(schedules.map((x) => (x.id === s.id ? { ...x, runs: [run, ...x.runs].slice(0, 8) } : x)));
    setDelivery({ def, schedule: s, rows, outcome, windowLabel });
  };

  const evaluateAlertNow = (a: PortalAlert) => {
    const def = findReport(a.reportId);
    if (!def) { setToast("The alert's report no longer exists."); return; }
    const value = computeRows(def, a.filters, []).length;
    const { fired, detail } = evaluateAlertPolicy(a, a.reportId, value);
    setAlerts(alerts.map((x) => x.id === a.id ? {
      ...x,
      lastEvaluatedAt: nowStamp(),
      lastValue: value,
      lastOutcome: fired ? "Fired" : "Normal",
      firedLast30d: fired ? x.firedLast30d + 1 : x.firedLast30d,
      status: fired && x.status === "Closed" ? "Open" : x.status,
    } : x));
    setToast(`Evaluated “${a.name}”: ${fired ? "FIRED" : "normal"} — ${detail}.`);
  };

  const resetWorkspace = () => {
    setViews(seedViews);
    setSchedules(seedSchedules);
    setAlerts(seedAlerts);
    setToast("Workspace reset to the seeded demonstration state.");
  };

  const signOut = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* redirect regardless */ }
    window.location.href = "/login";
  };

  const crumbs = route.kind === "report" && activeReport
    ? [activeReport.service, PLANE_LABEL[activeReport.plane], activeReport.name]
    : route.kind === "home" ? ["Dashboard"] : route.kind === "views" ? ["My Views"] : route.kind === "schedules" ? ["Schedules"] : ["Alert Center"];

  return (
    <div className="pr-shell">
      <aside className="pr-sidebar">
        <div className="pr-brand">
          <span className="pr-brand-mark">R³</span>
          <span>
            <strong>Reporter 360</strong>
            <small>M365 Intelligence</small>
          </span>
        </div>
        <div className="pr-nav-search">
          <Search20Regular />
          <input placeholder="Search reports…" value={navSearch} onChange={(e) => setNavSearch(e.target.value)} aria-label="Search reports" data-testid="portal-nav-search" />
        </div>
        <nav className="pr-nav">
          <div className="pr-nav-section">Overview</div>
          <button className={`pr-nav-top ${route.kind === "home" ? "pr-active" : ""}`} onClick={() => setRoute({ kind: "home" })} data-testid="portal-nav-home">
            <Grid24Regular /> Dashboard
          </button>
          <button className={`pr-nav-top ${route.kind === "views" ? "pr-active" : ""}`} onClick={() => setRoute({ kind: "views" })} data-testid="portal-nav-views">
            <Save24Regular /> My Views <span className="pr-count">{views.length}</span>
          </button>
          <button className={`pr-nav-top ${route.kind === "schedules" ? "pr-active" : ""}`} onClick={() => setRoute({ kind: "schedules" })} data-testid="portal-nav-schedules">
            <ClipboardTask24Regular /> Schedules <span className="pr-count">{schedules.length}</span>
          </button>
          <button className={`pr-nav-top ${route.kind === "alerts" ? "pr-active" : ""}`} onClick={() => setRoute({ kind: "alerts" })} data-testid="portal-nav-alerts">
            <Alert24Regular /> Alert Center <span className="pr-count">{alerts.filter((a) => a.status !== "Closed").length}</span>
          </button>

          <div className="pr-nav-section">Services</div>
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICON[service];
            const all = reportCatalog.filter((d) => d.service === service);
            const matches = navQuery ? all.filter((d) => d.name.toLowerCase().includes(navQuery)) : all;
            if (navQuery && matches.length === 0) return null;
            const open = navQuery ? true : !!expanded[service];
            return (
              <div className="pr-nav-svc" key={service}>
                <button onClick={() => setExpanded({ ...expanded, [service]: !expanded[service] })}>
                  <span className="pr-svc-dot" style={{ background: SERVICE_COLOR[service] }} />
                  <Icon /> {service}
                  <span className={`pr-caret ${open ? "pr-open" : ""}`}><ChevronDown16Regular /></span>
                </button>
                {open && (["reports", "auditing", "analytics"] as Plane[]).map((plane) => {
                  const planeReports = matches.filter((d) => d.plane === plane);
                  if (planeReports.length === 0) return null;
                  return (
                    <div key={plane}>
                      <div className="pr-plane-label">{PLANE_LABEL[plane]}</div>
                      {planeReports.map((d) => (
                        <button key={d.id} className={`pr-nav-report ${route.kind === "report" && route.id === d.id ? "pr-active" : ""}`} onClick={() => openReport(d.id)}>
                          {d.name}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="pr-sidebar-foot"><i /> {reportCatalog.length} reports · synthetic demo tenant</div>
      </aside>

      <div className="pr-main">
        <header className="pr-topbar">
          <span className="pr-crumbs">
            {crumbs.map((c, i) => (
              <span key={c}>{i > 0 && " / "}{i === crumbs.length - 1 ? <strong>{c}</strong> : c}</span>
            ))}
          </span>
          <div className="pr-topbar-right">
            <button className="pr-tenant" onClick={() => setSettingsOpen(true)} data-testid="portal-tenant" title="Tenant & data source details">
              <i>NE</i><span>Northstar Example Group<small>{tables.users.length} users · demo data</small></span>
            </button>
            <button className="pr-btn" onClick={() => setSettingsOpen(true)} aria-label="Portal settings" data-testid="portal-settings"><Settings24Regular /></button>
            <span className="pr-popwrap">
              <button className="pr-avatar" onClick={() => setProfileOpen(!profileOpen)} data-testid="portal-avatar" aria-label="Account menu">
                {(profile?.name ?? "Admin").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </button>
              {profileOpen && (
                <div className="pr-pop pr-right" style={{ minWidth: 250 }}>
                  <div className="pr-menu-id">
                    <strong>{profile?.name ?? "Local administrator"}</strong>
                    <small>{profile?.username ?? "admin@apex.local"}</small>
                    <span>{(profile?.roles ?? []).map((role) => roleLabels[role] ?? role).join(" · ") || "Workforce session"}</span>
                  </div>
                  <a className="pr-btn pr-menu-item" href="/portal">Reporter 360 dashboard</a>
                  <button className="pr-btn pr-menu-item" onClick={() => { setProfileOpen(false); setSettingsOpen(true); }}>Tenant & data settings</button>
                  <button className="pr-btn pr-menu-item pr-danger" onClick={signOut} data-testid="portal-signout">Sign out</button>
                </div>
              )}
            </span>
          </div>
        </header>

        <div className="pr-content">
          {route.kind === "home" && <Dashboard openReport={openReport} openAlerts={() => setRoute({ kind: "alerts" })} alerts={alerts} />}
          {route.kind === "report" && activeReport && (
            <ReportViewer
              key={`${activeReport.id}:${JSON.stringify(route.preset ?? [])}:${JSON.stringify(route.presetColumns ?? [])}`}
              def={activeReport}
              preset={route.preset}
              presetColumns={route.presetColumns}
              presetSort={route.presetSort}
              onOpenRow={(row) => setDrawerRow({ def: activeReport, row })}
              onSaveView={(view) => { setViews([view, ...views]); setToast(`View “${view.name}” saved to My Views.`); }}
              onSchedule={(s) => { setSchedules([s, ...schedules]); setToast(`Schedule “${s.name}” created — open Schedules to run it.`); }}
              onCreateAlert={(a) => { setAlerts([a, ...alerts]); setToast(`Alert policy “${a.name}” activated.`); }}
              notify={setToast}
            />
          )}
          {route.kind === "views" && (
            <CollectionPage
              title="My Views" testid="portal-views-page"
              empty="No saved views yet." emptyAction={{ label: "Browse reports", run: () => openReport("entra-all-users") }}
              items={views.map((v) => {
                const def = findReport(v.reportId);
                return {
                  id: v.id, title: v.name,
                  sub: `${def?.name ?? v.reportId} · ${def?.service ?? ""}`,
                  lines: [`${v.filters.length} filters · ${v.columns.length} columns · ${v.sort.length ? "custom sort" : "default sort"}`],
                  actions: [
                    { label: "Open", primary: true, run: () => setRoute({ kind: "report", id: v.reportId, preset: v.filters, presetColumns: v.columns, presetSort: v.sort }) },
                    { label: "Delete", run: () => { setViews(views.filter((x) => x.id !== v.id)); setToast(`View “${v.name}” deleted.`); } },
                  ],
                };
              })}
            />
          )}
          {route.kind === "schedules" && (
            <CollectionPage
              title="Scheduled deliveries" testid="portal-schedules-page"
              empty="No schedules yet." emptyAction={{ label: "Browse reports", run: () => openReport("entra-signin-failures") }}
              items={schedules.map((s) => ({
                id: s.id, title: s.name, badge: s.status,
                sub: `${findReport(s.reportId)?.name ?? s.reportId} · ${s.frequency} at ${s.time} · ${s.format} → ${s.recipients || "no recipients"}${s.suppressEmpty ? " · skips empty results" : ""}`,
                lines: s.runs.slice(0, 3).map((run) => `${run.at} · ${fmt(run.rows)} rows · ${run.outcome}`),
                actions: [
                  { label: "Run now", primary: true, testid: `portal-run-${s.id}`, run: () => { void runScheduleNow(s); } },
                  { label: s.status === "Active" ? "Pause" : "Resume", run: () => setSchedules(schedules.map((x) => x.id === s.id ? { ...x, status: x.status === "Active" ? "Paused" : "Active" } : x)) },
                  { label: "Open report", run: () => setRoute({ kind: "report", id: s.reportId, preset: s.filters, presetColumns: s.columns, presetSort: s.sort }) },
                  { label: "Delete", run: () => { setSchedules(schedules.filter((x) => x.id !== s.id)); setToast(`Schedule “${s.name}” deleted.`); } },
                ],
              }))}
            />
          )}
          {route.kind === "alerts" && (
            <CollectionPage
              title="Alert Center" testid="portal-alerts-page"
              empty="No alert policies yet." emptyAction={{ label: "Browse reports", run: () => openReport("entra-signin-failures") }}
              items={alerts.map((a) => ({
                id: a.id, title: a.name, badge: a.status, badge2: a.lastOutcome,
                sub: `${findReport(a.reportId)?.name ?? a.reportId} · ${a.mode === "Threshold" ? `fires when count ${a.operator} ${a.threshold}` : `fires on +${a.trendPercent}% vs same day last week`}`,
                lines: [
                  a.lastEvaluatedAt ? `Last evaluated ${a.lastEvaluatedAt} · value ${fmt(a.lastValue ?? 0)} · ${a.lastOutcome ?? "—"}` : "Not evaluated yet",
                  `Fired ${a.firedLast30d}× in the last 30 days`,
                ],
                actions: [
                  { label: "Evaluate now", primary: true, testid: `portal-eval-${a.id}`, run: () => evaluateAlertNow(a) },
                  { label: a.status === "Open" ? "Investigate" : a.status === "Investigating" ? "Close" : "Reopen",
                    run: () => setAlerts(alerts.map((x) => x.id === a.id ? { ...x, status: x.status === "Open" ? "Investigating" : x.status === "Investigating" ? "Closed" : "Open" } : x)) },
                  { label: "Open report", run: () => setRoute({ kind: "report", id: a.reportId, preset: a.filters }) },
                  { label: "Delete", run: () => { setAlerts(alerts.filter((x) => x.id !== a.id)); setToast(`Alert policy “${a.name}” deleted.`); } },
                ],
              }))}
            />
          )}
        </div>
      </div>

      {drawerRow && (
        <DetailDrawer
          def={drawerRow.def} row={drawerRow.row}
          onClose={() => setDrawerRow(null)}
          onNavigate={(reportId, preset) => { setDrawerRow(null); openReport(reportId, preset); }}
          notify={setToast}
        />
      )}
      {delivery && <DeliveryPreview delivery={delivery} onClose={() => setDelivery(null)} />}
      {settingsOpen && (
        <SettingsModal
          workspace={{ views: views.length, schedules: schedules.length, alerts: alerts.length }}
          onReset={resetWorkspace}
          onClose={() => setSettingsOpen(false)}
          notify={setToast}
        />
      )}
      {toast && <div className="pr-toast" data-testid="portal-toast">{toast}</div>}
    </div>
  );
}

// ------------------------------------------------------------------ dashboard

function Dashboard({ openReport, openAlerts, alerts }: { openReport: (id: string, preset?: Filter[]) => void; openAlerts: () => void; alerts: PortalAlert[] }) {
  const licenseSplit = useMemo(() => {
    const members = tables.users.filter((u) => u.userType === "Member");
    const licensed = members.filter((u) => u.licensed === "Licensed").length;
    return [
      { name: "Licensed", value: licensed },
      { name: "Unlicensed", value: members.length - licensed },
      { name: "Guests", value: tables.users.length - members.length },
    ];
  }, []);
  const recentAudit = tables.auditEvents.slice(0, 6);
  return (
    <>
      <div className="pr-page-head">
        <div>
          <h1>Tenant dashboard</h1>
          <p>Point-in-time posture across every connected service. Every count drills through to the underlying records — no dead-end numbers.</p>
        </div>
        <button className="pr-btn" onClick={openAlerts} data-testid="portal-open-alerts"><Alert24Regular /> {alerts.filter((a) => a.status !== "Closed").length} open alerts</button>
      </div>
      <div className="pr-tiles">
        {dashboardTiles.map((t) => (
          <button className={`pr-tile pr-${t.tone}`} key={t.label} onClick={() => openReport(t.reportId)}>
            <span>{t.label}</span>
            <b>{fmt(t.value)}</b>
            <small>{t.detail}</small>
            <span className="pr-drill"><DataArrow /></span>
          </button>
        ))}
      </div>
      <div className="pr-panels">
        <div className="pr-panel">
          <div className="pr-panel-head">
            <div><h2>Sign-in activity · 30 days</h2><p className="pr-sub">Success and failure volume. Investigate the failure spike through the audit plane.</p></div>
            <button className="pr-btn" onClick={() => openReport("entra-signin-failures")}>Failed sign-ins</button>
          </div>
          <div className="pr-chart-wrap">
            <ResponsiveContainer>
              <AreaChart data={analyticsSeries.signInTrend} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#e5e4df" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area dataKey="Success" stroke={STATUS_SERIES_COLOR.Success} fill={`${STATUS_SERIES_COLOR.Success}1a`} strokeWidth={2} />
                <Area dataKey="Failure" stroke={STATUS_SERIES_COLOR.Failure} fill={`${STATUS_SERIES_COLOR.Failure}1a`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="pr-panel">
          <div className="pr-panel-head">
            <div><h2>License distribution</h2><p className="pr-sub">Click a segment to open the matching user report.</p></div>
          </div>
          <div className="pr-chart-wrap">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={licenseSplit} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={2}
                  onClick={(entry) => {
                    const name = (entry as unknown as { name?: string }).name;
                    if (name === "Guests") openReport("entra-guests");
                    else openReport("entra-licensed-users", name ? [{ column: "licensed", op: "equals", value: name }] : undefined);
                  }}>
                  {licenseSplit.map((_, i) => <Cell key={i} fill={PALETTE[i]} cursor="pointer" />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="pr-panels">
        <div className="pr-panel">
          <div className="pr-panel-head">
            <div><h2>Recent audit activity</h2><p className="pr-sub">Latest events from the unified audit trail — retained indefinitely in the platform store.</p></div>
            <button className="pr-btn" onClick={() => openReport("sec-audit-search")}>Open audit search</button>
          </div>
          <div className="pr-mini-list">
            {recentAudit.map((e, i) => (
              <div className="pr-mini-row" key={i}>
                <span className="pr-badge pr-info">{String(e.service)}</span>
                <span className="pr-mini-main"><strong>{String(e.operation)}</strong><small>{String(e.actor)} → {String(e.target)}</small></span>
                <span className="pr-badge">{String(e.time)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="pr-panel">
          <div className="pr-panel-head">
            <div><h2>Device compliance · 30 days</h2><p className="pr-sub">Managed device posture trend from Intune.</p></div>
            <button className="pr-btn" onClick={() => openReport("intune-noncompliant")}>Non-compliant</button>
          </div>
          <div className="pr-chart-wrap">
            <ResponsiveContainer>
              <AreaChart data={analyticsSeries.complianceTrend} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#e5e4df" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area dataKey="Compliant" stroke={STATUS_SERIES_COLOR.Compliant} fill={`${STATUS_SERIES_COLOR.Compliant}1a`} strokeWidth={2} />
                <Area dataKey="Non-compliant" stroke={STATUS_SERIES_COLOR["Non-compliant"]} fill={`${STATUS_SERIES_COLOR["Non-compliant"]}1a`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

function DataArrow() {
  return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 14L14 6M14 6H8M14 6v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// -------------------------------------------------------------- report viewer

const sameFilter = (a: Filter, b: Filter) => a.column === b.column && a.op === b.op && a.value === b.value;

function ReportViewer({ def, preset, presetColumns, presetSort, onOpenRow, onSaveView, onSchedule, onCreateAlert, notify }: {
  def: ReportDef;
  preset?: Filter[];
  presetColumns?: string[];
  presetSort?: SortSpec[];
  onOpenRow: (row: Row) => void;
  onSaveView: (view: PortalView) => void;
  onSchedule: (schedule: PortalSchedule) => void;
  onCreateAlert: (alert: PortalAlert) => void;
  notify: (message: string) => void;
}) {
  const catalog = columnCatalog[def.source];
  const [filters, setFilters] = useState<Filter[]>(preset ?? []);
  const [sort, setSort] = useState<SortSpec[]>(presetSort ?? (def.defaultSort ? [def.defaultSort] : []));
  const [cols, setCols] = useState<string[]>(presetColumns ?? def.columns);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [chartOn, setChartOn] = useState(true);
  const [pop, setPop] = useState<"columns" | "filters" | "export" | null>(null);
  const [modal, setModal] = useState<"view" | "schedule" | "alert" | null>(null);
  const pageSize = 25;

  const scopedRows = useMemo(() => engineBaseRows(def), [def]);

  const filteredRows = useMemo(() => {
    let rows = scopedRows;
    for (const f of filters) rows = rows.filter((row) => applyFilter(row, f, columnTypeFor(def, f.column)));
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((row) => cols.some((c) => String(row[c]).toLowerCase().includes(q)));
    return sortRows(rows, sort);
  }, [scopedRows, def, filters, search, sort, cols]);

  useEffect(() => setPage(0), [filters, search, sort]);

  const toggleFilter = (f: Filter) => {
    setFilters((cur) => cur.some((x) => sameFilter(x, f)) ? cur.filter((x) => !sameFilter(x, f)) : [...cur, f]);
  };

  const headerSort = (key: string, additive: boolean) => {
    setSort((cur) => {
      const existing = cur.find((s) => s.column === key);
      const flipped: SortSpec = { column: key, dir: existing?.dir === "asc" ? "desc" : "asc" };
      if (!additive) return [flipped];
      return existing ? cur.map((s) => (s.column === key ? flipped : s)) : [...cur, flipped];
    });
  };

  const chartData = useMemo(() => {
    const spec = def.chart;
    if (!spec || spec.kind === "line" || spec.kind === "area") return [];
    const counts = new Map<string, number>();
    for (const row of filteredRows) {
      const key = String(row[spec.groupBy]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 8).map(([name, value]) => ({ name, value }));
    const rest = sorted.slice(8).reduce((acc, [, v]) => acc + v, 0);
    if (rest > 0) top.push({ name: "Other", value: rest });
    return top;
  }, [def, filteredRows]);

  const drillChart = (name?: string) => {
    const spec = def.chart;
    if (!spec || spec.kind === "line" || spec.kind === "area" || !name || name === "Other") return;
    toggleFilter({ column: spec.groupBy, op: "equals", value: name });
  };
  const chart = def.chart;

  // Color is assigned by each value's position in the full unfiltered domain
  // (not by its rank in the current chart), so a category keeps the same
  // color as filters change instead of getting repainted when rank shifts.
  const chartDomain = useMemo(() => {
    const spec = def.chart;
    if (!spec || spec.kind === "line" || spec.kind === "area") return [];
    return [...new Set(scopedRows.map((row) => String(row[spec.groupBy])))].sort();
  }, [def, scopedRows]);
  const colorForCategory = (name: string) => name === "Other" ? OTHER_FILL : PALETTE[Math.max(0, chartDomain.indexOf(name)) % PALETTE.length];

  const visibleColumns = columnsFor(def, cols);
  const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const badgeColumns = catalog.filter((c) => c.type === "badge");
  const distinct = (key: string) => [...new Set(scopedRows.map((row) => String(row[key])))].sort().slice(0, 14);
  const snapshot: Snapshot = { columns: cols, filters, sort };

  const exportAs = async (format: "CSV" | "XLSX" | "PDF" | "HTML" | "JSON") => {
    const generated = toGeneratedReport(def, visibleColumns, filteredRows);
    if (format === "CSV") exportReportCsv(generated);
    else if (format === "XLSX") exportReportExcel(generated);
    else if (format === "HTML") exportReportHtml(generated);
    else if (format === "JSON") exportReportRaw(generated);
    else await exportReportPdf(generated);
    setPop(null);
    notify(`${format} export generated with ${fmt(filteredRows.length)} rows — check your downloads.`);
  };

  return (
    <>
      <div className="pr-report-head">
        <h1 data-testid="portal-report-title">{def.name} <span className="pr-badge pr-info">{PLANE_LABEL[def.plane]}</span></h1>
        <p>{def.description}</p>
      </div>

      <div className="pr-summary">
        <div className="pr-stat" data-testid="portal-record-count"><b>{fmt(filteredRows.length)}</b><span>records match · {fmt(scopedRows.length)} total</span></div>
        {(def.quickFilters ?? []).map((qf) => {
          const on = filters.some((x) => sameFilter(x, qf.filter));
          const n = scopedRows.filter((row) => applyFilter(row, qf.filter, columnTypeFor(def, qf.filter.column))).length;
          return (
            <button key={qf.label} className={`pr-stat ${on ? "pr-on" : ""}`} onClick={() => toggleFilter(qf.filter)}>
              <b>{fmt(n)}</b><span>{qf.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pr-toolbar">
        <span className="pr-search"><Search20Regular /><input placeholder="Search in report…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="portal-report-search" /></span>
        <span className="pr-popwrap">
          <button className="pr-btn" onClick={() => setPop(pop === "filters" ? null : "filters")} data-testid="portal-filters"><Settings24Regular /> Filters {filters.length > 0 && `(${filters.length})`}</button>
          {pop === "filters" && (
            <FilterPopover catalog={catalog} badgeColumns={badgeColumns} distinct={distinct} filters={filters}
              setFilters={setFilters} close={() => setPop(null)} />
          )}
        </span>
        <span className="pr-popwrap">
          <button className="pr-btn" onClick={() => setPop(pop === "columns" ? null : "columns")} data-testid="portal-columns"><DocumentBulletList24Regular /> Columns ({cols.length})</button>
          {pop === "columns" && <ColumnPopover catalog={catalog} cols={cols} setCols={setCols} close={() => setPop(null)} />}
        </span>
        <button className="pr-btn" onClick={() => setChartOn(!chartOn)}>{chartOn ? "Hide chart" : "Show chart"}</button>
        <span className="pr-spacer" />
        <span className="pr-popwrap">
          <button className="pr-btn" onClick={() => setPop(pop === "export" ? null : "export")} data-testid="portal-export">
            <ArrowDownload24Regular /> Export <ChevronDown16Regular />
          </button>
          {pop === "export" && (
            <div className="pr-pop pr-right" style={{ minWidth: 190 }}>
              <h4>Export {fmt(filteredRows.length)} rows</h4>
              {(["CSV", "XLSX", "PDF", "HTML", "JSON"] as const).map((format) => (
                <button key={format} className="pr-btn pr-menu-item" onClick={() => { void exportAs(format); }} data-testid={`portal-export-${format.toLowerCase()}`}>
                  {format === "XLSX" ? "Excel (XLSX)" : format}
                </button>
              ))}
            </div>
          )}
        </span>
        <button className="pr-btn" onClick={() => setModal("view")} data-testid="portal-save-view"><Save24Regular /> Save View</button>
        <button className="pr-btn" onClick={() => setModal("schedule")} data-testid="portal-schedule"><ClipboardTask24Regular /> Schedule</button>
        <button className="pr-btn pr-primary" onClick={() => setModal("alert")} data-testid="portal-alert"><Alert24Regular /> Alert</button>
      </div>

      {(filters.length > 0 || (def.quickFilters ?? []).length > 0) && (
        <div className="pr-chipbar">
          {(def.quickFilters ?? []).length > 0 && <span className="pr-label">Quick filters</span>}
          {(def.quickFilters ?? []).map((qf) => (
            <button key={qf.label} className={`pr-chip ${filters.some((x) => sameFilter(x, qf.filter)) ? "pr-on" : ""}`} onClick={() => toggleFilter(qf.filter)}>{qf.label}</button>
          ))}
          {filters.filter((f) => !(def.quickFilters ?? []).some((qf) => sameFilter(qf.filter, f))).map((f, i) => (
            <button key={`${f.column}-${i}`} className="pr-chip pr-filter" onClick={() => toggleFilter(f)}>
              {catalog.find((c) => c.key === f.column)?.label ?? f.column} {f.op === "equals" ? "=" : f.op === "not" ? "≠" : f.op === "gt" ? ">" : f.op === "lt" ? "<" : "contains"} {f.value}
              <span className="pr-x">×</span>
            </button>
          ))}
          {filters.length > 0 && <button className="pr-chip" onClick={() => setFilters([])} data-testid="portal-clear-filters">Clear all</button>}
        </div>
      )}

      {chartOn && chart && (
        <div className="pr-report-chart">
          <div style={{ height: 235 }}>
            <ResponsiveContainer>
              {chart.kind === "donut" ? (
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="80%" paddingAngle={2}
                    onClick={(entry) => drillChart((entry as unknown as { name?: string }).name)}>
                    {chartData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name)} cursor="pointer" />)}
                  </Pie>
                  <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              ) : chart.kind === "bar" ? (
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e4df" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} interval={0} height={46} />
                  <YAxis tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "#f4f3ef" }} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} onClick={(entry) => drillChart((entry as unknown as { name?: string }).name)}>
                    {chartData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name)} cursor="pointer" />)}
                  </Bar>
                </BarChart>
              ) : chart.kind === "line" ? (
                <LineChart data={analyticsSeries[chart.series]} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e4df" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} /><Legend wrapperStyle={LEGEND_STYLE} />
                  {chart.keys.map((k, i) => <Line key={k} dataKey={k} stroke={STATUS_SERIES_COLOR[k] ?? PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} />)}
                </LineChart>
              ) : (
                <AreaChart data={analyticsSeries[chart.series]} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e4df" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: "#98958c" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} /><Legend wrapperStyle={LEGEND_STYLE} />
                  {chart.keys.map((k, i) => { const c = STATUS_SERIES_COLOR[k] ?? PALETTE[i % PALETTE.length]; return <Area key={k} dataKey={k} stroke={c} fill={`${c}1a`} strokeWidth={2} />; })}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
          {(chart.kind === "donut" || chart.kind === "bar") && <div className="pr-hint">Chart re-renders with your filters · click a segment to drill into those records</div>}
        </div>
      )}

      <div className="pr-gridwrap">
        <div className="pr-gridscroll">
          <table className="pr-grid">
            <thead>
              <tr>
                {visibleColumns.map((c) => {
                  const s = sort.find((x) => x.column === c.key);
                  const idx = sort.findIndex((x) => x.column === c.key);
                  return (
                    <th key={c.key} style={{ minWidth: c.width }} onClick={(e) => headerSort(c.key, e.shiftKey)} title="Click to sort · Shift+click for multi-sort">
                      {c.label}
                      {s && <span className="pr-sortmark">{s.dir === "asc" ? "▲" : "▼"}{sort.length > 1 ? idx + 1 : ""}</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr key={i} onClick={() => onOpenRow(row)}>
                  {visibleColumns.map((c) => (
                    <td key={c.key} className={c.type === "number" ? "pr-num" : ""}>
                      {c.type === "badge" ? <span className={badgeClass(String(row[c.key]))}>{String(row[c.key])}</span> : String(row[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 && <div className="pr-empty">No records match the current filters.</div>}
        </div>
        <div className="pr-gridfoot">
          <span>{fmt(filteredRows.length)} records · page {page + 1} of {pageCount}</span>
          <span>Click any row for the 360° record view</span>
          <span className="pr-pages">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
            {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
              const p = pageCount <= 7 ? i : Math.max(0, Math.min(page - 3, pageCount - 7)) + i;
              return <button key={p} className={p === page ? "pr-cur" : ""} onClick={() => setPage(p)}>{p + 1}</button>;
            })}
            <button disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>›</button>
          </span>
        </div>
      </div>

      {modal === "view" && (
        <SaveViewModal def={def} close={() => setModal(null)}
          save={(name) => { onSaveView({ id: `v${Date.now()}`, name, reportId: def.id, ...snapshot, createdAt: new Date().toISOString() }); setModal(null); }} />
      )}
      {modal === "schedule" && (
        <ScheduleModal def={def} snapshot={snapshot} close={() => setModal(null)}
          save={(s) => { onSchedule(s); setModal(null); }} />
      )}
      {modal === "alert" && (
        <AlertModal def={def} filters={filters} currentCount={filteredRows.length} close={() => setModal(null)}
          save={(a) => { onCreateAlert(a); setModal(null); }} />
      )}
    </>
  );
}

// ------------------------------------------------------------------- popovers

function ColumnPopover({ catalog, cols, setCols, close }: { catalog: Column[]; cols: string[]; setCols: (c: string[]) => void; close: () => void }) {
  const move = (key: string, dir: -1 | 1) => {
    const i = cols.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cols.length) return;
    const next = [...cols];
    [next[i], next[j]] = [next[j], next[i]];
    setCols(next);
  };
  return (
    <div className="pr-pop">
      <h4>Columns — add, remove, reorder</h4>
      {catalog.map((c) => {
        const on = cols.includes(c.key);
        return (
          <div className="pr-pop-row" key={c.key}>
            <label>
              <input type="checkbox" checked={on}
                onChange={() => setCols(on ? cols.filter((k) => k !== c.key) : [...cols, c.key])} />
              {c.label}
            </label>
            {on && <>
              <button className="pr-move" onClick={() => move(c.key, -1)} aria-label={`Move ${c.label} up`}>↑</button>
              <button className="pr-move" onClick={() => move(c.key, 1)} aria-label={`Move ${c.label} down`}>↓</button>
            </>}
          </div>
        );
      })}
      <div className="pr-pop-actions"><button className="pr-btn pr-primary" onClick={close}>Done</button></div>
    </div>
  );
}

function FilterPopover({ catalog, badgeColumns, distinct, filters, setFilters, close }: {
  catalog: Column[]; badgeColumns: Column[]; distinct: (key: string) => string[];
  filters: Filter[]; setFilters: (f: Filter[]) => void; close: () => void;
}) {
  const [advColumn, setAdvColumn] = useState(catalog[0]?.key ?? "");
  const [advOp, setAdvOp] = useState<Filter["op"]>("contains");
  const [advValue, setAdvValue] = useState("");
  return (
    <div className="pr-pop" style={{ minWidth: 330 }}>
      <h4>Easy filters</h4>
      {badgeColumns.slice(0, 6).map((c) => {
        const active = filters.find((f) => f.column === c.key && f.op === "equals");
        return (
          <div className="pr-pop-row" key={c.key}>
            <span style={{ width: 120, color: "#6b7190" }}>{c.label}</span>
            <select value={active?.value ?? ""} data-testid={`portal-easy-${c.key}`} onChange={(e) => {
              const rest = filters.filter((f) => !(f.column === c.key && f.op === "equals"));
              setFilters(e.target.value ? [...rest, { column: c.key, op: "equals", value: e.target.value }] : rest);
            }}>
              <option value="">Any</option>
              {distinct(c.key).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        );
      })}
      <h4 style={{ marginTop: 12 }}>Advanced filter</h4>
      <div className="pr-filter-grid">
        <select value={advColumn} onChange={(e) => setAdvColumn(e.target.value)} data-testid="portal-adv-column">
          {catalog.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select value={advOp} onChange={(e) => setAdvOp(e.target.value as Filter["op"])} data-testid="portal-adv-op">
          <option value="contains">contains</option><option value="equals">equals</option>
          <option value="not">not equals</option><option value="gt">greater than</option><option value="lt">less than</option>
        </select>
        <input type="text" placeholder="Value" value={advValue} onChange={(e) => setAdvValue(e.target.value)} data-testid="portal-adv-value" />
        <button className="pr-btn" data-testid="portal-adv-add" onClick={() => { if (advValue.trim()) { setFilters([...filters, { column: advColumn, op: advOp, value: advValue.trim() }]); setAdvValue(""); } }}>Add</button>
      </div>
      <div className="pr-pop-actions">
        <button className="pr-btn" onClick={() => setFilters([])}>Clear all</button>
        <button className="pr-btn pr-primary" onClick={close}>Done</button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------- modals

function SaveViewModal({ def, save, close }: { def: ReportDef; save: (name: string) => void; close: () => void }) {
  const [name, setName] = useState(`${def.name} — my view`);
  return (
    <>
      <div className="pr-overlay" onClick={close} />
      <div className="pr-modal">
        <h3>Save View</h3>
        <p className="pr-sub">Captures the current columns, filters, and sort so you can reopen or share this exact slice.</p>
        <div className="pr-form-row"><label>View name</label><input value={name} onChange={(e) => setName(e.target.value)} data-testid="portal-view-name" /></div>
        <div className="pr-modal-actions">
          <button className="pr-btn" onClick={close}>Cancel</button>
          <button className="pr-btn pr-primary" onClick={() => name.trim() && save(name.trim())} data-testid="portal-view-save">Save View</button>
        </div>
      </div>
    </>
  );
}

function ScheduleModal({ def, snapshot, save, close }: { def: ReportDef; snapshot: Snapshot; save: (s: PortalSchedule) => void; close: () => void }) {
  const [name, setName] = useState(`${def.name} — scheduled`);
  const [frequency, setFrequency] = useState("Daily");
  const [time, setTime] = useState("07:00");
  const [recipients, setRecipients] = useState("");
  const [format, setFormat] = useState("XLSX");
  const [suppressEmpty, setSuppressEmpty] = useState(true);
  return (
    <>
      <div className="pr-overlay" onClick={close} />
      <div className="pr-modal">
        <h3>Schedule email delivery</h3>
        <p className="pr-sub">Recurring delivery with an in-body data preview and the full report attached. Captures your current filters and columns.</p>
        <div className="pr-form-row"><label>Schedule name</label><input value={name} onChange={(e) => setName(e.target.value)} data-testid="portal-schedule-name" /></div>
        <div className="pr-form-grid">
          <div className="pr-form-row"><label>Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} data-testid="portal-schedule-frequency"><option>Daily</option><option>Weekly</option><option>Monthly</option></select>
          </div>
          <div className="pr-form-row"><label>Delivery time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        </div>
        <div className="pr-form-row"><label>Recipients (comma-separated)</label><input placeholder="admin@northstar.example" value={recipients} onChange={(e) => setRecipients(e.target.value)} data-testid="portal-schedule-recipients" /></div>
        <div className="pr-form-row"><label>Attachment format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} data-testid="portal-schedule-format"><option>XLSX</option><option>CSV</option><option>PDF</option><option>HTML</option></select>
        </div>
        <div className="pr-note">Intelligent date-windowing: a {frequency.toLowerCase()} schedule automatically scopes time-based data to <strong>{scheduleWindowLabel(frequency)}</strong> — no manual date range needed.</div>
        <label className="pr-check"><input type="checkbox" checked={suppressEmpty} onChange={(e) => setSuppressEmpty(e.target.checked)} /> Skip delivery when the report has no records</label>
        <div className="pr-modal-actions">
          <button className="pr-btn" onClick={close}>Cancel</button>
          <button className="pr-btn pr-primary" data-testid="portal-schedule-create" onClick={() => save({
            id: `s${Date.now()}`, name: name.trim() || def.name, reportId: def.id, frequency, time, recipients, format,
            suppressEmpty, status: "Active", ...snapshot, runs: [], createdAt: new Date().toISOString(),
          })}>Create schedule</button>
        </div>
      </div>
    </>
  );
}

function AlertModal({ def, filters, currentCount, save, close }: { def: ReportDef; filters: Filter[]; currentCount: number; save: (a: PortalAlert) => void; close: () => void }) {
  const [name, setName] = useState(`${def.name} — alert`);
  const [mode, setMode] = useState<PortalAlert["mode"]>("Threshold");
  const [operator, setOperator] = useState<PortalAlert["operator"]>("above");
  const [threshold, setThreshold] = useState(Math.max(1, Math.round(currentCount * 1.2)));
  const [trendPercent, setTrendPercent] = useState(50);

  const history = useMemo(() => metricHistory(def.id, Math.max(currentCount, 4)), [def.id, currentCount]);
  const fired = history.map((v, i) => {
    if (mode === "Threshold") return operator === "above" ? v > threshold : v < threshold;
    const prior = history[i - 7];
    return prior !== undefined && prior > 0 && ((v - prior) / prior) * 100 >= trendPercent;
  });
  const firedCount = fired.filter(Boolean).length;
  const max = Math.max(...history, 1);

  return (
    <>
      <div className="pr-overlay" onClick={close} />
      <div className="pr-modal">
        <h3>Create alert policy</h3>
        <p className="pr-sub">Watches this report’s matching record count (with your current filters). The preview simulates the policy against the last 30 days before you activate it.</p>
        <div className="pr-form-row"><label>Alert name</label><input value={name} onChange={(e) => setName(e.target.value)} data-testid="portal-alert-name" /></div>
        <div className="pr-form-row"><label>Alert type</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as PortalAlert["mode"])} data-testid="portal-alert-mode">
            <option>Threshold</option><option>Trend comparison</option>
          </select>
        </div>
        {mode === "Threshold" ? (
          <div className="pr-form-grid">
            <div className="pr-form-row"><label>Fire when count is</label>
              <select value={operator} onChange={(e) => setOperator(e.target.value as PortalAlert["operator"])}><option value="above">above</option><option value="below">below</option></select>
            </div>
            <div className="pr-form-row"><label>Threshold</label><input type="number" min={0} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} data-testid="portal-alert-threshold" /></div>
          </div>
        ) : (
          <div className="pr-form-row"><label>Fire on increase of at least (%) vs same day last week</label>
            <input type="number" min={1} value={trendPercent} onChange={(e) => setTrendPercent(Number(e.target.value))} />
          </div>
        )}
        <div className="pr-preview" data-testid="portal-alert-preview">
          <small><strong>Policy preview</strong> — simulated against the last 30 days: would have fired <strong>{firedCount}</strong> time{firedCount === 1 ? "" : "s"}. Today’s value: {fmt(currentCount)}.</small>
          <div className="pr-preview-days">
            {history.map((v, i) => <i key={i} className={fired[i] ? "pr-fire" : ""} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} title={`Day −${30 - i}: ${v}${fired[i] ? " · fires" : ""}`} />)}
          </div>
          <small>Red bars are days the policy would have triggered. Tune it until the preview matches your intent, then activate.</small>
        </div>
        <div className="pr-modal-actions">
          <button className="pr-btn" onClick={close}>Cancel</button>
          <button className="pr-btn pr-primary" data-testid="portal-alert-activate" onClick={() => save({
            id: `a${Date.now()}`, name: name.trim() || def.name, reportId: def.id, mode, operator, threshold, trendPercent,
            status: "Open", firedLast30d: firedCount, filters, createdAt: new Date().toISOString(),
          })}>Activate alert</button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------- delivery preview

function DeliveryPreview({ delivery, onClose }: { delivery: Delivery; onClose: () => void }) {
  const { def, schedule, rows, outcome, windowLabel } = delivery;
  const columns = columnsFor(def, schedule.columns).slice(0, 6);
  return (
    <>
      <div className="pr-overlay" onClick={onClose} />
      <div className="pr-modal" style={{ width: "min(680px,94vw)" }} data-testid="portal-delivery">
        <h3>Delivery preview <span className={badgeClass(outcome)}>{outcome}</span></h3>
        <p className="pr-sub">This is what recipients receive in the email body. The full report is attached as {schedule.format}.</p>
        <div className="pr-mailhead">
          <div><span>Subject</span><strong>[Reporter 360] {def.name} — {windowLabel}</strong></div>
          <div><span>To</span><strong>{schedule.recipients || "no recipients configured"}</strong></div>
          <div><span>Data window</span><strong>{windowLabel}</strong></div>
          <div><span>Records</span><strong>{fmt(rows.length)}</strong></div>
        </div>
        {outcome === "suppressed" ? (
          <div className="pr-note">The report returned no records for this window, so delivery was <strong>suppressed by the empty-result policy</strong>. No email was sent and no attachment was generated.</div>
        ) : (
          <>
            <div className="pr-mailscroll">
              <table className="pr-mailtable">
                <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
                <tbody>
                  {rows.slice(0, 8).map((row, i) => (
                    <tr key={i}>{columns.map((c) => <td key={c.key}>{String(row[c.key] ?? "")}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pr-note">Showing the first {Math.min(8, rows.length)} of {fmt(rows.length)} rows. The complete {schedule.format} attachment was just generated — check your browser downloads.</div>
          </>
        )}
        <div className="pr-modal-actions"><button className="pr-btn pr-primary" onClick={onClose} data-testid="portal-delivery-close">Close</button></div>
      </div>
    </>
  );
}

// -------------------------------------------------------------- settings

function SettingsModal({ workspace, onReset, onClose, notify }: {
  workspace: { views: number; schedules: number; alerts: number };
  onReset: () => void; onClose: () => void; notify: (message: string) => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const stats: [string, number][] = [
    ["Users", tables.users.length], ["Mailboxes", tables.mailboxes.length], ["Teams", tables.teams.length],
    ["Sites", tables.sites.length], ["OneDrive accounts", tables.drives.length], ["Managed devices", tables.devices.length],
    ["Audit events", tables.auditEvents.length], ["Sign-in events", tables.signIns.length],
  ];
  return (
    <>
      <div className="pr-overlay" onClick={onClose} />
      <div className="pr-modal" data-testid="portal-settings-modal">
        <h3>Tenant & data source</h3>
        <p className="pr-sub">Northstar Example Group — deterministic synthetic twin. In a connected deployment this panel shows Graph connector health, permissions, and sync freshness.</p>
        <div className="pr-stat-grid">
          {stats.map(([label, value]) => (
            <div key={label}><b>{fmt(value)}</b><span>{label}</span></div>
          ))}
        </div>
        <div className="pr-note">Workspace: {workspace.views} saved views · {workspace.schedules} schedules · {workspace.alerts} alert policies — stored in this browser and re-seeded on reset. {reportCatalog.length} reports in the catalogue.</div>
        <div className="pr-modal-actions">
          <button className="pr-btn" data-testid="portal-export-dataset" onClick={() => { downloadJson("reporter360-dataset.json", { schema: "reporter360.dataset.v1", generatedAt: new Date().toISOString(), tables }); notify("Full dataset exported as JSON."); }}>Export dataset (JSON)</button>
          <button className={`pr-btn ${confirmReset ? "pr-danger" : ""}`} data-testid="portal-reset-demo" onClick={() => {
            if (!confirmReset) { setConfirmReset(true); return; }
            onReset(); setConfirmReset(false); onClose();
          }}>{confirmReset ? "Confirm reset" : "Reset demo data"}</button>
          <button className="pr-btn pr-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

// --------------------------------------------------------- detail drawer (360)

function DetailDrawer({ def, row, onClose, onNavigate, notify }: {
  def: ReportDef; row: Row; onClose: () => void;
  onNavigate: (reportId: string, preset: Filter[]) => void;
  notify: (message: string) => void;
}) {
  const catalog = columnCatalog[def.source];
  const title = String(row.displayName ?? row.teamName ?? row.siteName ?? row.deviceName ?? row.groupName ?? row.policyName ?? row.owner ?? row.user ?? row.operation ?? "Record");
  const upn = typeof row.upn === "string" ? row.upn : typeof row.actorUpn === "string" ? row.actorUpn : undefined;
  const initials = title.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const mailbox = upn ? tables.mailboxes.find((m) => m.upn === upn) : undefined;
  const userDevices = upn ? tables.devices.filter((d) => d.upn === upn) : [];
  const drive = upn ? tables.drives.find((d) => d.upn === upn) : undefined;
  const recentSignIns = upn ? tables.signIns.filter((s) => s.upn === upn).slice(0, 5) : [];

  const exportRecord = () => {
    const columns = catalog.filter((c) => row[c.key] !== undefined);
    exportReportCsv(toGeneratedReport(def, columns, [row]));
    notify("Record exported to CSV.");
  };

  return (
    <>
      <div className="pr-overlay" onClick={onClose} />
      <aside className="pr-drawer" aria-label="Record details" data-testid="portal-drawer">
        <div className="pr-drawer-head">
          <span className="pr-avatar">{initials}</span>
          <span><h3>{title}</h3><p>{upn ?? `${def.service} · ${def.name}`}</p></span>
          <button className="pr-close" onClick={onClose} aria-label="Close" data-testid="portal-drawer-close">×</button>
        </div>
        <div className="pr-drawer-body">
          <div className="pr-drawer-actions">
            {upn && <button className="pr-btn" data-testid="portal-drawer-signins" onClick={() => onNavigate("entra-signins", [{ column: "upn", op: "equals", value: upn }])}>Sign-in activity</button>}
            {upn && <button className="pr-btn" data-testid="portal-drawer-audit" onClick={() => onNavigate("sec-audit-search", [{ column: "actorUpn", op: "equals", value: upn }])}>Audit activity</button>}
            {upn && <button className="pr-btn" onClick={async () => notify((await copyText(upn)) ? "UPN copied to clipboard." : "Clipboard unavailable in this browser.")}>Copy UPN</button>}
            <button className="pr-btn" data-testid="portal-drawer-export" onClick={exportRecord}>Export record</button>
          </div>
          <div className="pr-drawer-sect">Record attributes</div>
          <dl className="pr-kv">
            {catalog.filter((c) => row[c.key] !== undefined).map((c) => (
              <FragmentKV key={c.key} label={c.label} value={String(row[c.key])} badge={c.type === "badge"} />
            ))}
          </dl>
          {(mailbox || drive || userDevices.length > 0 || recentSignIns.length > 0) && (
            <>
              <div className="pr-drawer-sect">360° across services</div>
              <dl className="pr-kv">
                {mailbox && <FragmentKV label="Mailbox" value={`${mailbox.sizeGB} GB of ${mailbox.quotaGB} GB (${mailbox.usagePercent}%)`} />}
                {drive && <FragmentKV label="OneDrive" value={`${drive.storageGB} GB · ${drive.externalLinks} external links`} />}
                {userDevices.length > 0 && <FragmentKV label="Devices" value={userDevices.map((d) => `${d.deviceName} (${d.compliance})`).join(", ")} />}
              </dl>
              {recentSignIns.length > 0 && (
                <>
                  <div className="pr-drawer-sect">Recent sign-ins</div>
                  {recentSignIns.map((s, i) => (
                    <div className="pr-mini-row" key={i}>
                      <span className={badgeClass(String(s.status))}>{String(s.status)}</span>
                      <span className="pr-mini-main"><strong>{String(s.application)}</strong><small>{String(s.time)} · {String(s.location)}</small></span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function FragmentKV({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{badge ? <span className={badgeClass(value)}>{value}</span> : value}</dd>
    </>
  );
}

// ------------------------------------------------------------ collection page

function CollectionPage({ title, empty, emptyAction, items, testid }: {
  title: string; empty: string; testid?: string;
  emptyAction?: { label: string; run: () => void };
  items: {
    id: string; title: string; sub: string; badge?: string; badge2?: string; lines?: string[];
    actions: { label: string; primary?: boolean; testid?: string; run: () => void }[];
  }[];
}) {
  return (
    <div data-testid={testid}>
      <div className="pr-page-head">
        <div><h1>{title}</h1><p>{items.length === 0 ? empty : `${items.length} item${items.length === 1 ? "" : "s"}`}</p></div>
        {items.length === 0 && emptyAction && <button className="pr-btn pr-primary" onClick={emptyAction.run}>{emptyAction.label}</button>}
      </div>
      <div className="pr-cards">
        {items.map((item) => (
          <div className="pr-item-card" key={item.id}>
            <h3>{item.title} {item.badge && <span className={badgeClass(item.badge)}>{item.badge}</span>} {item.badge2 && <span className={badgeClass(item.badge2)}>{item.badge2}</span>}</h3>
            <p>{item.sub}</p>
            {(item.lines ?? []).map((line, i) => <div className="pr-runline" key={i}>{line}</div>)}
            <div className="pr-item-actions">
              {item.actions.map((a) => (
                <button key={a.label} className={`pr-btn ${a.primary ? "pr-primary" : ""}`} onClick={a.run} data-testid={a.testid}>{a.label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

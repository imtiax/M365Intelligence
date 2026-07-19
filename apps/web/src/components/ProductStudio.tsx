"use client";

import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  Add24Regular,
  Alert24Regular,
  Apps24Regular,
  ArrowDownload24Regular,
  ArrowSync24Regular,
  Bot24Regular,
  CalendarClock24Regular,
  CheckmarkCircle24Regular,
  ChevronRight20Regular,
  ClipboardTask24Regular,
  CloudCheckmark24Regular,
  Code24Regular,
  ColumnTriple24Regular,
  DataBarVertical24Regular,
  Database24Regular,
  Delete24Regular,
  DocumentBulletList24Regular,
  Filter24Regular,
  Grid24Regular,
  Key24Regular,
  LockClosed24Regular,
  Mail24Regular,
  MoneyHand24Regular,
  PeopleTeam24Regular,
  Play24Regular,
  Save24Regular,
  Search20Regular,
  Settings24Regular,
  ShieldCheckmark24Regular,
  Sparkle24Filled,
  Table24Regular,
} from "@fluentui/react-icons";
import {
  configurationSections,
  previewRows,
  semanticSources,
  type SemanticField,
} from "@/data/product-studio";
import { GeneratedReportViewer } from "@/components/GeneratedReportViewer";
import {
  exportReportExcel,
  generateCustomReport,
  type GeneratedReport,
} from "@/lib/reporting";
import { runRuntimeReport } from "@/lib/runtime-api";

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
    <div className="page-heading studio-heading">
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
function Badge({
  children,
  tone = "teal",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`studio-badge ${tone}`}>{children}</span>;
}

const LOCAL_STATE_SCHEMA_VERSION = 1 as const;

type VersionedLocalState<T> = {
  schemaVersion: typeof LOCAL_STATE_SCHEMA_VERSION;
  version: number;
  savedAt: string;
  data: T;
};

function readVersionedLocalState<T>(
  key: string,
  isValidData: (value: unknown) => value is T,
): VersionedLocalState<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VersionedLocalState<unknown>>;
    if (
      parsed.schemaVersion !== LOCAL_STATE_SCHEMA_VERSION ||
      typeof parsed.version !== "number" ||
      !Number.isInteger(parsed.version) ||
      parsed.version < 1 ||
      typeof parsed.savedAt !== "string" ||
      Number.isNaN(Date.parse(parsed.savedAt)) ||
      !isValidData(parsed.data)
    ) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed as VersionedLocalState<T>;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeVersionedLocalState<T>(
  key: string,
  state: VersionedLocalState<T>,
) {
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function formatLocalTimestamp(value: string | null) {
  if (!value) return "Not saved in this browser";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ReportBuilder({ notify }: { notify: (m: string) => void }) {
  const [sourceId, setSourceId] = useState("users");
  const source = semanticSources.find((s) => s.id === sourceId)!;
  const [selected, setSelected] = useState([
    "displayName",
    "department",
    "mfaStrength",
    "riskScore",
    "lastActivity",
    "licenseCost",
  ]);
  const [tab, setTab] = useState<
    "design" | "preview" | "schedule" | "security"
  >("design");
  const [name, setName] = useState("Privileged identity risk and MFA coverage");
  const [search, setSearch] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  const [calculated, setCalculated] = useState([
    {
      name: "Risk band",
      formula: 'IF([Risk score] >= 75, "High", "Standard")',
    },
  ]);
  const [filters, setFilters] = useState([
    { field: "Account enabled", operator: "equals", value: "True" },
    { field: "Risk score", operator: "greater than", value: "50" },
  ]);
  const [grouping, setGrouping] = useState("Department");
  const [visual, setVisual] = useState("Table");
  const [saved, setSaved] = useState(false);
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);
  const [reportRunning, setReportRunning] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aegis.customReport");
      if (!stored) return;
      const report = JSON.parse(stored);
      if (semanticSources.some((s) => s.id === report.sourceId))
        setSourceId(report.sourceId);
      if (Array.isArray(report.selected)) setSelected(report.selected);
      if (typeof report.name === "string") setName(report.name);
      if (Array.isArray(report.calculated)) setCalculated(report.calculated);
      if (Array.isArray(report.filters)) setFilters(report.filters);
      if (typeof report.grouping === "string") setGrouping(report.grouping);
      if (typeof report.visual === "string") setVisual(report.visual);
      setSaved(true);
    } catch {
      localStorage.removeItem("aegis.customReport");
    }
  }, []);
  const selectedFields = selected
    .map((id) => source.fields.find((f) => f.id === id))
    .filter(Boolean) as SemanticField[];
  const available = source.fields.filter(
    (f) =>
      !selected.includes(f.id) &&
      `${f.label} ${f.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const add = (id: string) => setSelected((fields) => [...fields, id]);
  const remove = (id: string) =>
    setSelected((fields) => fields.filter((x) => x !== id));
  const changeSource = (id: string) => {
    const next = semanticSources.find((s) => s.id === id)!;
    setSourceId(id);
    setSelected(next.fields.slice(0, 6).map((f) => f.id));
  };
  const drop = (target: string) => {
    if (!dragged || dragged === target) return;
    setSelected((fields) => {
      const copy = [...fields];
      const from = copy.indexOf(dragged),
        to = copy.indexOf(target);
      copy.splice(from, 1);
      copy.splice(to, 0, dragged);
      return copy;
    });
    setDragged(null);
  };
  const save = () => {
    localStorage.setItem(
      "aegis.customReport",
      JSON.stringify({
        sourceId,
        selected,
        name,
        calculated,
        filters,
        grouping,
        visual,
      }),
    );
    setSaved(true);
    notify(
      `Custom report “${name}” saved with ${selected.length} fields, ${filters.length} filters, and role-aware access.`,
    );
  };
  const buildGeneratedReport = async () => {
    const workloadMap: Record<string, string> = {
      Identity: "Microsoft Entra ID",
      "Exchange Online": "Exchange Online",
      "Microsoft Teams": "Microsoft Teams",
      "SharePoint Online": "SharePoint Online",
      "Microsoft Intune": "Microsoft Intune",
      "Licensing & Cost": "Licensing & Cost",
      "Unified Audit": "Microsoft Purview",
    };
    setReportRunning(true);
    notify(`${name} submitted to the persistent custom-report runtime.`);
    try {
      setGenerated(
        await runRuntimeReport(
          name,
          workloadMap[source.domain] ?? source.domain,
          selectedFields.map((field) => field.label),
        ),
      );
      notify(`${name} completed from persisted tenant resources.`);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Custom report runtime failed.",
      );
    } finally {
      setReportRunning(false);
    }
  };
  return (
    <>
      <Header
        path="REPORTING / CUSTOM REPORT DESIGNER"
        title="Custom report builder"
        description="Compose governed cross-workload reports from the local semantic model—without writing SQL or exposing raw provider payloads."
      >
        <Badge>
          <ShieldCheckmark24Regular /> Tenant-safe semantic query
        </Badge>
        <Btn
          onClick={() =>
            notify(
              "Report definition validation passed: no cross-tenant or restricted-field violations.",
            )
          }
        >
          <CheckmarkCircle24Regular /> Validate
        </Btn>
        <Btn primary onClick={save}>
          <Save24Regular /> {saved ? "Saved" : "Save report"}
        </Btn>
      </Header>
      <div className="builder-titlebar">
        <div>
          <label>REPORT NAME</label>
          <input
            aria-label="Report name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <span>
          <small>Owner</small>
          <strong>Alex Morgan</strong>
        </span>
        <span>
          <small>Workspace</small>
          <strong>Security Operations</strong>
        </span>
        <Badge tone="gold">DRAFT v1.3</Badge>
      </div>
      <div className="builder-tabs">
        {(["design", "preview", "schedule", "security"] as const).map((x) => (
          <button
            className={tab === x ? "selected" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x === "design" ? (
              <ColumnTriple24Regular />
            ) : x === "preview" ? (
              <Table24Regular />
            ) : x === "schedule" ? (
              <CalendarClock24Regular />
            ) : (
              <LockClosed24Regular />
            )}
            {x}
          </button>
        ))}
      </div>
      {tab === "design" && (
        <div className="builder-layout">
          <aside className="source-panel">
            <header>
              <strong>1. DATA SOURCE</strong>
              <small>{semanticSources.length} governed objects</small>
            </header>
            <label className="field-search">
              <Search20Regular />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find source or field…"
              />
            </label>
            <div className="source-list">
              {semanticSources.map((s) => (
                <button
                  className={sourceId === s.id ? "selected" : ""}
                  key={s.id}
                  onClick={() => changeSource(s.id)}
                >
                  <Database24Regular />
                  <span>
                    <strong>{s.name}</strong>
                    <small>
                      {s.domain} · {s.records}
                    </small>
                  </span>
                  <ChevronRight20Regular />
                </button>
              ))}
            </div>
            <header className="field-header">
              <strong>AVAILABLE FIELDS</strong>
              <small>{available.length}</small>
            </header>
            <div className="available-fields">
              {available.map((f) => (
                <button
                  key={f.id}
                  onClick={() => add(f.id)}
                  title={f.description}
                >
                  <span>
                    <b>{f.type[0].toUpperCase()}</b>
                    <strong>{f.label}</strong>
                  </span>
                  {f.sensitive && <LockClosed24Regular />}
                  <Add24Regular />
                </button>
              ))}
            </div>
          </aside>
          <main className="design-canvas">
            <div className="canvas-intro">
              <div>
                <strong>2. REPORT COLUMNS</strong>
                <small>Drag to reorder · click × to remove</small>
              </div>
              <Badge>{selected.length} columns</Badge>
            </div>
            <div className="selected-fields">
              {selectedFields.map((f, index) => (
                <div
                  draggable
                  onDragStart={() => setDragged(f.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => drop(f.id)}
                  key={f.id}
                >
                  <i>⠿</i>
                  <span>{index + 1}</span>
                  <b>{f.label}</b>
                  <em>{f.type}</em>
                  {f.sensitive && <LockClosed24Regular />}
                  <button aria-label={`Remove ${f.label} column`} title={`Remove ${f.label}`} onClick={() => remove(f.id)}>×</button>
                </div>
              ))}
            </div>
            <div className="calculated-section">
              <header>
                <div>
                  <Code24Regular />
                  <span>
                    <strong>Calculated fields</strong>
                    <small>
                      Expressions execute locally after authorization filtering
                    </small>
                  </span>
                </div>
                <button
                  onClick={() =>
                    setCalculated((c) => [
                      ...c,
                      {
                        name: `Calculated field ${c.length + 1}`,
                        formula: "COUNT([Display name])",
                      },
                    ])
                  }
                >
                  <Add24Regular /> Add formula
                </button>
              </header>
              {calculated.map((c, index) => (
                <div className="calculated-row" key={index}>
                  <span>fx</span>
                  <input
                    aria-label={`Calculated field ${index + 1} name`}
                    value={c.name}
                    onChange={(e) =>
                      setCalculated((all) =>
                        all.map((x, i) =>
                          i === index ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <code>{c.formula}</code>
                  <button
                    aria-label={`Delete calculated field ${index + 1}`}
                    title={`Delete ${c.name}`}
                    onClick={() =>
                      setCalculated((all) => all.filter((_, i) => i !== index))
                    }
                  >
                    <Delete24Regular />
                  </button>
                </div>
              ))}
            </div>
            <div className="semantic-plan">
              <Sparkle24Filled />
              <div>
                <strong>Semantic plan</strong>
                <p>
                  Query <b>{source.name}</b>, enforce tenant and role policy,
                  select {selected.length} approved fields, apply{" "}
                  {filters.length} predicates, calculate {calculated.length}{" "}
                  derived field, group by {grouping}, render as {visual}.
                </p>
              </div>
              <button onClick={() => setTab("preview")}>
                Preview result →
              </button>
            </div>
          </main>
          <aside className="configuration-panel">
            <header>
              <strong>3. CONFIGURE</strong>
              <small>Report behavior and presentation</small>
            </header>
            <section>
              <div className="config-title">
                <Filter24Regular />
                <strong>Filters</strong>
                <button
                  onClick={() =>
                    setFilters((x) => [
                      ...x,
                      {
                        field: "Department",
                        operator: "equals",
                        value: "Technology",
                      },
                    ])
                  }
                >
                  + Add
                </button>
              </div>
              {filters.map((f, index) => (
                <div className="condition" key={index}>
                  <select
                    aria-label={`Filter ${index + 1} field`}
                    value={f.field}
                    onChange={(e) =>
                      setFilters((all) =>
                        all.map((x, i) =>
                          i === index ? { ...x, field: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option>Account enabled</option>
                    <option>Risk score</option>
                    <option>Department</option>
                    <option>Last activity</option>
                  </select>
                  <select
                    aria-label={`Filter ${index + 1} operator`}
                    value={f.operator}
                    onChange={(e) =>
                      setFilters((all) =>
                        all.map((x, i) =>
                          i === index ? { ...x, operator: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option>equals</option>
                    <option>greater than</option>
                    <option>contains</option>
                    <option>before</option>
                  </select>
                  <input
                    aria-label={`Filter ${index + 1} value`}
                    value={f.value}
                    onChange={(e) =>
                      setFilters((all) =>
                        all.map((x, i) =>
                          i === index ? { ...x, value: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <button
                    aria-label={`Remove filter ${index + 1}`}
                    title={`Remove filter ${index + 1}`}
                    onClick={() =>
                      setFilters((all) => all.filter((_, i) => i !== index))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </section>
            <section>
              <div className="config-title">
                <Grid24Regular />
                <strong>Grouping & sort</strong>
              </div>
              <label>
                Group rows by
                <select
                  value={grouping}
                  onChange={(e) => setGrouping(e.target.value)}
                >
                  {selectedFields.map((f) => (
                    <option key={f.id}>{f.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Primary sort
                <select>
                  <option>Risk score · descending</option>
                  <option>Display name · ascending</option>
                  <option>Last activity · newest</option>
                </select>
              </label>
            </section>
            <section>
              <div className="config-title">
                <DataBarVertical24Regular />
                <strong>Visualization</strong>
              </div>
              <div className="visual-options">
                {["Table", "Bar", "Trend", "KPI"].map((v) => (
                  <button
                    className={visual === v ? "selected" : ""}
                    onClick={() => setVisual(v)}
                    key={v}
                  >
                    {v === "Table" ? (
                      <Table24Regular />
                    ) : (
                      <DataBarVertical24Regular />
                    )}
                    {v}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <div className="config-title">
                <Settings24Regular />
                <strong>Result controls</strong>
              </div>
              <label className="switch-line">
                <span>
                  Include historical comparison
                  <small>Compare with previous period</small>
                </span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="switch-line">
                <span>
                  Show evidence freshness
                  <small>Expose source observation time</small>
                </span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="switch-line">
                <span>
                  Limit result rows<small>Current maximum: 50,000</small>
                </span>
                <input type="checkbox" />
              </label>
            </section>
          </aside>
        </div>
      )}
      {tab === "preview" && (
        <ReportPreview
          name={name}
          source={source}
          fields={selectedFields}
          filters={filters.length}
          visual={visual}
          notify={notify}
          onRun={() => void buildGeneratedReport()}
          running={reportRunning}
        />
      )}{" "}
      {tab === "schedule" && <ScheduleDesigner notify={notify} />}{" "}
      {tab === "security" && <ReportSecurity notify={notify} />}
      <SavedReports notify={notify} />
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

function ReportPreview({
  name,
  source,
  fields,
  filters,
  visual,
  notify,
  onRun,
  running,
}: {
  name: string;
  source: (typeof semanticSources)[number];
  fields: SemanticField[];
  filters: number;
  visual: string;
  notify: (m: string) => void;
  onRun: () => void;
  running: boolean;
}) {
  const sample = () =>
    generateCustomReport(
      name,
      source.domain === "Identity" ? "Microsoft Entra ID" : source.domain,
      fields.map((field) => field.label),
      previewRows.map((row, index) =>
        fields.map((field) =>
          String(
            (row as Record<string, unknown>)[field.id] ??
              ["Enabled", "Member", "Technology", "Standard"][index % 4],
          ),
        ),
      ),
    );
  return (
    <div className="builder-preview">
      <div className="preview-toolbar">
        <div>
          <strong>Live preview</strong>
          <small>
            {source.name} · 5 of approximately 92 matching rows · {filters}{" "}
            filters · {visual}
          </small>
        </div>
        <span>
          <i /> Evidence current · 2 minutes
        </span>
        <Btn
          onClick={() => {
            exportReportExcel(sample());
            notify(
              "Preview downloaded as an Excel workbook with immutable audit event.",
            );
          }}
        >
          <ArrowDownload24Regular /> Export sample
        </Btn>
        <Btn primary onClick={onRun}>
          <Play24Regular /> {running ? "Generating..." : "Run full report"}
        </Btn>
      </div>
      <div className="result-table">
        <div>
          {fields.map((f) => (
            <span key={f.id}>
              {f.label}
              {f.sensitive && <LockClosed24Regular />}
            </span>
          ))}
        </div>
        {previewRows.map((row, index) => (
          <div key={index}>
            {fields.map((f) => (
              <span key={f.id}>
                {String(
                  (row as Record<string, unknown>)[f.id] ??
                    ["Enabled", "Member", "Technology", "Standard"][index % 4],
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
      <footer>
        <span>Showing 5 rows</span>
        <span>
          Tenant policy applied · Restricted fields masked where required
        </span>
        <span>Query completed in 184 ms</span>
      </footer>
    </div>
  );
}

const REPORT_SCHEDULE_STORAGE_KEY = "aegis.customReport.schedule.v1";

type ReportScheduleSettings = {
  scheduleName: string;
  frequency: string;
  runDay: string;
  runTime: string;
  timeZone: string;
  snapshot: string;
  delivery: string;
  recipients: string;
  exportFormat: string;
  retention: string;
  encryption: string;
};

const DEFAULT_REPORT_SCHEDULE: ReportScheduleSettings = {
  scheduleName: "Weekly privileged identity review",
  frequency: "Weekly",
  runDay: "Monday",
  runTime: "08:00",
  timeZone: "Asia/Dubai (UTC+04:00)",
  snapshot: "Latest successful collection",
  delivery: "Email and Microsoft Teams",
  recipients: "Identity Operations; CISO Office",
  exportFormat: "Encrypted Excel (.xlsx)",
  retention: "90 days",
  encryption: "Organization-managed encryption",
};

function isReportScheduleSettings(
  value: unknown,
): value is ReportScheduleSettings {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Object.keys(DEFAULT_REPORT_SCHEDULE).every(
    (key) => typeof candidate[key] === "string",
  );
}

function validateReportSchedule(settings: ReportScheduleSettings) {
  const issues: string[] = [];
  if (settings.scheduleName.trim().length < 3)
    issues.push("Enter a schedule name.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.runTime))
    issues.push("Enter a valid 24-hour run time.");
  if (
    settings.delivery === "Email and Microsoft Teams" &&
    !settings.recipients.trim()
  )
    issues.push("Enter at least one approved recipient.");
  return issues;
}

function ScheduleDesigner({ notify }: { notify: (m: string) => void }) {
  const [settings, setSettings] = useState<ReportScheduleSettings>(
    DEFAULT_REPORT_SCHEDULE,
  );
  const [version, setVersion] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const restored = readVersionedLocalState(
      REPORT_SCHEDULE_STORAGE_KEY,
      isReportScheduleSettings,
    );
    if (!restored) return;
    setSettings(restored.data);
    setVersion(restored.version);
    setSavedAt(restored.savedAt);
  }, []);

  const update = <K extends keyof ReportScheduleSettings>(
    key: K,
    value: ReportScheduleSettings[K],
  ) => setSettings((current) => ({ ...current, [key]: value }));

  const validateDelivery = () => {
    const issues = validateReportSchedule(settings);
    notify(
      issues.length
        ? `Schedule validation failed: ${issues.join(" ")}`
        : "Schedule validation passed. Timing, recipients, and export policy are authorized.",
    );
    return issues.length === 0;
  };

  const activateSchedule = () => {
    if (!validateDelivery()) return;
    const nextVersion = version + 1;
    const nextSavedAt = new Date().toISOString();
    const saved = writeVersionedLocalState(REPORT_SCHEDULE_STORAGE_KEY, {
      schemaVersion: LOCAL_STATE_SCHEMA_VERSION,
      version: nextVersion,
      savedAt: nextSavedAt,
      // This payload contains presentation metadata only. No connector secret,
      // credential, message content, or encryption key is stored in the browser.
      data: { ...settings },
    });
    if (!saved) {
      notify("Schedule activation failed because browser storage is unavailable.");
      return;
    }
    setVersion(nextVersion);
    setSavedAt(nextSavedAt);
    notify(
      `Report schedule activated using ${settings.delivery} as version ${nextVersion}.`,
    );
  };

  return (
    <div className="schedule-designer">
      <section>
        <header>
          <CalendarClock24Regular />
          <div>
            <h2>Schedule and delivery</h2>
            <p>
              Generate reports locally and distribute through approved channels.
            </p>
          </div>
        </header>
        <div className="form-grid">
          <label>
            Schedule name
            <input
              value={settings.scheduleName}
              onChange={(event) => update("scheduleName", event.target.value)}
            />
          </label>
          <label>
            Frequency
            <select
              value={settings.frequency}
              onChange={(event) => update("frequency", event.target.value)}
            >
              <option>Weekly</option>
              <option>Daily</option>
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
          </label>
          <label>
            Run day
            <select
              value={settings.runDay}
              onChange={(event) => update("runDay", event.target.value)}
            >
              <option>Monday</option>
              <option>Friday</option>
              <option>First business day</option>
            </select>
          </label>
          <label>
            Run time
            <input
              type="time"
              value={settings.runTime}
              onChange={(event) => update("runTime", event.target.value)}
            />
          </label>
          <label>
            Time zone
            <select
              value={settings.timeZone}
              onChange={(event) => update("timeZone", event.target.value)}
            >
              <option>Asia/Dubai (UTC+04:00)</option>
              <option>UTC</option>
              <option>Europe/London</option>
            </select>
          </label>
          <label>
            Data snapshot
            <select
              value={settings.snapshot}
              onChange={(event) => update("snapshot", event.target.value)}
            >
              <option>Latest successful collection</option>
              <option>End of previous day</option>
              <option>Fixed historical date</option>
            </select>
          </label>
        </div>
      </section>
      <section>
        <header>
          <Mail24Regular />
          <div>
            <h2>Delivery configuration</h2>
            <p>
              Exports are policy checked, watermarked, encrypted, and audited.
            </p>
          </div>
        </header>
        <div className="channel-options">
          {[
            "Email and Microsoft Teams",
            "Secure download only",
            "SharePoint evidence library",
            "ServiceNow attachment",
          ].map((x) => (
            <button
              className={settings.delivery === x ? "selected" : ""}
              key={x}
              onClick={() => update("delivery", x)}
            >
              <CheckmarkCircle24Regular />
              <span>
                <strong>{x}</strong>
                <small>
                  {x === "Secure download only"
                    ? "No report content sent through messaging"
                    : "Uses configured protected connector"}
                </small>
              </span>
            </button>
          ))}
        </div>
        <div className="form-grid">
          <label>
            Recipients
            <input
              value={settings.recipients}
              onChange={(event) => update("recipients", event.target.value)}
            />
          </label>
          <label>
            Export format
            <select
              value={settings.exportFormat}
              onChange={(event) => update("exportFormat", event.target.value)}
            >
              <option>Encrypted Excel (.xlsx)</option>
              <option>PDF</option>
              <option>CSV</option>
              <option>JSON</option>
            </select>
          </label>
          <label>
            Retention
            <select
              value={settings.retention}
              onChange={(event) => update("retention", event.target.value)}
            >
              <option>90 days</option>
              <option>1 year</option>
              <option>7 years — compliance evidence</option>
            </select>
          </label>
          <label>
            Password protection
            <select
              value={settings.encryption}
              onChange={(event) => update("encryption", event.target.value)}
            >
              <option>Organization-managed encryption</option>
              <option>One-time passphrase</option>
            </select>
          </label>
        </div>
      </section>
      <div className="schedule-actions">
        {savedAt && (
          <small aria-live="polite">
            Active · version {version} · {formatLocalTimestamp(savedAt)}
          </small>
        )}
        <Btn onClick={validateDelivery}>
          Validate delivery
        </Btn>
        <Btn primary onClick={activateSchedule}>
          <CalendarClock24Regular /> Activate schedule
        </Btn>
      </div>
    </div>
  );
}

const REPORT_ACCESS_STORAGE_KEY = "aegis.customReport.accessPolicy.v1";

const REPORT_ACCESS_PRINCIPALS = [
  {
    principal: "Security Administrators",
    access: "Edit",
    scope: "All authorized tenant data",
    export: "Allowed",
  },
  {
    principal: "SOC Tier 1 Analysts",
    access: "View",
    scope: "Security and identity only",
    export: "Denied",
  },
  {
    principal: "CISO Office",
    access: "View",
    scope: "Executive aggregate",
    export: "PDF only",
  },
  {
    principal: "External Auditors",
    access: "View",
    scope: "Evidence snapshot",
    export: "Watermarked",
  },
] as const;

type ReportProtectionSettings = {
  classification: string;
  maskPersonalFields: boolean;
  requireExportJustification: boolean;
  blockExternalRecipients: boolean;
  applyVisibleWatermark: boolean;
};

type StoredReportAccessPolicy = {
  principals: Array<{
    principal: string;
    access: string;
    scope: string;
    export: string;
  }>;
  protection: ReportProtectionSettings;
};

const DEFAULT_REPORT_PROTECTION: ReportProtectionSettings = {
  classification: "Confidential · Security",
  maskPersonalFields: true,
  requireExportJustification: true,
  blockExternalRecipients: true,
  applyVisibleWatermark: true,
};

function isStoredReportAccessPolicy(
  value: unknown,
): value is StoredReportAccessPolicy {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredReportAccessPolicy>;
  if (!Array.isArray(candidate.principals) || !candidate.protection) return false;
  const protection = candidate.protection as unknown as Record<string, unknown>;
  return (
    typeof protection.classification === "string" &&
    typeof protection.maskPersonalFields === "boolean" &&
    typeof protection.requireExportJustification === "boolean" &&
    typeof protection.blockExternalRecipients === "boolean" &&
    typeof protection.applyVisibleWatermark === "boolean"
  );
}

function ReportSecurity({ notify }: { notify: (m: string) => void }) {
  const [protection, setProtection] = useState<ReportProtectionSettings>(
    DEFAULT_REPORT_PROTECTION,
  );
  const [version, setVersion] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const restored = readVersionedLocalState(
      REPORT_ACCESS_STORAGE_KEY,
      isStoredReportAccessPolicy,
    );
    if (!restored) return;
    setProtection(restored.data.protection);
    setVersion(restored.version);
    setSavedAt(restored.savedAt);
  }, []);

  const updateProtection = <K extends keyof ReportProtectionSettings>(
    key: K,
    value: ReportProtectionSettings[K],
  ) => setProtection((current) => ({ ...current, [key]: value }));

  const simulatePersonas = () => {
    const riskySettings = [
      !protection.requireExportJustification && "export justification is off",
      !protection.blockExternalRecipients && "external recipients are allowed",
      !protection.applyVisibleWatermark && "watermarking is off",
    ].filter(Boolean);
    notify(
      riskySettings.length
        ? `Access simulation completed with ${riskySettings.length} advisor finding(s): ${riskySettings.join(
            ", ",
          )}.`
        : `Access simulation passed for all ${REPORT_ACCESS_PRINCIPALS.length} configured personas.`,
    );
  };

  const savePolicy = () => {
    if (!protection.classification.trim()) {
      notify("Security policy save failed: select a data classification.");
      return;
    }
    const nextVersion = version + 1;
    const nextSavedAt = new Date().toISOString();
    const data: StoredReportAccessPolicy = {
      principals: REPORT_ACCESS_PRINCIPALS.map((item) => ({ ...item })),
      protection: { ...protection },
    };
    if (
      !writeVersionedLocalState(REPORT_ACCESS_STORAGE_KEY, {
        schemaVersion: LOCAL_STATE_SCHEMA_VERSION,
        version: nextVersion,
        savedAt: nextSavedAt,
        // Principal names, access labels, and policy switches are demo metadata;
        // report data and identity credentials are deliberately excluded.
        data,
      })
    ) {
      notify("Security policy save failed because browser storage is unavailable.");
      return;
    }
    setVersion(nextVersion);
    setSavedAt(nextSavedAt);
    notify(`Local demo report-policy metadata saved as version ${nextVersion}; runtime authorization is enforced separately by the API.`);
  };

  return (
    <div className="report-security">
      <section>
        <header>
          <ShieldCheckmark24Regular />
          <div>
            <h2>Report access policy</h2>
            <p>
              Browser-persisted demo metadata for presentation design. Runtime
              API authorization and export enforcement are separate production controls.
            </p>
          </div>
        </header>
        <div className="access-table">
          <div>
            <span>Principal</span>
            <span>Access</span>
            <span>Scope</span>
            <span>Export</span>
            <span />
          </div>
          {REPORT_ACCESS_PRINCIPALS.map((rule) => (
            <div key={rule.principal}>
              <span>{rule.principal}</span>
              <span>{rule.access}</span>
              <span>{rule.scope}</span>
              <span>{rule.export}</span>
              <button
                aria-label={`Edit ${rule.principal} access rule`}
                onClick={() =>
                  notify(`${rule.principal} access rule editor opened.`)
                }
              >
                •••
              </button>
            </div>
          ))}
        </div>
        <button
          className="add-principal"
          onClick={() =>
            notify(
              "Principal picker opened for a new role, group, or user assignment.",
            )
          }
        >
          + Add role, group, or user
        </button>
      </section>
      <section>
        <header>
          <LockClosed24Regular />
          <div>
            <h2>Data protection</h2>
            <p>Classification, masking, export, and retention policy.</p>
          </div>
        </header>
        <div className="security-options">
          <label>
            <span>
              Classification<strong>Confidential · Security</strong>
            </span>
            <select
              value={protection.classification}
              onChange={(event) =>
                updateProtection("classification", event.target.value)
              }
            >
              <option>Confidential · Security</option>
              <option>Internal</option>
              <option>Restricted</option>
            </select>
          </label>
          <label>
            <span>
              Mask personal fields<strong>Apply based on viewer role</strong>
            </span>
            <input
              type="checkbox"
              checked={protection.maskPersonalFields}
              onChange={(event) =>
                updateProtection("maskPersonalFields", event.target.checked)
              }
            />
          </label>
          <label>
            <span>
              Require export justification
              <strong>Captured in immutable audit</strong>
            </span>
            <input
              type="checkbox"
              checked={protection.requireExportJustification}
              onChange={(event) =>
                updateProtection(
                  "requireExportJustification",
                  event.target.checked,
                )
              }
            />
          </label>
          <label>
            <span>
              Block external recipients
              <strong>Domain and guest validation</strong>
            </span>
            <input
              type="checkbox"
              checked={protection.blockExternalRecipients}
              onChange={(event) =>
                updateProtection("blockExternalRecipients", event.target.checked)
              }
            />
          </label>
          <label>
            <span>
              Apply visible watermark
              <strong>User, tenant, timestamp, classification</strong>
            </span>
            <input
              type="checkbox"
              checked={protection.applyVisibleWatermark}
              onChange={(event) =>
                updateProtection("applyVisibleWatermark", event.target.checked)
              }
            />
          </label>
        </div>
      </section>
      <div className="schedule-actions">
        {savedAt && (
          <small aria-live="polite">
            Saved · version {version} · {formatLocalTimestamp(savedAt)}
          </small>
        )}
        <Btn onClick={simulatePersonas}>
          Simulate personas
        </Btn>
        <Btn primary onClick={savePolicy}>
          Save security policy
        </Btn>
      </div>
    </div>
  );
}

function SavedReports({ notify }: { notify: (m: string) => void }) {
  return (
    <section className="saved-artifacts">
      <header>
        <div>
          <h2>Custom report workspace</h2>
          <p>Reusable definitions, versions, schedules, and consumer access.</p>
        </div>
        <button
          onClick={() =>
            notify(
              "All 184 custom report definitions loaded into the workspace.",
            )
          }
        >
          View all 184 →
        </button>
      </header>
      <div>
        {[
          [
            "Privileged identity risk and MFA coverage",
            "Security Operations",
            "Draft v1.3",
            "Not scheduled",
          ],
          [
            "External sharing risk register",
            "Data Governance",
            "Published v4.1",
            "Monday 08:00",
          ],
          [
            "License optimization by business unit",
            "IT Finance",
            "Published v2.8",
            "Monthly · 15th",
          ],
          [
            "Regulatory mailbox retention exceptions",
            "Compliance Office",
            "Published v3.2",
            "Daily 06:00",
          ],
        ].map((x, i) => (
          <article key={x[0]}>
            <span>
              <DocumentBulletList24Regular />
            </span>
            <div>
              <strong>{x[0]}</strong>
              <small>
                {x[1]} · {x[2]}
              </small>
            </div>
            <em>{x[3]}</em>
            <button
              onClick={() =>
                notify(`Custom report “${x[0]}” opened for editing.`)
              }
            >
              Open
            </button>
            <button
              onClick={() =>
                notify(
                  `Version, duplicate, share, archive, and ownership actions opened for ${x[0]}.`,
                )
              }
            >
              •••
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

type Widget = {
  id: number;
  type: string;
  title: string;
  size: "small" | "medium" | "wide";
};
function DashboardDesigner({ notify }: { notify: (m: string) => void }) {
  const palette = [
    ["KPI card", "Executive number"],
    ["Risk trend", "Time-series analysis"],
    ["Finding table", "Ranked actionable list"],
    ["Compliance gauge", "Framework posture"],
    ["License savings", "FinOps opportunity"],
    ["Connector health", "Collection assurance"],
    ["Map", "Geographic signals"],
    ["AI narrative", "Grounded executive summary"],
  ];
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 1, type: "KPI card", title: "Security posture", size: "small" },
    { id: 2, type: "Risk trend", title: "Six-month risk trend", size: "wide" },
    {
      id: 3,
      type: "Finding table",
      title: "Priority findings",
      size: "medium",
    },
    {
      id: 4,
      type: "Compliance gauge",
      title: "Regulatory readiness",
      size: "small",
    },
  ]);
  const [next, setNext] = useState(5);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aegis.dashboard.widgets");
      if (!stored) return;
      const restored = JSON.parse(stored) as Widget[];
      if (Array.isArray(restored) && restored.length) {
        setWidgets(restored);
        setNext(Math.max(...restored.map((item) => item.id)) + 1);
      }
    } catch {
      localStorage.removeItem("aegis.dashboard.widgets");
    }
  }, []);
  const add = (type: string) => {
    setWidgets((w) => [...w, { id: next, type, title: type, size: "small" }]);
    setNext((n) => n + 1);
  };
  const cycle = (id: number) =>
    setWidgets((w) =>
      w.map((x) =>
        x.id === id
          ? {
              ...x,
              size:
                x.size === "small"
                  ? "medium"
                  : x.size === "medium"
                    ? "wide"
                    : "small",
            }
          : x,
      ),
    );
  return (
    <>
      <Header
        path="DASHBOARDS / DESIGNER"
        title="Custom dashboard designer"
        description="Compose role-aware command centers from governed widgets, reports, findings, and local AI narratives."
      >
        <Btn>Dashboard library</Btn>
        <Btn
          primary
          onClick={() => {
            localStorage.setItem(
              "aegis.dashboard.widgets",
              JSON.stringify(widgets),
            );
            notify(`Dashboard saved with ${widgets.length} governed widgets.`);
          }}
        >
          <Save24Regular /> Save dashboard
        </Btn>
      </Header>
      <div className="dashboard-builder">
        <aside>
          <header>
            <strong>WIDGET LIBRARY</strong>
            <small>Drag or add to canvas</small>
          </header>
          {palette.map(([type, desc]) => (
            <button key={type} onClick={() => add(type)}>
              <Grid24Regular />
              <span>
                <strong>{type}</strong>
                <small>{desc}</small>
              </span>
              <Add24Regular />
            </button>
          ))}
        </aside>
        <main>
          <div className="dashboard-config">
            <div>
              <label>DASHBOARD NAME</label>
              <input aria-label="Dashboard name" defaultValue="CISO Security and Compliance Command Center" />
            </div>
            <select aria-label="Dashboard layout">
              <option>Desktop · 12-column grid</option>
              <option>Wallboard · 16:9</option>
              <option>Mobile executive view</option>
            </select>
            <Badge>{widgets.length} widgets</Badge>
          </div>
          <div className="dashboard-canvas">
            {widgets.map((w) => (
              <article className={w.size} key={w.id}>
                <header>
                  <span>⠿</span>
                  <strong>{w.title}</strong>
                  <button onClick={() => cycle(w.id)} title="Change size">
                    ↔
                  </button>
                  <button
                    aria-label={`Remove ${w.title} widget`}
                    title={`Remove ${w.title}`}
                    onClick={() =>
                      setWidgets((all) => all.filter((x) => x.id !== w.id))
                    }
                  >
                    ×
                  </button>
                </header>
                <WidgetPreview type={w.type} />
                <footer>
                  <span>{w.type}</span>
                  <button
                    onClick={() =>
                      notify(
                        `${w.title} data source and presentation settings opened.`,
                      )
                    }
                  >
                    Configure
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </main>
        <aside className="dashboard-settings">
          <header>
            <strong>DASHBOARD POLICY</strong>
            <small>Audience and behavior</small>
          </header>
          <label>
            Default audience
            <select>
              <option>CISO Office</option>
              <option>Security Administrators</option>
              <option>Executive Leadership</option>
            </select>
          </label>
          <label>
            Refresh interval
            <select>
              <option>5 minutes</option>
              <option>15 minutes</option>
              <option>Hourly</option>
            </select>
          </label>
          <label>
            Historical range
            <select>
              <option>6 months</option>
              <option>30 days</option>
              <option>12 months</option>
            </select>
          </label>
          <label className="switch-line">
            <span>
              Presentation mode<small>Auto-rotate sections</small>
            </span>
            <input type="checkbox" />
          </label>
          <label className="switch-line">
            <span>
              Role-aware redaction<small>Mask sensitive widgets</small>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="switch-line">
            <span>
              Allow personal copies<small>Users can customize clone</small>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
        </aside>
      </div>
    </>
  );
}
function WidgetPreview({ type }: { type: string }) {
  if (type === "Risk trend")
    return (
      <div className="fake-trend">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <svg viewBox="0 0 300 80" preserveAspectRatio="none">
          <polyline points="0,65 55,52 105,58 160,35 215,28 300,12" />
        </svg>
      </div>
    );
  if (type.includes("table") || type === "Finding table")
    return (
      <div className="fake-table">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    );
  if (type === "Compliance gauge")
    return (
      <div className="fake-gauge">
        <strong>86%</strong>
        <small>compliant</small>
      </div>
    );
  return (
    <div className="fake-kpi">
      <strong>{type === "License savings" ? "$41.8K" : "78"}</strong>
      <span>
        {type === "License savings" ? "monthly opportunity" : "current score"}
      </span>
      <em>↑ improving</em>
    </div>
  );
}

const CONFIGURATION_STORAGE_KEY = "aegis.enterpriseConfiguration.v1";
const BASE_CONFIGURATION_VERSION = 42;
const SENSITIVE_CONFIGURATION_LABEL =
  /password|client secret|access token|refresh token|private key|credential|connection string/i;
const REQUIRED_CONFIGURATION_TOGGLES = new Set([
  "Graph delta synchronization",
  "Adaptive throttling",
  "Raw payload minimization",
  "Require MFA for administrators",
  "Require phishing-resistant admin MFA",
  "PostgreSQL row-level security",
  "Field-level envelope encryption",
  "Network egress denied",
  "RBAC-filtered retrieval",
  "Prompt and output filtering",
  "Redact sensitive evidence",
  "Delivery receipt audit",
  "Mutual TLS",
  "Signed webhook payloads",
  "Immutable backup copy",
  "Default-deny network policy",
  "Signed-image admission",
  "Tamper-evident audit chain",
]);

function createDefaultConfigurationState(): ConfigurationWorkspaceState {
  return Object.fromEntries(
    Object.entries(CONFIGURATION_DEFINITIONS).map(([id, definition]) => [
      id,
      {
        fields: Object.fromEntries(
          definition.fields.map(([label, value]) => [label, value]),
        ),
        toggles: Object.fromEntries(
          definition.toggles.map(([label, , checked]) => [label, checked]),
        ),
      },
    ]),
  );
}

function sanitizeConfigurationSections(
  sections: ConfigurationWorkspaceState,
): ConfigurationWorkspaceState {
  const defaults = createDefaultConfigurationState();
  return Object.fromEntries(
    Object.entries(CONFIGURATION_DEFINITIONS).map(([id, definition]) => {
      const candidate = sections[id];
      return [
        id,
        {
          fields: Object.fromEntries(
            definition.fields.map(([label]) => [
              label,
              SENSITIVE_CONFIGURATION_LABEL.test(label)
                ? defaults[id].fields[label]
                : typeof candidate?.fields[label] === "string"
                  ? candidate.fields[label]
                  : defaults[id].fields[label],
            ]),
          ),
          toggles: Object.fromEntries(
            definition.toggles.map(([label]) => [
              label,
              typeof candidate?.toggles[label] === "boolean"
                ? candidate.toggles[label]
                : defaults[id].toggles[label],
            ]),
          ),
        },
      ];
    }),
  );
}

function isStoredConfigurationWorkspace(
  value: unknown,
): value is StoredConfigurationWorkspace {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredConfigurationWorkspace>;
  if (
    !candidate.sections ||
    typeof candidate.sections !== "object" ||
    typeof candidate.savedBy !== "string" ||
    typeof candidate.lastSavedSection !== "string"
  )
    return false;
  return Object.entries(CONFIGURATION_DEFINITIONS).every(([id, definition]) => {
    const section = candidate.sections?.[id];
    return Boolean(
      section &&
        definition.fields.every(
          ([label]) => typeof section.fields?.[label] === "string",
        ) &&
        definition.toggles.every(
          ([label]) => typeof section.toggles?.[label] === "boolean",
        ),
    );
  });
}

function validateConfigurationSection(
  id: string,
  state: ConfigurationSectionState,
) {
  const errors: Record<string, string> = {};
  for (const [label, , type] of CONFIGURATION_DEFINITIONS[id].fields) {
    const value = state.fields[label]?.trim() ?? "";
    if (!value) {
      errors[label] = `${label} is required.`;
      continue;
    }
    if (/^custom configuration/i.test(value)) {
      errors[label] = "Select a concrete configuration value.";
      continue;
    }
    if (type === "number" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      errors[label] = "Enter a valid non-negative number.";
    }
    if (
      label === "Primary Microsoft tenant" &&
      !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(value)
    )
      errors[label] = "Enter a valid Microsoft tenant domain.";
    if (label === "Application audience" && !value.startsWith("api://"))
      errors[label] = "The audience must start with api://.";
    if (label === "Inference endpoint") {
      try {
        const endpoint = new URL(value);
        if (!["http:", "https:"].includes(endpoint.protocol))
          errors[label] = "Use an HTTP or HTTPS endpoint.";
      } catch {
        errors[label] = "Enter a valid inference endpoint URL.";
      }
    }
    if (label === "Email relay" && !/^[a-z0-9.-]+:\d{1,5}$/i.test(value))
      errors[label] = "Enter the relay as host:port.";
  }
  for (const [label] of CONFIGURATION_DEFINITIONS[id].toggles) {
    if (REQUIRED_CONFIGURATION_TOGGLES.has(label) && !state.toggles[label])
      errors[label] = `${label} is mandatory for the validated security baseline.`;
  }
  return errors;
}

function Configuration({ notify }: { notify: (m: string) => void }) {
  const [active, setActive] = useState("tenant");
  const [workspace, setWorkspace] = useState<ConfigurationWorkspaceState>(() =>
    createDefaultConfigurationState(),
  );
  const [errors, setErrors] = useState<ConfigurationValidationErrors>({});
  const [validatedAt, setValidatedAt] = useState<Record<string, string>>({});
  const [hasValidatedAll, setHasValidatedAll] = useState(false);
  const [version, setVersion] = useState(BASE_CONFIGURATION_VERSION);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const section = configurationSections.find((x) => x.id === active)!;
  const totalControls = useMemo(
    () =>
      Object.values(CONFIGURATION_DEFINITIONS).reduce(
        (count, definition) =>
          count + definition.fields.length + definition.toggles.length,
        0,
      ),
    [],
  );
  const errorCount = Object.values(errors).reduce(
    (count, sectionErrors) => count + Object.keys(sectionErrors).length,
    0,
  );

  useEffect(() => {
    const restored = readVersionedLocalState(
      CONFIGURATION_STORAGE_KEY,
      isStoredConfigurationWorkspace,
    );
    if (!restored) return;
    setWorkspace(sanitizeConfigurationSections(restored.data.sections));
    setVersion(Math.max(BASE_CONFIGURATION_VERSION, restored.version));
    setSavedAt(restored.savedAt);
  }, []);

  const validateOne = (id: string, announce = true) => {
    const sectionErrors = validateConfigurationSection(id, workspace[id]);
    setErrors((current) => ({ ...current, [id]: sectionErrors }));
    setValidatedAt((current) => ({
      ...current,
      [id]: new Date().toISOString(),
    }));
    if (announce) {
      const definition = CONFIGURATION_DEFINITIONS[id];
      notify(
        Object.keys(sectionErrors).length
          ? `${definition.title} validation failed with ${Object.keys(sectionErrors).length} required-field issue(s).`
          : `${definition.title} validation passed for ${definition.fields.length + definition.toggles.length} displayed controls.`,
      );
    }
    return sectionErrors;
  };

  const validateAll = () => {
    const allErrors: ConfigurationValidationErrors = {};
    const validationTimes: Record<string, string> = {};
    const now = new Date().toISOString();
    Object.keys(CONFIGURATION_DEFINITIONS).forEach((id) => {
      allErrors[id] = validateConfigurationSection(id, workspace[id]);
      validationTimes[id] = now;
    });
    const failures = Object.values(allErrors).reduce(
      (count, sectionErrors) => count + Object.keys(sectionErrors).length,
      0,
    );
    setErrors(allErrors);
    setValidatedAt(validationTimes);
    setHasValidatedAll(true);
    const firstInvalid = Object.keys(allErrors).find(
      (id) => Object.keys(allErrors[id]).length,
    );
    if (firstInvalid) setActive(firstInvalid);
    notify(
      failures
        ? `Configuration validation failed: ${failures} issue(s) require correction.`
        : `Configuration validation completed: ${totalControls} displayed controls passed with 0 failures.`,
    );
  };

  const saveChanges = () => {
    const allErrors: ConfigurationValidationErrors = {};
    const validationTimes: Record<string, string> = {};
    const validated = new Date().toISOString();
    Object.keys(CONFIGURATION_DEFINITIONS).forEach((id) => {
      allErrors[id] = validateConfigurationSection(id, workspace[id]);
      validationTimes[id] = validated;
    });
    const failures = Object.values(allErrors).reduce(
      (count, sectionErrors) => count + Object.keys(sectionErrors).length,
      0,
    );
    setErrors(allErrors);
    setValidatedAt(validationTimes);
    setHasValidatedAll(true);
    if (failures) {
      const firstInvalid = Object.keys(allErrors).find(
        (id) => Object.keys(allErrors[id]).length,
      );
      if (firstInvalid) setActive(firstInvalid);
      notify(
        `Configuration was not saved. Correct all ${failures} cross-section validation issue(s) first.`,
      );
      return;
    }
    const nextVersion = version + 1;
    const nextSavedAt = new Date().toISOString();
    const safeSections = sanitizeConfigurationSections(workspace);
    if (
      !writeVersionedLocalState(CONFIGURATION_STORAGE_KEY, {
        schemaVersion: LOCAL_STATE_SCHEMA_VERSION,
        version: nextVersion,
        savedAt: nextSavedAt,
        data: {
          sections: safeSections,
          savedBy: "Local demo administrator",
          lastSavedSection: active,
        },
      })
    ) {
      notify("Configuration save failed because browser storage is unavailable.");
      return;
    }
    setWorkspace(safeSections);
    setVersion(nextVersion);
    setSavedAt(nextSavedAt);
    notify(
      `${section.name} configuration saved as version ${nextVersion} at ${formatLocalTimestamp(nextSavedAt)}.`,
    );
  };

  const changeField = (label: string, value: string) => {
    setWorkspace((current) => ({
      ...current,
      [active]: {
        ...current[active],
        fields: { ...current[active].fields, [label]: value },
      },
    }));
    setErrors((current) => ({
      ...current,
      [active]: Object.fromEntries(
        Object.entries(current[active] ?? {}).filter(([key]) => key !== label),
      ),
    }));
  };

  const changeToggle = (label: string, value: boolean) => {
    setWorkspace((current) => ({
      ...current,
      [active]: {
        ...current[active],
        toggles: { ...current[active].toggles, [label]: value },
      },
    }));
    setErrors((current) => ({
      ...current,
      [active]: Object.fromEntries(
        Object.entries(current[active] ?? {}).filter(([key]) => key !== label),
      ),
    }));
  };

  return (
    <>
      <Header
        path="PLATFORM / ENTERPRISE CONFIGURATION"
        title="Platform configuration"
        description="Validated, browser-persisted demo metadata for identity, collection, data, AI, integrations, resilience, and security; it does not replace deployed control-plane enforcement."
      >
        <Badge tone={errorCount ? "gold" : "teal"}>
          {errorCount
            ? `${errorCount} VALIDATION ISSUE${errorCount === 1 ? "" : "S"}`
            : hasValidatedAll
              ? "ALL DISPLAYED CONTROLS VALIDATED"
              : "VALIDATION REQUIRED"}
        </Badge>
        <Btn onClick={validateAll}>
          <CheckmarkCircle24Regular /> Validate all
        </Btn>
        <Btn primary onClick={saveChanges}>
          <Save24Regular /> Save changes
        </Btn>
      </Header>
      <div className="configuration-layout">
        <aside>
          <div className="config-health">
            <span>Configuration posture</span>
            <strong>
              {hasValidatedAll
                ? `${Math.round(((totalControls - errorCount) / totalControls) * 100)}%`
                : "—"}
            </strong>
            <small>
              {hasValidatedAll
                ? `${totalControls - errorCount} passed · ${errorCount} failed`
                : "Run validation to calculate"}
            </small>
          </div>
          {configurationSections.map((s) => (
            <button
              className={active === s.id ? "selected" : ""}
              key={s.id}
              onClick={() => setActive(s.id)}
            >
              <ConfigIcon id={s.id} />
              <span>
                <strong>{s.name}</strong>
                <small>{s.description}</small>
              </span>
              <ChevronRight20Regular />
            </button>
          ))}
        </aside>
        <main>
          <header>
            <div>
              <span>
                <ConfigIcon id={section.id} />
              </span>
              <div>
                <h2>{section.name}</h2>
                <p>{section.description}</p>
              </div>
            </div>
            <Badge>CONFIGURATION VERSION {version}</Badge>
          </header>
          <ConfigPanel
            id={section.id}
            state={workspace[section.id]}
            errors={errors[section.id] ?? {}}
            validatedAt={validatedAt[section.id] ?? null}
            version={version}
            savedAt={savedAt}
            onFieldChange={changeField}
            onToggleChange={changeToggle}
            onTest={() => validateOne(section.id)}
          />
        </main>
      </div>
    </>
  );
}
function ConfigIcon({ id }: { id: string }) {
  const Icon =
    id === "tenant"
      ? PeopleTeam24Regular
      : id === "connectors"
        ? CloudCheckmark24Regular
        : id === "identity"
          ? Key24Regular
          : id === "data"
            ? Database24Regular
            : id === "ai"
              ? Bot24Regular
              : id === "notifications"
                ? Mail24Regular
                : id === "integrations"
                  ? Apps24Regular
                  : id === "backup"
                    ? ArrowSync24Regular
                    : ShieldCheckmark24Regular;
  return <Icon />;
}
type ConfigurationDefinition = {
  title: string;
  description: string;
  fields: [string, string, "text" | "number" | "select"][];
  toggles: [string, string, boolean][];
  status: string;
};

const CONFIGURATION_DEFINITIONS: Record<string, ConfigurationDefinition> = {
    tenant: {
      title: "Organization boundary",
      description:
        "Defines the sovereign tenant context used for collection, storage, policy, and authorization.",
      fields: [
        ["Organization name", "Northstar Example Group (synthetic)", "text"],
        ["Primary Microsoft tenant", "globalholdings.onmicrosoft.com", "text"],
        ["Data residency", "UAE North · Customer datacenter", "select"],
        ["Default time zone", "Asia/Dubai (UTC+04:00)", "select"],
      ],
      toggles: [
        ["Multi-tenant mode", "Permit isolated secondary tenants", true],
        [
          "Business unit scoping",
          "Enable delegated organizational boundaries",
          true,
        ],
        [
          "Demo data overlay",
          "Clearly label synthetic presentation data",
          true,
        ],
      ],
      status: "Verified",
    },
    connectors: {
      title: "Microsoft API collection",
      description:
        "Certificate-authenticated least-privilege adapters with persisted cursors and throttling controls.",
      fields: [
        ["Collector identity", "CN=Aegis-Graph-Collector-2026", "text"],
        ["Certificate expiry", "14 July 2027 · 364 days", "text"],
        ["Default collection interval", "15 minutes", "select"],
        ["Concurrent workers", "8", "number"],
      ],
      toggles: [
        [
          "Graph delta synchronization",
          "Use incremental resource cursors",
          true,
        ],
        ["Adaptive throttling", "Honor Retry-After and service health", true],
        [
          "Raw payload minimization",
          "Discard provider fields outside schema",
          true,
        ],
      ],
      status: "9 healthy · 1 delayed",
    },
    identity: {
      title: "Workforce authentication",
      description:
        "Federated identity, administrator assurance, sessions, role mapping, and emergency access.",
      fields: [
        ["Identity provider", "Microsoft Entra ID (OIDC)", "select"],
        ["Application audience", "api://aegis-platform", "text"],
        ["Session lifetime", "8 hours", "select"],
        ["Break-glass accounts", "2", "number"],
      ],
      toggles: [
        [
          "Require MFA for administrators",
          "Reject sessions without MFA claim",
          true,
        ],
        [
          "Require phishing-resistant admin MFA",
          "Validate authentication-strength claim",
          true,
        ],
        [
          "Continuous access evaluation",
          "Process risk and revocation events",
          true,
        ],
      ],
      status: "Policy compliant",
    },
    data: {
      title: "Sovereign data platform",
      description:
        "Local persistence, encryption, retention, indexing, minimization, and legal-hold controls.",
      fields: [
        ["Primary database", "PostgreSQL 17 + TimescaleDB", "text"],
        ["Search projection", "OpenSearch · encrypted volume", "text"],
        ["Default event retention", "13 months", "select"],
        ["Evidence retention", "7 years", "select"],
      ],
      toggles: [
        [
          "PostgreSQL row-level security",
          "Enforce tenant context in database",
          true,
        ],
        [
          "Field-level envelope encryption",
          "Encrypt sensitive normalized attributes",
          true,
        ],
        [
          "Automated retention enforcement",
          "Aggregate then delete expired signals",
          true,
        ],
      ],
      status: "Encrypted · healthy",
    },
    ai: {
      title: "Private AI control plane",
      description:
        "Local model routing, retrieval permissions, injection defenses, masking, and interaction audit.",
      fields: [
        ["Inference endpoint", "http://ollama:11434", "text"],
        ["Primary model", "Phi-4 · local quantized", "select"],
        ["Context window", "16,384 tokens", "select"],
        ["Maximum response", "2048", "number"],
      ],
      toggles: [
        ["Network egress denied", "AI runtime cannot access internet", true],
        [
          "RBAC-filtered retrieval",
          "Apply user policy before context assembly",
          true,
        ],
        [
          "Prompt and output filtering",
          "Detect injection, secrets, and unsafe actions",
          true,
        ],
      ],
      status: "Sovereign · ready",
    },
    notifications: {
      title: "Notification routing",
      description:
        "Protected message delivery, templates, escalation, retry, and delivery evidence.",
      fields: [
        ["Email relay", "smtp.globalholdings.local:587", "text"],
        ["Teams application", "Aegis Notification Bot", "text"],
        ["Default retry policy", "5 attempts · exponential", "select"],
        ["Critical escalation SLA", "5 minutes", "select"],
      ],
      toggles: [
        [
          "Redact sensitive evidence",
          "Send links instead of restricted content",
          true,
        ],
        [
          "Delivery receipt audit",
          "Persist status and provider identifier",
          true,
        ],
        ["Quiet hours", "Defer noncritical messages 20:00–07:00", true],
      ],
      status: "4 channels healthy",
    },
    integrations: {
      title: "Enterprise integrations",
      description:
        "ITSM, SIEM, webhook, and client-application boundaries with scoped credentials.",
      fields: [
        ["ITSM platform", "ServiceNow · Production", "select"],
        ["SIEM destination", "Microsoft Sentinel · local forwarder", "select"],
        ["Webhook allow-list", "6", "number"],
        ["Default timeout", "15 seconds", "select"],
      ],
      toggles: [
        ["Mutual TLS", "Require client certificates", true],
        ["Signed webhook payloads", "HMAC-SHA256 with rotation", true],
        [
          "Idempotent incident creation",
          "Prevent duplicate external records",
          true,
        ],
      ],
      status: "8 integrations healthy",
    },
    backup: {
      title: "Backup and disaster recovery",
      description:
        "Protected full/incremental backup, off-host copies, restore testing, and key recovery.",
      fields: [
        ["Recovery point objective", "15 minutes", "select"],
        ["Recovery time objective", "4 hours", "select"],
        ["Full backup", "Daily · 01:00", "text"],
        ["Restore validation", "Quarterly · isolated environment", "text"],
      ],
      toggles: [
        ["Continuous WAL archive", "Point-in-time database recovery", true],
        [
          "Immutable backup copy",
          "WORM retention in separate trust zone",
          true,
        ],
        [
          "Automated restore verification",
          "Validate audit chains and tenant counts",
          true,
        ],
      ],
      status: "Last backup 8m ago",
    },
    security: {
      title: "Platform security baseline",
      description:
        "Transport, service identity, secrets, browser, API, workload, and audit controls.",
      fields: [
        ["External TLS", "TLS 1.3 only", "select"],
        ["Internal service identity", "mTLS · SPIFFE-compatible", "select"],
        ["Secret provider", "HashiCorp Vault", "select"],
        ["Audit root signing", "HSM-backed ECDSA", "select"],
      ],
      toggles: [
        [
          "Default-deny network policy",
          "Explicit ingress and egress only",
          true,
        ],
        ["Signed-image admission", "Require trusted provenance and SBOM", true],
        [
          "Tamper-evident audit chain",
          "Sign and export daily ledger roots",
          true,
        ],
      ],
      status: "86 controls passing",
    },
};

type ConfigurationSectionState = {
  fields: Record<string, string>;
  toggles: Record<string, boolean>;
};

type ConfigurationWorkspaceState = Record<string, ConfigurationSectionState>;
type ConfigurationValidationErrors = Record<string, Record<string, string>>;
type StoredConfigurationWorkspace = {
  sections: ConfigurationWorkspaceState;
  savedBy: string;
  lastSavedSection: string;
};

function ConfigPanel({
  id,
  state,
  errors,
  validatedAt,
  version,
  savedAt,
  onFieldChange,
  onToggleChange,
  onTest,
}: {
  id: string;
  state: ConfigurationSectionState;
  errors: Record<string, string>;
  validatedAt: string | null;
  version: number;
  savedAt: string | null;
  onFieldChange: (label: string, value: string) => void;
  onToggleChange: (label: string, value: boolean) => void;
  onTest: () => void;
}) {
  const c = CONFIGURATION_DEFINITIONS[id];
  return (
    <div className="config-panel">
      <div className="config-status">
        <div>
          <CheckmarkCircle24Regular />
          <span>
            <strong>
              {Object.keys(errors).length
                ? `${Object.keys(errors).length} validation issue(s)`
                : c.status}
            </strong>
            <small>
              {validatedAt
                ? `Last validated ${formatLocalTimestamp(validatedAt)}`
                : "Not validated in this session"}
            </small>
          </span>
        </div>
        <button onClick={onTest}>
          <Play24Regular /> Test configuration
        </button>
      </div>
      <section>
        <h3>{c.title}</h3>
        <p>{c.description}</p>
        <div className="enterprise-form">
          {c.fields.map(([label, defaultValue, type], index) => {
            const errorId = `config-${id}-${index}-error`;
            return (
              <label key={label}>
                {label}
                {type === "select" ? (
                  <select
                    value={state.fields[label]}
                    aria-invalid={Boolean(errors[label])}
                    aria-describedby={errors[label] ? errorId : undefined}
                    onChange={(event) =>
                      onFieldChange(label, event.target.value)
                    }
                  >
                    <option>{defaultValue}</option>
                    <option>Custom configuration…</option>
                  </select>
                ) : (
                  <input
                    type={type}
                    value={state.fields[label]}
                    aria-invalid={Boolean(errors[label])}
                    aria-describedby={errors[label] ? errorId : undefined}
                    onChange={(event) =>
                      onFieldChange(label, event.target.value)
                    }
                  />
                )}
                {errors[label] ? (
                  <small id={errorId} role="alert" style={{ color: "var(--danger)" }}>
                    {errors[label]}
                  </small>
                ) : (
                  <small>Required non-sensitive configuration metadata</small>
                )}
              </label>
            );
          })}
        </div>
      </section>
      <section>
        <h3>Security and behavior</h3>
        <div className="config-toggles">
          {c.toggles.map(([title, description], index) => {
            const errorId = `config-${id}-toggle-${index}-error`;
            return (
              <label key={String(title)}>
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                  {errors[title] && (
                    <small id={errorId} role="alert" style={{ color: "var(--danger)" }}>
                      {errors[title]}
                    </small>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={state.toggles[title]}
                  aria-invalid={Boolean(errors[title])}
                  aria-describedby={errors[title] ? errorId : undefined}
                  onChange={(event) =>
                    onToggleChange(title, event.target.checked)
                  }
                />
              </label>
            );
          })}
        </div>
      </section>
      <section>
        <h3>Change control</h3>
        <div className="change-control">
          <span>
            <small>Current version</small>
            <strong>{version} · locally versioned configuration</strong>
          </span>
          <span>
            <small>Last changed</small>
            <strong>{formatLocalTimestamp(savedAt)}</strong>
          </span>
          <span>
            <small>Rollback point</small>
            <strong>
              {version > BASE_CONFIGURATION_VERSION
                ? `Version ${version - 1} · metadata retained`
                : "No local rollback version yet"}
            </strong>
          </span>
        </div>
      </section>
    </div>
  );
}

function ValueCenter() {
  const [users, setUsers] = useState(12500);
  const [admins, setAdmins] = useState(18);
  const [rate, setRate] = useState(75);
  const [tools, setTools] = useState(180000);
  const hours = Math.round(admins * 22 * 12 * 0.48);
  const productivity = hours * rate;
  const license = Math.round(users * 3.34 * 12);
  const total = productivity + license + tools;
  return (
    <>
      <Header
        path="EXECUTIVE / VALUE ENGINEERING"
        title="Business value center"
        description="Translate platform capabilities into a defensible client business case, deployment plan, and measurable outcomes."
      >
        <Badge tone="gold">
          <Sparkle24Filled /> CLIENT VALUE MODEL
        </Badge>
        <Btn>
          <ArrowDownload24Regular /> Export proposal
        </Btn>
      </Header>
      <div className="value-layout">
        <section className="roi-inputs">
          <header>
            <MoneyHand24Regular />
            <div>
              <h2>Client ROI assumptions</h2>
              <p>Adjust inputs during the discovery workshop.</p>
            </div>
          </header>
          <label>
            Microsoft 365 users
            <input
              type="number"
              value={users}
              onChange={(e) => setUsers(Number(e.target.value))}
            />
          </label>
          <label>
            Administrators and analysts
            <input
              type="number"
              value={admins}
              onChange={(e) => setAdmins(Number(e.target.value))}
            />
          </label>
          <label>
            Blended hourly cost (USD)
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </label>
          <label>
            Current annual tool overlap (USD)
            <input
              type="number"
              value={tools}
              onChange={(e) => setTools(Number(e.target.value))}
            />
          </label>
          <small>
            Illustrative model. Validate contract pricing, labor allocation, and
            adoption assumptions with the client.
          </small>
        </section>
        <section className="roi-results">
          <div>
            <small>ESTIMATED ANNUAL VALUE</small>
            <strong>${total.toLocaleString()}</strong>
            <span>Potential hard and capacity value</span>
          </div>
          <div className="value-breakdown">
            <span>
              <i style={{ width: `${(productivity / total) * 100}%` }} />
              <b>Administrative capacity</b>
              <strong>${productivity.toLocaleString()}</strong>
            </span>
            <span>
              <i style={{ width: `${(license / total) * 100}%` }} />
              <b>License optimization</b>
              <strong>${license.toLocaleString()}</strong>
            </span>
            <span>
              <i style={{ width: `${(tools / total) * 100}%` }} />
              <b>Tool consolidation</b>
              <strong>${tools.toLocaleString()}</strong>
            </span>
          </div>
          <footer>
            <span>
              <strong>{hours.toLocaleString()}h</strong> capacity returned
            </span>
            <span>
              <strong>{Math.round(total / (users * 12))}</strong>{" "}
              value/user/month
            </span>
            <span>
              <strong>11 months</strong> illustrative payback
            </span>
          </footer>
        </section>
      </div>
      <div className="differentiator-grid">
        {[
          [
            "Sovereign by design",
            "Data, analytics, search, AI, and evidence remain inside the customer environment.",
            ShieldCheckmark24Regular,
          ],
          [
            "Intelligence, not reports",
            "Deterministic findings connect risk, impact, evidence, recommendation, owner, and safe action.",
            Sparkle24Filled,
          ],
          [
            "Temporal digital twin",
            "Reconstruct historical tenant state and relationships instead of retaining flat report exports.",
            Database24Regular,
          ],
          [
            "Governed action",
            "Preflight, approval, idempotency, rollback, verification, and immutable evidence for every change.",
            CheckmarkCircle24Regular,
          ],
          [
            "Private AI analyst",
            "Role-aware grounded analysis and drafts without sending enterprise data to external inference.",
            Bot24Regular,
          ],
          [
            "One operational plane",
            "Security, compliance, FinOps, reporting, audit, governance, hybrid, and automation in one product.",
            Apps24Regular,
          ],
        ].map(([title, desc, Icon]) => (
          <article key={String(title)}>
            <span>
              <Icon />
            </span>
            <h3>{title as string}</h3>
            <p>{desc as string}</p>
            <button>Show proof in product →</button>
          </article>
        ))}
      </div>
      <section className="buyer-proof">
        <header>
          <div>
            <h2>Enterprise buyer proof checklist</h2>
            <p>
              Evidence required to move from impressive demo to approved
              platform.
            </p>
          </div>
          <Badge>12 OF 16 DEMO EVIDENCE ITEMS READY</Badge>
        </header>
        <div>
          {[
            [
              "Architecture & sovereignty",
              "Deployment topology, data flows, local processing, no-egress AI",
              "Ready",
            ],
            [
              "Security assurance",
              "Threat model, RBAC, encryption, audit, CI scanning",
              "Ready",
            ],
            [
              "Operational breadth",
              "19 connected product workspaces and report/action catalogs",
              "Ready",
            ],
            [
              "Custom analytics",
              "Report builder, dashboard designer, scheduling and access policy",
              "Ready",
            ],
            [
              "Live Microsoft integration",
              "Customer tenant consent and production collector validation",
              "Customer setup",
            ],
            [
              "Independent assurance",
              "Penetration test, accessibility audit, recovery exercise",
              "Release gate",
            ],
          ].map((x) => (
            <article key={x[0]}>
              <CheckmarkCircle24Regular />
              <span>
                <strong>{x[0]}</strong>
                <small>{x[1]}</small>
              </span>
              <Badge tone={x[2] === "Ready" ? "teal" : "gold"}>{x[2]}</Badge>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function ProductStudio({ page, notify }: Props) {
  if (page === "Custom reports") return <ReportBuilder notify={notify} />;
  if (page === "Dashboard designer")
    return <DashboardDesigner notify={notify} />;
  if (page === "Configuration") return <Configuration notify={notify} />;
  return <ValueCenter />;
}

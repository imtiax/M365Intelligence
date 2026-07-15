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
  const buildGeneratedReport = () => {
    const workloadMap: Record<string, string> = {
      Identity: "Microsoft Entra ID",
      "Exchange Online": "Exchange Online",
      "Microsoft Teams": "Microsoft Teams",
      "SharePoint Online": "SharePoint Online",
      "Microsoft Intune": "Microsoft Intune",
      "Licensing & Cost": "Licensing & Cost",
      "Unified Audit": "Microsoft Purview",
    };
    const rows = Array.from({ length: 25 }, (_, index) => {
      const seed = previewRows[index % previewRows.length] as Record<
        string,
        unknown
      >;
      return selectedFields.map((field) =>
        String(
          seed[field.id] ??
            [
              "Enabled",
              "Member",
              "Technology",
              "Standard",
              `Record ${index + 1}`,
            ][index % 5],
        ),
      );
    });
    return generateCustomReport(
      name,
      workloadMap[source.domain] ?? source.domain,
      selectedFields.map((field) => field.label),
      rows,
    );
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
                  <button onClick={() => remove(f.id)}>×</button>
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
          onRun={() => setGenerated(buildGeneratedReport())}
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
}: {
  name: string;
  source: (typeof semanticSources)[number];
  fields: SemanticField[];
  filters: number;
  visual: string;
  notify: (m: string) => void;
  onRun: () => void;
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
          <Play24Regular /> Run full report
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

function ScheduleDesigner({ notify }: { notify: (m: string) => void }) {
  const [delivery, setDelivery] = useState("Email and Microsoft Teams");
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
            <input defaultValue="Weekly privileged identity review" />
          </label>
          <label>
            Frequency
            <select>
              <option>Weekly</option>
              <option>Daily</option>
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
          </label>
          <label>
            Run day
            <select>
              <option>Monday</option>
              <option>Friday</option>
              <option>First business day</option>
            </select>
          </label>
          <label>
            Run time
            <input type="time" defaultValue="08:00" />
          </label>
          <label>
            Time zone
            <select>
              <option>Asia/Dubai (UTC+04:00)</option>
              <option>UTC</option>
              <option>Europe/London</option>
            </select>
          </label>
          <label>
            Data snapshot
            <select>
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
              className={delivery === x ? "selected" : ""}
              key={x}
              onClick={() => setDelivery(x)}
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
            <input defaultValue="Identity Operations; CISO Office" />
          </label>
          <label>
            Export format
            <select>
              <option>Encrypted Excel (.xlsx)</option>
              <option>PDF</option>
              <option>CSV</option>
              <option>JSON</option>
            </select>
          </label>
          <label>
            Retention
            <select>
              <option>90 days</option>
              <option>1 year</option>
              <option>7 years — compliance evidence</option>
            </select>
          </label>
          <label>
            Password protection
            <select>
              <option>Organization-managed encryption</option>
              <option>One-time passphrase</option>
            </select>
          </label>
        </div>
      </section>
      <div className="schedule-actions">
        <Btn
          onClick={() =>
            notify(
              "Schedule validation passed. Recipients and export policy are authorized.",
            )
          }
        >
          Validate delivery
        </Btn>
        <Btn
          primary
          onClick={() => notify(`Report schedule activated using ${delivery}.`)}
        >
          <CalendarClock24Regular /> Activate schedule
        </Btn>
      </div>
    </div>
  );
}

function ReportSecurity({ notify }: { notify: (m: string) => void }) {
  return (
    <div className="report-security">
      <section>
        <header>
          <ShieldCheckmark24Regular />
          <div>
            <h2>Report access policy</h2>
            <p>
              Report visibility never expands the viewer’s underlying data
              authorization.
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
          {[
            [
              "Security Administrators",
              "Edit",
              "All authorized tenant data",
              "Allowed",
            ],
            [
              "SOC Tier 1 Analysts",
              "View",
              "Security and identity only",
              "Denied",
            ],
            ["CISO Office", "View", "Executive aggregate", "PDF only"],
            ["External Auditors", "View", "Evidence snapshot", "Watermarked"],
          ].map((x) => (
            <div key={x[0]}>
              {x.map((v) => (
                <span key={v}>{v}</span>
              ))}
              <button
                onClick={() => notify(`${x[0]} access rule editor opened.`)}
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
            <select>
              <option>Confidential · Security</option>
              <option>Internal</option>
              <option>Restricted</option>
            </select>
          </label>
          <label>
            <span>
              Mask personal fields<strong>Apply based on viewer role</strong>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
          <label>
            <span>
              Require export justification
              <strong>Captured in immutable audit</strong>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
          <label>
            <span>
              Block external recipients
              <strong>Domain and guest validation</strong>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
          <label>
            <span>
              Apply visible watermark
              <strong>User, tenant, timestamp, classification</strong>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
        </div>
      </section>
      <div className="schedule-actions">
        <Btn
          onClick={() =>
            notify("Access simulation passed for all four configured personas.")
          }
        >
          Simulate personas
        </Btn>
        <Btn
          primary
          onClick={() =>
            notify("Report access and data-protection policy saved.")
          }
        >
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
              <input defaultValue="CISO Security and Compliance Command Center" />
            </div>
            <select>
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

function Configuration({ notify }: { notify: (m: string) => void }) {
  const [active, setActive] = useState("tenant");
  const section = configurationSections.find((x) => x.id === active)!;
  return (
    <>
      <Header
        path="PLATFORM / ENTERPRISE CONFIGURATION"
        title="Platform configuration"
        description="Production-grade configuration for identity, collection, data, AI, integrations, resilience, and security."
      >
        <Badge tone="gold">1 ADVISORY</Badge>
        <Btn
          onClick={() =>
            notify(
              "Configuration validation completed: 86 passed, 1 advisory, 0 failures.",
            )
          }
        >
          <CheckmarkCircle24Regular /> Validate all
        </Btn>
        <Btn
          primary
          onClick={() =>
            notify(
              `${section.name} configuration saved as a new audited version.`,
            )
          }
        >
          <Save24Regular /> Save changes
        </Btn>
      </Header>
      <div className="configuration-layout">
        <aside>
          <div className="config-health">
            <span>Configuration posture</span>
            <strong>98%</strong>
            <small>86 passed · 1 advisory</small>
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
            <Badge>CONFIGURATION VERSION 42</Badge>
          </header>
          <ConfigPanel id={section.id} notify={notify} />
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
function ConfigPanel({
  id,
  notify,
}: {
  id: string;
  notify: (m: string) => void;
}) {
  const configs: Record<
    string,
    {
      title: string;
      description: string;
      fields: [string, string, string][];
      toggles: [string, string, boolean][];
      status: string;
    }
  > = {
    tenant: {
      title: "Organization boundary",
      description:
        "Defines the sovereign tenant context used for collection, storage, policy, and authorization.",
      fields: [
        ["Organization name", "Apex Financial Group", "text"],
        ["Primary Microsoft tenant", "apexfg.onmicrosoft.com", "text"],
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
        ["Break-glass accounts", "2 configured", "number"],
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
        ["Maximum response", "2,048 tokens", "number"],
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
        ["Email relay", "smtp.apexfg.local:587", "text"],
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
        ["Webhook allow-list", "6 approved destinations", "number"],
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
  const c = configs[id];
  return (
    <div className="config-panel">
      <div className="config-status">
        <div>
          <CheckmarkCircle24Regular />
          <span>
            <strong>{c.status}</strong>
            <small>Last validated 4 minutes ago</small>
          </span>
        </div>
        <button
          onClick={() => notify(`${c.title} validation passed in demo mode.`)}
        >
          <Play24Regular /> Test configuration
        </button>
      </div>
      <section>
        <h3>{c.title}</h3>
        <p>{c.description}</p>
        <div className="enterprise-form">
          {c.fields.map(([label, value, type]) => (
            <label key={label}>
              {label}
              {type === "select" ? (
                <select defaultValue={value}>
                  <option>{value}</option>
                  <option>Custom configuration…</option>
                </select>
              ) : (
                <input type={type} defaultValue={value} />
              )}
              <small>Configured through encrypted platform settings</small>
            </label>
          ))}
        </div>
      </section>
      <section>
        <h3>Security and behavior</h3>
        <div className="config-toggles">
          {c.toggles.map(([title, description, checked]) => (
            <label key={String(title)}>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <input type="checkbox" defaultChecked={Boolean(checked)} />
            </label>
          ))}
        </div>
      </section>
      <section>
        <h3>Change control</h3>
        <div className="change-control">
          <span>
            <small>Current version</small>
            <strong>42 · approved by Platform CAB</strong>
          </span>
          <span>
            <small>Last changed</small>
            <strong>Sarah Ibrahim · 14 Jul 16:42</strong>
          </span>
          <span>
            <small>Rollback point</small>
            <strong>Version 41 · available</strong>
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

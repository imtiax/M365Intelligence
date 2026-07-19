"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Alert24Regular,
  ArrowDownload24Regular,
  ArrowRight20Regular,
  ArrowTrending24Regular,
  Bot24Regular,
  CheckmarkCircle20Regular,
  ChevronRight20Regular,
  Clock20Regular,
  DataBarVertical24Regular,
  DocumentData24Regular,
  Filter24Regular,
  Grid24Regular,
  PeopleTeam24Regular,
  Person24Regular,
  Search24Regular,
  Settings24Regular,
  ShieldCheckmark24Regular,
  ShieldError24Regular,
  Sparkle24Regular,
  Table24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";

type Workspace = "Mission Control" | "Service Atlas" | "Evidence Studio" | "Object 360" | "Policy Workbench" | "Action Center" | "Delegation Studio";
type Plane = "Inventory" | "Activity" | "Trends";
type EvidenceRow = { name: string; department: string; signal: string; risk: number; status: "Critical" | "Review" | "Healthy"; activity: string };

const services = ["Entra", "Exchange", "Teams", "SharePoint", "OneDrive", "Defender", "Purview", "Intune", "Licensing"];
const rows: EvidenceRow[] = [
  { name: "Jordan Alvarez", department: "Finance", signal: "E5 assigned · no verified activity for 91 days", risk: 82, status: "Critical", activity: "17 Apr 2026" },
  { name: "Amina Hassan", department: "Legal", signal: "External sharing path requires ownership review", risk: 71, status: "Review", activity: "Yesterday" },
  { name: "Service · AP Ingestion", department: "Operations", signal: "Non-interactive sign-in outside declared baseline", risk: 68, status: "Review", activity: "19 min ago" },
  { name: "Sofia Marin", department: "Security", signal: "Privileged role · phishing-resistant MFA", risk: 14, status: "Healthy", activity: "42 min ago" },
  { name: "Collaboration Hub", department: "Sales", signal: "Sensitivity label and owners verified", risk: 9, status: "Healthy", activity: "Today" },
];
const trend = [39, 43, 41, 52, 48, 56, 54, 68, 61, 64, 58, 46];

const nav: Array<{ label: Workspace; icon: typeof Grid24Regular; note: string }> = [
  { label: "Mission Control", icon: Grid24Regular, note: "Your operating brief" },
  { label: "Service Atlas", icon: DataBarVertical24Regular, note: "Inventory, activity, trends" },
  { label: "Evidence Studio", icon: DocumentData24Regular, note: "Reports and evidence" },
  { label: "Object 360", icon: Person24Regular, note: "Context and relationships" },
  { label: "Policy Workbench", icon: ShieldCheckmark24Regular, note: "Controls and exceptions" },
  { label: "Action Center", icon: Settings24Regular, note: "Guarded remediations" },
  { label: "Delegation Studio", icon: PeopleTeam24Regular, note: "Scopes and access reviews" },
];

function downloadEvidence() {
  const receipt = {
    schema: "aegis.evidence-receipt.v1",
    generatedAt: new Date().toISOString(),
    source: "Aegis Next synthetic buyer tenant",
    report: "Dormant privileged licensing review",
    filters: ["risk >= 70", "activity age > 90 days"],
    records: rows.filter((row) => row.risk >= 70),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "aegis-evidence-receipt.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AegisNextWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>("Mission Control");
  const [service, setService] = useState("Entra");
  const [plane, setPlane] = useState<Plane>("Inventory");
  const [query, setQuery] = useState("");
  const [riskOnly, setRiskOnly] = useState(false);
  const [selected, setSelected] = useState<EvidenceRow | null>(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("Local-first demo · synthetic tenant · no data leaves this workspace");
  const [actionOpen, setActionOpen] = useState(false);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesQuery = `${row.name} ${row.department} ${row.signal}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (!riskOnly || row.risk >= 70);
  }), [query, riskOnly]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  };
  const openEvidence = (row: EvidenceRow) => {
    setSelected(row);
    showToast(`Evidence opened for ${row.name}.`);
  };

  return (
    <main className="next-shell">
      <aside className="next-sidebar">
        <a className="next-brand" href="/next" aria-label="Aegis Next home">
          <span><ShieldCheckmark24Regular /></span>
          <b>Aegis <em>Next</em></b>
        </a>
        <p className="next-tenant"><i /> Northstar Group <small>EU + Middle East</small></p>
        <nav aria-label="Aegis Next navigation">
          {nav.map(({ label, icon: Icon, note }) => (
            <button key={label} className={workspace === label ? "active" : ""} onClick={() => { setWorkspace(label); setSelected(null); }}>
              <Icon /><span>{label}<small>{note}</small></span>{workspace === label && <ChevronRight20Regular />}
            </button>
          ))}
        </nav>
        <section className="next-posture">
          <span><CheckmarkCircle20Regular /></span>
          <div><b>Evidence boundary healthy</b><small>Last connector scan: 8 min ago</small></div>
        </section>
      </aside>

      <section className="next-main">
        <header className="next-topbar">
          <label className="next-search"><Search24Regular /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search evidence, objects, controls, actions…" /><kbd>⌘ K</kbd></label>
          <button className="next-icon" aria-label="Notifications" onClick={() => showToast("Three evidence events need owner review.")}><Alert24Regular /><i /></button>
          <button className="next-profile" onClick={() => showToast("Signed in as Olivia Chen · Security Operations Lead")}>OC</button>
        </header>

        {workspace === "Mission Control" && <MissionControl onNavigate={setWorkspace} onOpen={openEvidence} onAction={() => setActionOpen(true)} />}
        {workspace === "Service Atlas" && <ServiceAtlas service={service} setService={setService} plane={plane} setPlane={setPlane} rows={filteredRows} onOpen={openEvidence} />}
        {workspace === "Evidence Studio" && <EvidenceStudio rows={filteredRows} riskOnly={riskOnly} setRiskOnly={setRiskOnly} saved={saved} onSave={() => { setSaved(true); showToast("View saved as ‘Privileged dormant access review’. "); }} onOpen={openEvidence} onExport={() => { downloadEvidence(); showToast("Signed raw evidence receipt downloaded locally."); }} />}
        {workspace === "Object 360" && <Object360 selected={selected ?? rows[0]} onAction={() => setActionOpen(true)} />}
        {workspace === "Policy Workbench" && <PolicyWorkbench onOpen={openEvidence} />}
        {workspace === "Action Center" && <ActionCenter submitted={actionSubmitted} onStart={() => setActionOpen(true)} />}
        {workspace === "Delegation Studio" && <DelegationStudio onPreview={() => showToast("Delegate preview enabled: Finance operations scope · read only.")} />}
      </section>

      {selected && workspace !== "Object 360" && <aside className="next-evidence-drawer" aria-label="Evidence detail"><button onClick={() => setSelected(null)}>Close</button><EvidenceDetail row={selected} onAction={() => setActionOpen(true)} /></aside>}
      {actionOpen && <ActionDialog onClose={() => setActionOpen(false)} onSubmit={() => { setActionSubmitted(true); setActionOpen(false); showToast("Remediation draft submitted for independent approval."); }} />}
      {toast && <div className="next-toast"><CheckmarkCircle20Regular /> {toast}</div>}
    </main>
  );
}

function PageTitle({ eyebrow, title, copy, actions }: { eyebrow: string; title: string; copy: string; actions?: ReactNode }) {
  return <header className="next-page-title"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div><div className="next-page-actions">{actions}</div></header>;
}

function MissionControl({ onNavigate, onOpen, onAction }: { onNavigate: (value: Workspace) => void; onOpen: (row: EvidenceRow) => void; onAction: () => void }) {
  return <div className="next-content">
    <PageTitle eyebrow="TUESDAY BRIEFING · 19 JUL 2026" title="Make the next right decision." copy="A verified operating brief across identity, collaboration, cost, and controls." actions={<><button className="next-button" onClick={() => onNavigate("Evidence Studio")}><DocumentData24Regular /> Open evidence</button><button className="next-button primary" onClick={onAction}>Review 3 decisions <ArrowRight20Regular /></button></>} />
    <section className="next-score-grid">
      <article className="next-hero-score"><div><span>Operating confidence</span><strong>78<small>/100</small></strong><p><i /> Up 6 points since the last review</p></div><div className="next-ring"><b>78%</b><small>verified</small></div><footer><span>Evidence fresh <b>94%</b></span><span>Controls in review <b>6</b></span></footer></article>
      <Metric icon={ShieldError24Regular} label="Priority decisions" value="3" note="Two need an owner today" tone="coral" />
      <Metric icon={ArrowTrending24Regular} label="Cost recovery" value="$4,957" note="Monthly opportunity identified" tone="gold" />
      <Metric icon={Clock20Regular} label="Evidence freshness" value="8 min" note="Across enabled connector packs" tone="blue" />
    </section>
    <section className="next-split-grid">
      <article className="next-card next-decision-card"><header><div><span className="next-label">DECISION QUEUE</span><h2>Evidence before action</h2></div><button onClick={() => onNavigate("Action Center")}>View queue <ArrowRight20Regular /></button></header>
        <button className="next-decision" onClick={() => onOpen(rows[0])}><span className="severity critical">Critical</span><div><b>Dormant E5 assignments require review</b><small>87 people · $4,957/month recoverable · verified 8 min ago</small></div><ChevronRight20Regular /></button>
        <button className="next-decision" onClick={() => onOpen(rows[1])}><span className="severity review">Review</span><div><b>External sharing ownership is incomplete</b><small>14 sites · mapped to DATA-ACC-07 · evidence attached</small></div><ChevronRight20Regular /></button>
        <button className="next-decision" onClick={() => onOpen(rows[2])}><span className="severity review">Review</span><div><b>Service account sign-in deviates from baseline</b><small>1 identity · no blocking recommendation without owner confirmation</small></div><ChevronRight20Regular /></button>
      </article>
      <article className="next-card next-trend-card"><header><div><span className="next-label">RISK SIGNAL</span><h2>30-day verified exposure</h2></div><button onClick={() => onNavigate("Service Atlas")}>Explore trend <ArrowRight20Regular /></button></header><div className="next-chart">{trend.map((value, index) => <i key={index} style={{ height: `${value}%` }}><small>{value}</small></i>)}</div><footer><span>19 Jun</span><b>46 open signals <em>↓ 22%</em></b><span>Today</span></footer></article>
    </section>
    <section className="next-card next-control-card"><header><div><span className="next-label">CONTROL COVERAGE</span><h2>What the board can rely on today</h2></div><button onClick={() => onNavigate("Policy Workbench")}>Open workbench <ArrowRight20Regular /></button></header><div className="next-control-list"><Control name="Privileged authentication" evidence="23 controls verified" value={91} /><Control name="Data sharing and ownership" evidence="8 controls need evidence" value={74} /><Control name="License optimization" evidence="87 assignments ready for review" value={68} /><Control name="Audit retention" evidence="365 days locally retained" value={100} /></div></section>
  </div>;
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof ShieldError24Regular; label: string; value: string; note: string; tone: string }) { return <article className={`next-metric ${tone}`}><Icon /><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function Control({ name, evidence, value }: { name: string; evidence: string; value: number }) { return <article><div><b>{name}</b><small>{evidence}</small></div><span><i style={{ width: `${value}%` }} /></span><strong>{value}%</strong></article>; }

function ServiceAtlas({ service, setService, plane, setPlane, rows, onOpen }: { service: string; setService: (value: string) => void; plane: Plane; setPlane: (value: Plane) => void; rows: EvidenceRow[]; onOpen: (row: EvidenceRow) => void }) { return <div className="next-content">
  <PageTitle eyebrow="SERVICE ATLAS" title="Explore the tenant by service." copy="Current state, activity evidence, and trends share one consistent investigation model." />
  <div className="next-service-nav">{services.map((item) => <button key={item} className={service === item ? "active" : ""} onClick={() => setService(item)}>{item}</button>)}</div>
  <section className="next-atlas-intro"><div><span className="next-label">{service.toUpperCase()} · {plane.toUpperCase()}</span><h2>{plane === "Inventory" ? "Know what exists and who owns it." : plane === "Activity" ? "Trace exactly what changed." : "See the change before it becomes risk."}</h2><p>All records carry collection freshness, source coverage, and a drillable evidence receipt.</p></div><div className="next-plane-switch">{(["Inventory", "Activity", "Trends"] as Plane[]).map((item) => <button key={item} className={plane === item ? "active" : ""} onClick={() => setPlane(item)}>{item}</button>)}</div></section>
  <section className="next-atlas-grid"><article className="next-card next-atlas-table"><header><div><span className="next-label">VERIFIED RECORDS</span><h2>{service} review set</h2></div><button><Filter24Regular /> Filters</button></header><EvidenceTable rows={rows} onOpen={onOpen} /></article><article className="next-card next-catalogue"><span className="next-label">CURATED PATHS</span><h2>Start with a customer question</h2>{["Who has access they no longer need?", "What changed outside the approved baseline?", "Where can spend be recovered safely?", "Which controls lack current evidence?"].map((item) => <button key={item} onClick={() => onOpen(rows[0])}>{item}<ChevronRight20Regular /></button>)}<footer><Sparkle24Regular /> Search understands services, objects, controls, and actions.</footer></article></section>
</div>; }

function EvidenceStudio({ rows, riskOnly, setRiskOnly, saved, onSave, onOpen, onExport }: { rows: EvidenceRow[]; riskOnly: boolean; setRiskOnly: (value: boolean) => void; saved: boolean; onSave: () => void; onOpen: (row: EvidenceRow) => void; onExport: () => void }) { return <div className="next-content">
  <PageTitle eyebrow="EVIDENCE STUDIO" title="Build a decision-grade view." copy="Definitions, not screenshots: every column, filter, scope, and export is reproducible." actions={<><button className="next-button" onClick={onSave}>{saved ? <CheckmarkCircle20Regular /> : <Table24Regular />}{saved ? "View saved" : "Save as view"}</button><button className="next-button primary" onClick={onExport}><ArrowDownload24Regular /> Export evidence</button></>} />
  <section className="next-report-contract"><div><span className="next-label">ACTIVE DEFINITION</span><b>Dormant privileged access review</b><small>Entra identity + license assignment + verified activity · refreshed 8 min ago</small></div><div><button className={riskOnly ? "selected" : ""} onClick={() => setRiskOnly(!riskOnly)}>{riskOnly ? "✓ " : ""}Risk 70+</button><button onClick={() => setRiskOnly(false)}>All evidence</button><button onClick={onSave}>Add filter</button></div></section>
  <section className="next-card next-report-table"><header><div><span className="next-label">{rows.length} MATCHING RECORDS</span><h2>Evidence rows</h2></div><p><i /> Source fresh · Full coverage for enabled data packs</p></header><EvidenceTable rows={rows} onOpen={onOpen} /><footer><span>Columns: identity, department, signal, risk, last activity</span><span>Export receipt includes source, query, timestamp, and records.</span></footer></section>
  <section className="next-report-bottom"><article className="next-card"><span className="next-label">VISUAL CONTEXT</span><h2>Exposure is declining</h2><div className="next-mini-bars">{trend.slice(-7).map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}</div><p>Risk signals fell 22% after the June access review. Click a bar to open contributing records.</p></article><article className="next-card"><span className="next-label">SCHEDULE CONTRACT</span><h2>Monday executive brief</h2><p>Runs 08:00 Gulf Standard Time. Uses the previous 7 complete days, suppresses empty results, and places a compact evidence preview in the approval email.</p><button className="next-link">Configure delivery <ArrowRight20Regular /></button></article></section>
</div>; }

function EvidenceTable({ rows, onOpen }: { rows: EvidenceRow[]; onOpen: (row: EvidenceRow) => void }) { return <div className="next-table-wrap"><table><thead><tr><th>Object</th><th>Signal</th><th>Risk</th><th>Last activity</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row.name} onClick={() => onOpen(row)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onOpen(row); }}><td><b>{row.name}</b><small>{row.department}</small></td><td>{row.signal}</td><td><span className={`severity ${row.status.toLowerCase()}`}>{row.risk}</span></td><td>{row.activity}</td><td><ChevronRight20Regular /></td></tr>)}</tbody></table></div>; }

function EvidenceDetail({ row, onAction }: { row: EvidenceRow; onAction: () => void }) { return <div className="next-detail"><span className={`severity ${row.status.toLowerCase()}`}>{row.status}</span><h2>{row.name}</h2><p>{row.signal}</p><dl><div><dt>Risk score</dt><dd>{row.risk}/100</dd></div><div><dt>Last activity</dt><dd>{row.activity}</dd></div><div><dt>Evidence source</dt><dd>Connected synthetic snapshot</dd></div><div><dt>Control mapping</dt><dd>FIN-OPT-03</dd></div></dl><section><b>Why this matters</b><p>The policy detected a mismatch between license cost, verified activity, and the assigned account context. Aegis does not recommend a change until exceptions are checked.</p></section><button className="next-button primary" onClick={onAction}>Start guarded review <ArrowRight20Regular /></button></div>; }

function Object360({ selected, onAction }: { selected: EvidenceRow; onAction: () => void }) { return <div className="next-content"><PageTitle eyebrow="OBJECT 360" title={selected.name} copy="A single evidence graph for identity, access, activity, ownership, cost, and permitted action." actions={<button className="next-button primary" onClick={onAction}>Start guarded review <ArrowRight20Regular /></button>} /><section className="next-object-grid"><article className="next-object-profile"><div className="next-avatar">{selected.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><span className={`severity ${selected.status.toLowerCase()}`}>{selected.status}</span><h2>{selected.name}</h2><p>{selected.department} · Northstar Group</p><dl><div><dt>Risk</dt><dd>{selected.risk}/100</dd></div><div><dt>Last verified activity</dt><dd>{selected.activity}</dd></div><div><dt>Manager</dt><dd>Riley Thompson</dd></div></dl></article><article className="next-card next-relationship-map"><header><div><span className="next-label">RELATIONSHIP MAP</span><h2>Relevant access paths</h2></div></header><div className="next-map"><b>Identity</b><i /><span>E5 license</span><i /><span>Finance workspace</span><i /><span>External sharing group</span></div><footer>2 active paths · 1 ownership confirmation required</footer></article><article className="next-card next-timeline"><span className="next-label">EVIDENCE TIMELINE</span><h2>What changed</h2><ol><li><i /><div><b>License assigned</b><small>16 Apr 2026 · identity governance</small></div></li><li><i /> <div><b>Last qualifying activity</b><small>17 Apr 2026 · Exchange usage signal</small></div></li><li className="warning"><i /> <div><b>Review threshold reached</b><small>Today · policy FIN-OPT-03</small></div></li></ol></article></section></div>; }

function PolicyWorkbench({ onOpen }: { onOpen: (row: EvidenceRow) => void }) { return <div className="next-content"><PageTitle eyebrow="POLICY WORKBENCH" title="Controls that can be proven." copy="Map operational evidence to accountable owners, exceptions, and verified outcomes." /><section className="next-policy-grid">{[{ id: "FIN-OPT-03", name: "Recover dormant premium licenses", state: "Needs decision", evidence: "87 assignments · 8 min fresh", score: "68%" }, { id: "DATA-ACC-07", name: "Validate external sharing ownership", state: "Owner review", evidence: "14 sites · 100% scoped", score: "74%" }, { id: "IAM-PRIV-02", name: "Enforce strong privileged authentication", state: "Verified", evidence: "23 requirements · 4 min fresh", score: "91%" }].map((control, index) => <article className="next-card" key={control.id}><header><span className="next-label">{control.id}</span><span className={`severity ${index === 2 ? "healthy" : "review"}`}>{control.state}</span></header><h2>{control.name}</h2><p>{control.evidence}</p><div className="next-control-score"><b>{control.score}</b><span><i style={{ width: control.score }} /></span></div><button className="next-link" onClick={() => onOpen(rows[index])}>Open evidence <ArrowRight20Regular /></button></article>)}</section></div>; }

function ActionCenter({ submitted, onStart }: { submitted: boolean; onStart: () => void }) { return <div className="next-content"><PageTitle eyebrow="ACTION CENTER" title="Changes deserve guardrails." copy="No direct write: understand impact, define scope, collect approval, and retain the outcome." actions={<button className="next-button primary" onClick={onStart}>Start remediation <ArrowRight20Regular /></button>} /><section className="next-action-flow"><article><span>1</span><b>Evidence</b><small>Attached and fresh</small></article><i /><article><span>2</span><b>Scope</b><small>87 assignments proposed</small></article><i /><article><span>3</span><b>Approval</b><small>{submitted ? "Awaiting FinOps approver" : "Required before execution"}</small></article><i /><article><span>4</span><b>Outcome</b><small>Audit receipt and rollback plan</small></article></section><section className="next-card next-action-review"><header><div><span className="next-label">{submitted ? "PENDING APPROVAL" : "RECOMMENDED REMEDIATION"}</span><h2>Reclaim dormant E5 assignments</h2></div><span className="severity review">Approval required</span></header><div className="next-action-columns"><div><b>Proposed scope</b><p>87 identities with no Exchange, Teams, Office, or Defender activity for 90 days.</p><b>Automatic exclusions</b><p>Legal hold, service-account, and HR leave indicators are excluded until an owner confirms the exception.</p></div><div><b>Expected outcome</b><p>$4,957 estimated monthly recovery. The action uses staged execution and produces per-identity results.</p><b>Guardrails</b><p>Separate approver, fresh MFA claim, least-privilege action connector, reversible plan where possible.</p></div></div><footer><button className="next-button" onClick={() => window.alert("Dry run complete: 87 eligible, 9 exceptions, no tenant change.")}>Run dry check</button><button className="next-button primary" onClick={onStart}>{submitted ? "Open approval" : "Prepare approval"} <ArrowRight20Regular /></button></footer></section></div>; }

function DelegationStudio({ onPreview }: { onPreview: () => void }) { return <div className="next-content"><PageTitle eyebrow="DELEGATION STUDIO" title="Delegate capability, not broad access." copy="Data scope, feature permission, and review history are separate controls." actions={<button className="next-button primary" onClick={onPreview}>Preview as delegate <Person24Regular /></button>} /><section className="next-delegation-grid"><article className="next-card"><span className="next-label">ACTIVE ROLE</span><h2>Finance operations reviewer</h2><p>Can investigate license evidence and prepare draft reclamation workflows for Finance. Cannot approve, execute, or access other departments.</p><dl><div><dt>Data scope</dt><dd>Finance · 243 identities</dd></div><div><dt>Capabilities</dt><dd>Evidence, saved views, draft actions</dd></div><div><dt>Expires</dt><dd>30 Sep 2026</dd></div></dl><button className="next-link" onClick={onPreview}>Preview effective access <ArrowRight20Regular /></button></article><article className="next-card"><span className="next-label">ACCESS REVIEW</span><h2>Quarterly review due in 12 days</h2><p>Four scoped roles need owner attestation. Aegis compares effective scope with the person’s current HR and Entra context.</p><button className="next-button">Open access review <ArrowRight20Regular /></button></article></section></div>; }

function ActionDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) { const [confirmed, setConfirmed] = useState(false); return <div className="next-modal-backdrop" role="presentation"><section className="next-modal" role="dialog" aria-modal="true" aria-label="Prepare remediation approval"><button className="next-modal-close" onClick={onClose}>Close</button><span className="next-label">PREPARE APPROVAL</span><h2>Reclaim dormant E5 assignments</h2><p>This creates a reviewable draft only. No Microsoft 365 tenant change occurs until an independent approver validates the scoped items.</p><label>Business justification<textarea defaultValue="Review dormant premium assignments after confirming leave, legal hold, and service-account exceptions." /></label><label className="next-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> I confirm the scope will be independently reviewed before execution.</label><footer><button className="next-button" onClick={onClose}>Cancel</button><button className="next-button primary" disabled={!confirmed} onClick={onSubmit}>Submit for approval <ArrowRight20Regular /></button></footer></section></div>; }

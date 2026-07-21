"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type SetStateAction } from "react";
import { Alert24Regular, ArrowRight24Regular, CheckmarkCircle24Regular, ClipboardTask24Regular, CloudCheckmark24Regular, DismissCircle24Regular, Flash24Regular, History24Regular, LockClosed24Regular, Person24Regular, Play24Regular, ShieldCheckmark24Regular, Warning24Regular } from "@fluentui/react-icons";
import { socAlerts, socAuditSeed, socIntegrations, socInvestigationSteps, socPlaybooks, type SocAlert, type SocAuditItem, type SocSeverity, type SocStatus } from "@/data/soc";

type Tab = "overview" | "investigation" | "response" | "automation";
type ActionState = "idle" | "requested" | "executed";
const severities: (SocSeverity | "All")[] = ["All", "Critical", "High", "Medium", "Low", "Informational"];
const severityClass = (severity: SocSeverity) => `soc-sev soc-${severity.toLowerCase()}`;
const stamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

const responseActions = [
  ["isolate", "Isolate device", "Defender for Endpoint", true], ["scan", "Run antivirus scan", "Defender for Endpoint", false],
  ["package", "Collect investigation package", "Defender for Endpoint", true], ["process", "Stop malicious process", "Defender for Endpoint", true],
  ["quarantine", "Quarantine file", "Defender for Endpoint", true], ["indicator", "Block indicator", "Defender XDR", true],
  ["disable", "Disable compromised user", "Microsoft Entra ID", true], ["password", "Reset password", "Microsoft Entra ID", true],
  ["sessions", "Revoke active sessions", "Microsoft Entra ID", true], ["email", "Remove malicious email", "Defender for Office 365", true],
  ["recommendation", "Apply security recommendation", "Defender / Intune", true],
] as const;

function useSocStored<T>(key: string, seed: T): [T, (next: SetStateAction<T>) => void] {
  const [value, setValue] = useState<T>(seed);
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch { /* demo storage is optional */ }
    hydrated.current = true;
  }, [key]);
  useEffect(() => {
    if (!hydrated.current) return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* demo storage is optional */ }
  }, [key, value]);
  return [value, setValue];
}

export function SocWorkspace({ notify, onOpenReport }: { notify: (message: string) => void; onOpenReport: (reportId: string) => void }) {
  const [alerts, setAlerts] = useSocStored<SocAlert[]>("pr360.soc.alerts", socAlerts);
  const [selectedId, setSelectedId] = useState(socAlerts[0].id);
  const [severity, setSeverity] = useState<SocSeverity | "All">("All");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [done, setDone] = useSocStored<Record<string, boolean>>("pr360.soc.investigation", Object.fromEntries(socInvestigationSteps.map((step) => [step.id, step.defaultDone])));
  const [notes, setNotes] = useSocStored<string[]>("pr360.soc.notes", ["Initial triage confirms Defender prevention controls activated before analyst response."]);
  const [note, setNote] = useState("");
  const [audit, setAudit] = useSocStored<SocAuditItem[]>("pr360.soc.audit", socAuditSeed);
  const [actions, setActions] = useSocStored<Record<string, ActionState>>("pr360.soc.actions", {});
  const [playbooks, setPlaybooks] = useSocStored("pr360.soc.playbooks", socPlaybooks);
  const selected = alerts.find((alert) => alert.id === selectedId) ?? alerts[0];
  const visible = useMemo(() => alerts.filter((alert) => (severity === "All" || alert.severity === severity) && `${alert.title} ${alert.source} ${alert.affected.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [alerts, severity, query]);
  const completed = Object.values(done).filter(Boolean).length;
  const openCount = alerts.filter((alert) => alert.status !== "Resolved").length;
  const addAudit = (action: string, detail: string, kind: SocAuditItem["kind"]) => setAudit((items) => [{ id: `local-${Date.now()}`, at: stamp(), actor: "SOC analyst (demo)", action, detail, kind }, ...items]);
  const updateStatus = (status: SocStatus) => {
    setAlerts((items) => items.map((alert) => alert.id === selected.id ? { ...alert, status } : alert));
    addAudit("Alert status updated", `${selected.id} moved to ${status}.`, "Alert");
    notify(`${selected.id} marked ${status}.`);
  };
  const runAction = (id: string, label: string, system: string, approval: boolean) => {
    const state = actions[id] ?? "idle";
    if (approval && state === "idle") {
      setActions({ ...actions, [id]: "requested" });
      addAudit("Approval requested", `${label} requested for ${selected.id} through ServiceNow SIR.`, "Approval");
      notify(`Approval requested for ${label}. No tenant action has been executed.`);
      return;
    }
    if (state === "executed") return;
    setActions({ ...actions, [id]: "executed" });
    setAlerts((items) => items.map((alert) => alert.id === selected.id && alert.status === "New" ? { ...alert, status: "Contained" } : alert));
    addAudit("Response action executed", `${label} recorded against ${selected.id} via ${system} (demo simulation).`, "Response");
    notify(`${label} recorded. In a connected tenant this would execute through ${system}.`);
  };
  const toggleStep = (id: string, title: string) => { const next = !done[id]; setDone({ ...done, [id]: next }); addAudit(next ? "Investigation step completed" : "Investigation step reopened", `${title} for ${selected.id}.`, "Investigation"); };

  return <section className="soc" data-testid="portal-soc">
    <header className="pr-page-head soc-head">
      <div><span className="pr-kicker">SECURITY & COMPLIANCE / DEFENDER SOC</span><h1>Microsoft Defender Security Operations Center</h1><p>Single-pane triage, investigation, governed response, automation, and compliance evidence for the local demonstration tenant.</p></div>
      <div className="soc-head-actions"><span className="soc-live"><i /> XDR sync healthy · 2 min ago</span><button className="pr-btn pr-primary" onClick={() => { setTab("automation"); addAudit("Manual incident created", `SOC incident created for ${selected.id}.`, "Alert"); notify("Incident workspace opened with audit tracking."); }} data-testid="soc-create-incident"><Alert24Regular /> Create incident</button></div>
    </header>

    <div className="soc-metrics">
      <Metric label="Defender alerts" value={alerts.length} note={`${openCount} open or contained`} tone="critical" />
      <Metric label="Open vs resolved" value={`${openCount} / ${alerts.length - openCount}`} note="active investigation queue" tone="amber" />
      <Metric label="Mean time to detect" value="4m 18s" note="30-day rolling median" tone="blue" />
      <Metric label="Mean time to respond" value="26m" note="30-day rolling median" tone="blue" />
      <Metric label="Secure Score" value="71%" note="12 recommendations outstanding" tone="green" />
      <Metric label="Vulnerability exposure" value="17" note="critical / high exposures" tone="critical" />
    </div>

    <div className="soc-integrations" aria-label="Connected SOC integrations">{socIntegrations.map(([name, state]) => <span key={name}><CloudCheckmark24Regular /> {name}<b>{state}</b></span>)}</div>

    <div className="soc-layout">
      <aside className="soc-queue">
        <div className="soc-queue-head"><div><b>Defender alert queue</b><small>{visible.length} matching alert{visible.length === 1 ? "" : "s"}</small></div><button onClick={() => { setSeverity("All"); setQuery(""); }}>Clear</button></div>
        <input className="soc-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search alerts, sources, entities" data-testid="soc-search" />
        <div className="soc-filters">{severities.map((item) => <button key={item} className={severity === item ? "soc-filter-on" : ""} onClick={() => setSeverity(item)} data-testid={`soc-filter-${item.toLowerCase()}`}>{item}</button>)}</div>
        <div className="soc-alert-list">{visible.map((alert) => <button key={alert.id} className={`soc-alert-card ${selected.id === alert.id ? "soc-selected" : ""}`} onClick={() => { setSelectedId(alert.id); setTab("overview"); }} data-testid={`soc-alert-${alert.id}`}><span className={severityClass(alert.severity)}>{alert.severity}</span><b>{alert.title}</b><small>{alert.source} · {alert.timestamp}</small><footer><span>{alert.incident}</span><span>{alert.status}</span></footer></button>)}{visible.length === 0 && <div className="soc-empty">No Defender alerts match this filter.</div>}</div>
      </aside>

      <article className="soc-detail">
        <div className="soc-alert-hero"><div><span className={severityClass(selected.severity)}>{selected.severity}</span><span className="soc-id">{selected.id}</span><h2>{selected.title}</h2><p>{selected.description}</p></div><div className="soc-status"><label>Investigation status</label><select value={selected.status} onChange={(e) => updateStatus(e.target.value as SocStatus)} data-testid="soc-status"><option>New</option><option>Investigating</option><option>Contained</option><option>Resolved</option></select><span>Owner: <b>{selected.owner}</b></span></div></div>
        <div className="soc-facts"><Fact label="Detection source" value={selected.source} /><Fact label="Related incident" value={selected.incident} /><Fact label="Affected resources" value={selected.affected.join(" · ")} /><Fact label="MITRE ATT&CK" value={selected.mitre.join(" · ")} /></div>
        <div className="soc-tabs" role="tablist">{(["overview", "investigation", "response", "automation"] as Tab[]).map((item) => <button key={item} className={tab === item ? "soc-tab-on" : ""} onClick={() => setTab(item)} role="tab" aria-selected={tab === item}>{item === "automation" ? "Automation & audit" : item[0].toUpperCase() + item.slice(1)}</button>)}</div>

        {tab === "overview" && <div className="soc-tab-content">
          <div className="soc-recommend"><Warning24Regular /><span><b>Recommended next action</b>{selected.recommended}</span><button className="pr-btn" onClick={() => onOpenReport(selected.reportId)} data-testid="soc-open-report">Open supporting report <ArrowRight24Regular /></button></div>
          <div className="soc-two-col"><Panel title="Threat and impact"><dl className="soc-dl"><dt>Threat category</dt><dd>{selected.category}</dd><dt>Entities in scope</dt><dd>{selected.affected.length}</dd><dt>Investigation progress</dt><dd>{completed} of {socInvestigationSteps.length} evidence tasks</dd><dt>Incident owner</dt><dd>{selected.owner}</dd></dl></Panel><Panel title="Attack timeline"><Timeline items={["Alert correlated by Microsoft Defender XDR", "Incident enriched with Entra, Intune, and mailbox context", "SOC analyst accepted ownership", "Automation rules evaluated containment criteria"]} /></Panel></div>
          <Panel title="Compliance posture"><div className="soc-posture"><div><b>71%</b><span>Microsoft Secure Score</span></div><div><b>12</b><span>Recommendations open</span></div><div><b>17</b><span>High exposure devices</span></div><div><b>100%</b><span>Response actions audited</span></div></div></Panel>
        </div>}

        {tab === "investigation" && <div className="soc-tab-content">
          <div className="soc-progress"><div><b>Investigation workflow</b><span>{completed}/{socInvestigationSteps.length} steps complete</span></div><i><em style={{ width: `${(completed / socInvestigationSteps.length) * 100}%` }} /></i></div>
          <div className="soc-steps">{socInvestigationSteps.map((step, index) => <button key={step.id} className={done[step.id] ? "soc-step-done" : ""} onClick={() => toggleStep(step.id, step.title)} data-testid={`soc-step-${step.id}`}><span>{done[step.id] ? <CheckmarkCircle24Regular /> : index + 1}</span><div><b>{step.title}</b><small>{step.detail}</small></div><em>{done[step.id] ? "Complete" : "Mark complete"}</em></button>)}</div>
          <div className="soc-notes"><b>Analyst notes</b><div>{notes.map((item, index) => <p key={`${item}-${index}`}><Person24Regular /> {item}</p>)}</div><form onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; setNotes([note.trim(), ...notes]); addAudit("Analyst note added", note.trim(), "Investigation"); setNote(""); notify("Analyst note added to the investigation record."); }}><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Record triage findings, approval rationale, or evidence references" data-testid="soc-note" /><button className="pr-btn" data-testid="soc-add-note">Add note</button></form></div>
        </div>}

        {tab === "response" && <div className="soc-tab-content">
          <div className="soc-approval"><LockClosed24Regular /><span><b>Governed response boundary</b> High-impact actions request approval first and every decision is written to the local SOC audit trail. Demo actions simulate execution only.</span></div>
          <div className="soc-response-grid">{responseActions.map(([id, label, system, approval]) => { const state = actions[id] ?? "idle"; return <div key={id} className="soc-response"><span>{system}</span><b>{label}</b><small>{approval ? "Approval required" : "Analyst-authorised"}</small><button className={`pr-btn ${state === "executed" ? "soc-executed" : state === "requested" ? "pr-primary" : ""}`} disabled={state === "executed"} onClick={() => runAction(id, label, system, approval)} data-testid={`soc-action-${id}`}>{state === "idle" ? approval ? "Request approval" : "Execute action" : state === "requested" ? "Execute approved action" : "Recorded"}</button></div>; })}</div>
        </div>}

        {tab === "automation" && <div className="soc-tab-content">
          <div className="soc-playbooks"><Panel title="Sentinel / Logic Apps playbooks"><div className="soc-playbook-list">{playbooks.map((playbook) => <div key={playbook.id}><div><b>{playbook.name}</b><small>When {playbook.trigger} → {playbook.action}</small><p>{playbook.integrations.join(" · ")}</p></div><label className="soc-switch"><input type="checkbox" checked={playbook.enabled} onChange={() => { setPlaybooks(playbooks.map((item) => item.id === playbook.id ? { ...item, enabled: !item.enabled } : item)); addAudit("Playbook configuration changed", `${playbook.name} ${playbook.enabled ? "disabled" : "enabled"}.`, "Automation"); }} /><i /></label><button className="pr-btn" onClick={() => { addAudit("Playbook run simulated", `${playbook.name} evaluated ${selected.id}; ticket and notification trail updated.`, "Automation"); notify(`${playbook.name} simulated with audit evidence recorded.`); }} data-testid={`soc-playbook-${playbook.id}`}><Play24Regular /> Run</button></div>)}</div></Panel><Panel title="Integration status"><div className="soc-integration-list">{socIntegrations.map(([name, state, detail]) => <div key={name}><CloudCheckmark24Regular /><span><b>{name}</b><small>{detail}</small></span><em>{state}</em></div>)}</div></Panel></div>
          <Panel title="Immutable SOC audit trail"><div className="soc-audit" data-testid="soc-audit">{audit.slice(0, 12).map((item) => <div key={item.id}><History24Regular /><span><b>{item.action}</b><small>{item.at} · {item.actor} · {item.kind}</small><p>{item.detail}</p></span></div>)}</div></Panel>
        </div>}
      </article>
    </div>
  </section>;
}

function Metric({ label, value, note, tone }: { label: string; value: string | number; note: string; tone: string }) { return <div className={`soc-metric soc-tone-${tone}`}><span>{label}</span><b>{value}</b><small>{note}</small></div>; }
function Fact({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><b>{value}</b></div>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className="soc-panel"><h3>{title}</h3>{children}</section>; }
function Timeline({ items }: { items: string[] }) { return <ol className="soc-timeline">{items.map((item) => <li key={item}><i /><span>{item}<small>Recorded in the local SOC evidence trail</small></span></li>)}</ol>; }

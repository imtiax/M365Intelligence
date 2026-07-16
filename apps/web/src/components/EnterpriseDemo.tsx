"use client";

import { useEffect, useState } from "react";
import {
  activateDemoScenario,
  getDemoCompliance,
  getDemoLicenses,
  getDemoOverview,
  getDemoSecurity,
  getDemoUser,
  getDemoUsers,
  resetDemoEnvironment,
  runDemoTick,
  type DemoOverview,
  type DemoUser,
} from "@/lib/runtime-api";

export function DemoModePanel({ notify }: { notify: (message: string) => void }) {
  const [overview, setOverview] = useState<DemoOverview | null>(null);
  const [busy, setBusy] = useState("");
  const load = () => getDemoOverview().then(setOverview).catch((error) => notify(error instanceof Error ? error.message : "Demo overview unavailable."));
  useEffect(() => { load(); const timer = window.setInterval(load, 30_000); return () => window.clearInterval(timer); }, []);
  const scenario = async (id: string) => {
    setBusy(id);
    try { const next = await activateDemoScenario(id); setOverview(next); notify(`${next.scenarios.find((item) => item.id === id)?.label ?? id} scenario activated.`); }
    catch (error) { notify(error instanceof Error ? error.message : "Scenario activation failed."); }
    finally { setBusy(""); }
  };
  if (!overview) return <div className="demo-notice"><div><strong>Loading enterprise simulation</strong><p>Connecting to persistent tenant state…</p></div></div>;
  const kpis = overview.tenant.kpis;
  return (
    <section className="enterprise-demo panel">
      <header className="panel-heading">
        <div><small>LIVE CUSTOMER DEMO MODE</small><h2>{overview.tenant.name}</h2><p>{overview.tenant.industry} · {overview.tenant.countries} countries · Persistent enterprise simulation</p></div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={async () => { try { const event = await runDemoTick(); notify(`${event.title}: ${event.detail}`); load(); } catch (error) { notify(error instanceof Error ? error.message : "Simulation tick failed."); } }}>Generate live event</button>
          <button className="secondary-button" onClick={async () => { if (!window.confirm("Reset the complete synthetic enterprise environment?")) return; try { const result = await resetDemoEnvironment(); notify(`Environment reset: ${result.users.toLocaleString()} users and ${result.enterpriseObjects.toLocaleString()} objects.`); load(); } catch (error) { notify(error instanceof Error ? error.message : "Reset failed."); } }}>Reset environment</button>
        </div>
      </header>
      <div className="metrics-grid enterprise-kpis">
        {[["Users", kpis.users.toLocaleString()], ["Active", kpis.activeUsers.toLocaleString()], ["Security score", `${kpis.securityScore}%`], ["Compliance", `${kpis.complianceScore}%`], ["License utilization", `${kpis.licenseUtilization}%`], ["High-risk users", String(kpis.highRiskUsers)]].map(([label, value]) => <article className="metric-card teal" key={label}><div className="metric-head"><span>{label}</span></div><div className="metric-value">{value}</div><div className="metric-detail">Live simulated tenant state</div></article>)}
      </div>
      <div className="scenario-selector">
        {overview.scenarios.map((item) => <button key={item.id} disabled={!!busy} className={overview.tenant.activeScenario === item.id ? "selected" : ""} onClick={() => scenario(item.id)}><strong>{busy === item.id ? "Activating…" : item.label}</strong><small>{item.description}</small></button>)}
      </div>
      <div className="object-count-strip">
        {Object.entries(overview.objectCounts).map(([name, count]) => <span key={name}><b>{count.toLocaleString()}</b><small>{name.replace(/([A-Z])/g, " $1")}</small></span>)}
      </div>
      <div className="live-timeline">
        {overview.latestEvents.slice(0, 5).map((event) => <article key={event.id}><i className={event.severity}/><time>{new Date(event.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time><span><strong>{event.title}</strong><small>{event.detail}</small></span></article>)}
      </div>
    </section>
  );
}

export function User360Workspace({ notify }: { notify: (message: string) => void }) {
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("");
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<DemoUser | null>(null);
  const load = () => getDemoUsers(search, risk, 100).then((body) => { setUsers(body.items); setTotal(body.total); if (!selected && body.items[0]) getDemoUser(body.items[0].id).then(setSelected); }).catch((error) => notify(error instanceof Error ? error.message : "Users unavailable."));
  useEffect(() => { const timer = window.setTimeout(load, 180); return () => window.clearTimeout(timer); }, [search, risk]);
  return <>
    <div className="page-heading"><div><div className="eyebrow">ENTERPRISE DIRECTORY / USER 360</div><h1>Global workforce intelligence</h1><p>Search 5,000 normalized identities and inspect activity, license, device, collaboration, and risk context.</p></div></div>
    <div className="explorer-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, username, department, or location"/><select value={risk} onChange={(event) => setRisk(event.target.value)}><option value="">All risk levels</option><option>High</option><option>Medium</option><option>Low</option><option>None</option></select><strong>{total.toLocaleString()} users</strong></div>
    <div className="user360-layout">
      <section className="panel user360-list"><div className="compact-table"><div className="compact-head"><span>User</span><span>Department</span><span>Location</span><span>Risk</span><span>MFA</span></div>{users.map((user) => <button className={`compact-row ${selected?.id === user.id ? "selected" : ""}`} key={user.id} onClick={() => getDemoUser(user.id).then(setSelected)}><span><strong>{user.displayName}</strong><small>{user.username}</small></span><span>{user.department}</span><span>{user.location}</span><b className={`severity ${user.riskLevel.toLowerCase()}`}>{user.riskLevel}</b><span>{user.mfaStatus}</span></button>)}</div></section>
      {selected && <aside className="panel user360-profile"><div className="profile-hero"><span>{selected.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><div><h2>{selected.displayName}</h2><p>{selected.jobTitle}</p><small>{selected.username}</small></div></div><dl>{[["Department", selected.department], ["Location", selected.location], ["Manager", selected.manager], ["License", selected.license], ["Account", selected.accountStatus], ["Last login", new Date(selected.lastLogin).toLocaleString()], ["MFA", selected.mfaStatus], ["Risk", selected.riskLevel], ["Devices", String(selected.devices)], ["Teams", String(selected.teams)], ["Mailbox", `${selected.mailboxGb} GB`]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><h3>Recommendations</h3>{selected.recommendations?.length ? selected.recommendations.map((item) => <p className="recommendation" key={item}>{item}</p>) : <p className="recommendation">No immediate action required.</p>}</aside>}
    </div>
  </>;
}

export function LiveSecurityPanel() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDemoSecurity>> | null>(null);
  useEffect(() => { getDemoSecurity().then(setData); }, []);
  if (!data) return null;
  return <section className="panel live-domain"><div className="panel-heading"><div><h2>Live simulated security operations</h2><p>{data.activeIncidents} active incidents · Security score {data.score}% · {data.riskDistribution.high} high-risk users</p></div></div><div className="compact-table"><div className="compact-head"><span>Incident</span><span>Severity</span><span>User</span><span>Location</span><span>Detection</span><span>Status</span></div>{data.events.slice(0, 6).map((event) => <div className="compact-row" key={event.id}><strong>{event.title}</strong><b className={`severity ${event.severity.toLowerCase()}`}>{event.severity}</b><span>{event.user}</span><span>{event.location}</span><span>{event.detection}</span><span>{event.status}</span></div>)}</div></section>;
}

export function LiveLicensePanel() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDemoLicenses>> | null>(null);
  useEffect(() => { getDemoLicenses().then(setData); }, []);
  if (!data) return null;
  return <section className="panel live-domain"><div className="panel-heading"><div><h2>Live license optimization</h2><p>{data.utilization}% utilization · ${data.annualSavings.toLocaleString()} modeled annual opportunity</p></div></div><div className="compact-table"><div className="compact-head"><span>User</span><span>Current license</span><span>Usage</span><span>Recommendation</span><span>Annual saving</span></div>{data.candidates.slice(0, 8).map((item) => <div className="compact-row" key={item.username}><span><strong>{item.user}</strong><small>{item.username}</small></span><span>{item.currentLicense}</span><span>{item.usage}</span><span>{item.recommendation}</span><strong>${item.annualSaving}</strong></div>)}</div></section>;
}

export function LiveCompliancePanel() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDemoCompliance>> | null>(null);
  useEffect(() => { getDemoCompliance().then(setData); }, []);
  if (!data) return null;
  return <section className="panel live-domain"><div className="panel-heading"><div><h2>Live compliance readiness</h2><p>Overall readiness {data.score}% across ISO 27001, NIST, CIS, and SOC 2</p></div></div><div className="framework-grid">{data.frameworkScores.map((item) => <article key={item.framework}><strong>{item.framework}</strong><b>{item.score}%</b><small>{item.controls} controls · {item.failed} failed</small></article>)}</div><div className="compact-table"><div className="compact-head"><span>Framework</span><span>Control</span><span>Score</span><span>Failed objects</span><span>Status</span><span>Recommendation</span></div>{data.controls.filter((item) => item.control === "MFA Enforcement").map((item) => <div className="compact-row" key={item.id}><span>{item.framework}</span><strong>{item.control}</strong><span>{item.score}%</span><span>{item.failed}</span><b>{item.status}</b><span>{item.recommendation}</span></div>)}</div></section>;
}

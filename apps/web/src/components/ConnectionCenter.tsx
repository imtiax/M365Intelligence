"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowDownload24Regular, ArrowSync24Regular, CheckmarkCircle24Regular, Cloud24Regular, Key24Regular, LockClosed24Regular, ShieldCheckmark24Regular, Warning24Regular } from "@fluentui/react-icons";

type Requirement = { name: string; ready: boolean };
type Readiness = {
  mode: string;
  graphCollector: { enabled: boolean; ready: boolean; requirements: Requirement[] };
  workforceSso: { enabled: boolean; ready: boolean; requirements: Requirement[] };
  connectorPacks: { code: string; name: string; permissions: string[]; status: string }[];
  releaseGates: string[];
};

const localReadiness: Readiness = {
  mode: "configuration_gated",
  graphCollector: { enabled: false, ready: false, requirements: [{ name: "Tenant ID", ready: false }, { name: "Client ID", ready: false }, { name: "Certificate reference", ready: false }, { name: "Collector explicitly enabled", ready: false }] },
  workforceSso: { enabled: false, ready: false, requirements: [{ name: "Tenant ID", ready: false }, { name: "Application client ID", ready: false }, { name: "HTTPS redirect URI", ready: false }, { name: "Allowed tenant binding", ready: false }, { name: "Federation explicitly enabled", ready: false }] },
  connectorPacks: [
    { code: "entra-read", name: "Entra identity and sign-in", permissions: ["User.Read.All", "Group.Read.All", "AuditLog.Read.All", "RoleManagement.Read.Directory"], status: "blocked_until_consent" },
    { code: "licensing", name: "Licensing and usage", permissions: ["Organization.Read.All", "Reports.Read.All"], status: "blocked_until_consent" },
    { code: "defender-xdr", name: "Defender XDR and incidents", permissions: ["SecurityIncident.Read.All", "SecurityAlert.Read.All"], status: "blocked_until_consent" },
    { code: "purview-audit", name: "Purview audit", permissions: ["AuditLogsQuery-Exchange.Read.All", "AuditLogsQuery-SharePoint.Read.All"], status: "blocked_until_consent" },
    { code: "intune", name: "Intune devices and compliance", permissions: ["DeviceManagementManagedDevices.Read.All", "DeviceManagementConfiguration.Read.All"], status: "blocked_until_consent" },
  ],
  releaseGates: ["least-privilege permission review", "admin consent evidence", "certificate rotation runbook", "tenant isolation test", "pagination, throttling, and retry test", "backup and audit-ledger restore test"],
};

function downloadAssessment(readiness: Readiness) {
  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), ...readiness }, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "aegis-connection-readiness.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function ConnectionCenter({ notify }: { notify: (message: string) => void }) {
  const [readiness, setReadiness] = useState<Readiness>(localReadiness);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"local" | "control-plane">("local");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/runtime/api/v1/control-plane/connection-readiness", { cache: "no-store" });
      if (!response.ok) throw new Error("Control plane is unavailable.");
      setReadiness(await response.json() as Readiness); setSource("control-plane"); notify("Connection readiness rechecked against the protected control plane.");
    } catch {
      setReadiness(localReadiness); setSource("local"); notify("Control plane is unavailable; showing the safe local configuration baseline.");
    } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { void refresh(); }, [refresh]);
  const readyCount = [...readiness.graphCollector.requirements, ...readiness.workforceSso.requirements].filter((item) => item.ready).length;
  const total = readiness.graphCollector.requirements.length + readiness.workforceSso.requirements.length;
  return <section className="cc" data-testid="portal-connection-center">
    <header className="pr-page-head cc-head"><div><span className="pr-kicker">PRODUCTION FOUNDATION / IDENTITY & CONNECTORS</span><h1>Connection Center</h1><p>Configuration readiness for Entra workforce SSO and customer-controlled Microsoft 365 collectors. Credentials and tenant data are never entered or displayed in the browser.</p></div><div className="cc-actions"><span className={source === "control-plane" ? "cc-source cc-live" : "cc-source"}><i /> {source === "control-plane" ? "Protected control-plane check" : "Local safe baseline"}</span><button className="pr-btn" onClick={() => void refresh()} disabled={loading} data-testid="cc-refresh"><ArrowSync24Regular /> {loading ? "Checking…" : "Recheck"}</button><button className="pr-btn pr-primary" onClick={() => { downloadAssessment(readiness); notify("Connection readiness assessment downloaded."); }} data-testid="cc-export"><ArrowDownload24Regular /> Export assessment</button></div></header>
    <div className="cc-summary"><div><b>{readyCount}/{total}</b><span>configuration requirements ready</span></div><div><b>{readiness.graphCollector.ready ? "Ready" : "Gated"}</b><span>read-only collector</span></div><div><b>{readiness.workforceSso.ready ? "Ready" : "Gated"}</b><span>Entra workforce SSO</span></div><div><b>0</b><span>write capabilities enabled</span></div></div>
    <div className="cc-notice"><LockClosed24Regular /><span><b>Default-deny deployment posture</b> Graph collection and Entra federation remain disabled until explicit customer configuration, least-privilege consent, and release-gate evidence are complete. This workspace does not acquire a token or connect to a tenant.</span></div>
    <div className="cc-readiness-grid"><ReadinessCard icon={<Cloud24Regular />} title="Microsoft 365 read-only collector" subtitle="App-only, certificate or managed-identity collector" readiness={readiness.graphCollector} /><ReadinessCard icon={<Key24Regular />} title="Microsoft Entra workforce SSO" subtitle="OIDC authorization code + PKCE for human users" readiness={readiness.workforceSso} /></div>
    <section className="cc-panel"><header><div><h2>Connector permission contracts</h2><p>Enable only the collector packs approved by the customer. Each requires its own consent review and data-coverage validation.</p></div><span>{readiness.connectorPacks.length} gated packs</span></header><div className="cc-packs">{readiness.connectorPacks.map((pack) => <article key={pack.code}><div><b>{pack.name}</b><small>{pack.status.replaceAll("_", " ")}</small></div><p>{pack.permissions.map((permission) => <span key={permission}>{permission}</span>)}</p></article>)}</div></section>
    <div className="cc-bottom"><section className="cc-panel"><header><div><h2>Production release gates</h2><p>All gates require recorded evidence before enabling live collection.</p></div></header><ol className="cc-gates">{readiness.releaseGates.map((gate, index) => <li key={gate}><b>{index + 1}</b><span>{gate}</span><em>Required</em></li>)}</ol></section><section className="cc-panel"><header><div><h2>Operator sequence</h2><p>Safe order for a first customer pilot.</p></div></header><ol className="cc-sequence"><li><span>1</span>Create separate Entra applications for workforce sign-in, read-only collection, and future remediation.</li><li><span>2</span>Configure exact tenant binding, HTTPS redirect URI, certificate reference, and least-privilege permission contracts in protected deployment configuration.</li><li><span>3</span>Obtain independent admin-consent evidence and test only approved endpoints with a nonproduction tenant first.</li><li><span>4</span>Enable one read-only connector pack, validate delta/throttle/retention controls, then expand coverage deliberately.</li></ol></section></div>
  </section>;
}

function ReadinessCard({ icon, title, subtitle, readiness }: { icon: ReactNode; title: string; subtitle: string; readiness: Readiness["graphCollector"] }) {
  return <section className="cc-readiness"><header><span>{icon}</span><div><h2>{title}</h2><p>{subtitle}</p></div><em className={readiness.ready ? "cc-ready" : "cc-gated"}>{readiness.ready ? "Ready" : "Gated"}</em></header><div>{readiness.requirements.map((requirement) => <p key={requirement.name} className={requirement.ready ? "cc-met" : "cc-missing"}>{requirement.ready ? <CheckmarkCircle24Regular /> : <Warning24Regular />}<span>{requirement.name}</span><b>{requirement.ready ? "Configured" : "Required"}</b></p>)}</div></section>;
}

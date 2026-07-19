"use client";

import { useEffect, useState } from "react";
import { ArrowSync24Regular, CheckmarkCircle24Regular, CloudCheckmark24Regular, Key24Regular, LockClosed24Regular, PeopleTeam24Regular, ShieldCheckmark24Regular } from "@fluentui/react-icons";
import {
  getCommercialConnectors, getCommercialCustomers, getCommercialLicense,
  getCommercialOrganization, getCommercialSubscription, validateCommercialConnector,
  type CommercialConnector, type CommercialCustomers, type CommercialLicense,
  type CommercialOrganization, type CommercialSubscription,
} from "@/lib/runtime-api";

type Props = { page: string; notify: (message: string) => void };

function Header({ path, title, description }: { path: string; title: string; description: string }) {
  return <div className="page-heading"><div><div className="eyebrow">{path}</div><h1>{title}</h1><p>{description}</p></div><div className="commercial-boundary"><LockClosed24Regular /> Customer data plane</div></div>;
}

function State({ value }: { value: string }) { return <span className={`commercial-state ${value}`}>{value.replaceAll("_", " ")}</span>; }

export function CommercialWorkspaces({ page, notify }: Props) {
  const [organization, setOrganization] = useState<CommercialOrganization>();
  const [subscription, setSubscription] = useState<CommercialSubscription>();
  const [license, setLicense] = useState<CommercialLicense>();
  const [connectors, setConnectors] = useState<CommercialConnector[]>([]);
  const [customers, setCustomers] = useState<CommercialCustomers>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const load = page === "Connection center"
      ? getCommercialConnectors().then((result) => active && setConnectors(result.items))
      : page === "Customer portal"
        ? Promise.all([getCommercialOrganization(), getCommercialSubscription(), getCommercialLicense()]).then(([org, sub, lic]) => { if (active) { setOrganization(org); setSubscription(sub); setLicense(lic); } })
        : getCommercialCustomers().then((result) => active && setCustomers(result));
    load.catch((error: Error) => notify(error.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page, notify]);

  async function validate(connector: CommercialConnector) {
    try {
      const result = await validateCommercialConnector(connector.code);
      setConnectors((items) => items.map((item) => item.code === connector.code ? result : item));
      notify(`${connector.name} validation ${result.validation.replaceAll("_", " ")}.`);
    } catch (error) { notify(error instanceof Error ? error.message : "Connector validation failed."); }
  }

  if (loading) return <section className="commercial-loading"><span className="spinner" /> Loading commercial workspace…</section>;

  if (page === "Connection center") return <section className="commercial-workspace">
    <Header path="PLATFORM / CONNECTIONS" title="Connection center" description="Consent, permission, synchronization, and health across every authorized enterprise connector." />
    <div className="commercial-summary"><article><CloudCheckmark24Regular /><b>{connectors.filter((item) => item.state === "healthy").length}</b><span>Healthy connectors</span></article><article><ShieldCheckmark24Regular /><b>{Math.round(connectors.reduce((sum, item) => sum + item.permissionCoverage, 0) / Math.max(connectors.length, 1))}%</b><span>Permission coverage</span></article><article><ArrowSync24Regular /><b>{connectors.reduce((sum, item) => sum + item.objectsProcessed, 0).toLocaleString()}</b><span>Objects synchronized</span></article><article><Key24Regular /><b>{connectors.reduce((sum, item) => sum + item.missingPermissions.length, 0)}</b><span>Missing permissions</span></article></div>
    <div className="connector-grid">{connectors.map((connector) => <article key={connector.code}><div className="connector-head"><span><CloudCheckmark24Regular /></span><div><h3>{connector.name}</h3><small>{connector.domain} · {connector.reports} reports</small></div><State value={connector.state} /></div><div className="coverage-line"><span>Permission coverage</span><b>{connector.permissionCoverage}%</b><i><em style={{ width: `${connector.permissionCoverage}%` }} /></i></div><dl><div><dt>Last sync</dt><dd>{new Date(connector.lastSyncAt).toLocaleTimeString()}</dd></div><div><dt>Next sync</dt><dd>{new Date(connector.nextSyncAt).toLocaleTimeString()}</dd></div><div><dt>Objects</dt><dd>{connector.objectsProcessed.toLocaleString()}</dd></div></dl>{connector.missingPermissions.length > 0 && <p className="permission-warning">Missing: {connector.missingPermissions.join(", ")}</p>}<button className="secondary-button" onClick={() => validate(connector)}><CheckmarkCircle24Regular /> Validate configuration</button></article>)}</div>
  </section>;

  if (page === "Customer portal" && organization && subscription && license) return <section className="commercial-workspace">
    <Header path="COMMERCIAL / CUSTOMER" title="Customer portal" description="Organization onboarding, subscription entitlement, deployment license, and data-boundary status." />
    <div className="commercial-summary"><article><PeopleTeam24Regular /><b>{subscription.licensedUsers.toLocaleString()}</b><span>Licensed users</span></article><article><Key24Regular /><b>{license.activeInstances}/{license.maxInstances}</b><span>Active instances</span></article><article><CheckmarkCircle24Regular /><b>{organization.onboarding.completed}/{organization.onboarding.total}</b><span>Onboarding steps</span></article><article><LockClosed24Regular /><b>Local</b><span>Operational data boundary</span></article></div>
    <div className="portal-grid"><article className="commercial-panel"><div className="panel-heading"><div><p className="eyebrow">ORGANIZATION</p><h2>{organization.displayName}</h2></div><State value={organization.mode} /></div><dl className="portal-details"><div><dt>Legal name</dt><dd>{organization.legalName}</dd></div><div><dt>Industry</dt><dd>{organization.industry.join(" · ")}</dd></div><div><dt>Size</dt><dd>{organization.companySize}</dd></div><div><dt>Primary region</dt><dd>{organization.primaryRegion}</dd></div><div><dt>Microsoft tenant</dt><dd>{organization.tenantId}</dd></div><div><dt>Next onboarding action</dt><dd>{organization.onboarding.next}</dd></div></dl></article><article className="commercial-panel"><div className="panel-heading"><div><p className="eyebrow">SUBSCRIPTION</p><h2>{subscription.plan}</h2></div><State value={subscription.state} /></div><p className="commercial-note">{subscription.note}</p><div className="entitlement-list">{subscription.entitlements.map((item) => <span key={item}><CheckmarkCircle24Regular />{item.replaceAll("-", " ")}</span>)}</div><div className="license-box"><span><Key24Regular /></span><div><small>{license.licenseNumber}</small><b>{license.edition}</b><em>Bound to one tenant · {license.maxInstances} instance · expires {new Date(license.expiresAt).toLocaleDateString()}</em></div></div></article></div>
  </section>;

  if (page === "Super Admin" && customers) return <section className="commercial-workspace">
    <Header path="INTERNAL / CONTROL PLANE" title="Super Admin" description="Commercial lifecycle and privacy-preserving fleet metadata—without customer Microsoft 365 records." />
    <div className="commercial-disclosure"><ShieldCheckmark24Regular /><div><b>Deliberate privacy boundary</b><p>{customers.disclosure}</p></div></div>
    <div className="commercial-summary"><article><PeopleTeam24Regular /><b>{customers.summary.customers}</b><span>Organizations</span></article><article><CloudCheckmark24Regular /><b>{customers.summary.activeTrials}</b><span>Active trials</span></article><article><CheckmarkCircle24Regular /><b>{customers.summary.paidSubscriptions}</b><span>Paid subscriptions</span></article><article><Key24Regular /><b>{customers.summary.expiringLicenses}</b><span>Expiring licenses</span></article></div>
    <div className="commercial-table"><div className="commercial-table-head"><span>Organization</span><span>Mode</span><span>Subscription</span><span>License</span><span>Connections</span><span>Boundary</span></div>{customers.items.map((customer) => <div className="commercial-table-row" key={customer.tenantId}><span><b>{customer.organization}</b><small>{customer.tenantId}</small></span><span>{customer.mode}</span><span>{customer.subscription}</span><span><State value={customer.license.toLowerCase()} /></span><span>{customer.connectors}</span><span><LockClosed24Regular /> {customer.dataBoundary}</span></div>)}</div>
  </section>;

  return <section className="empty-state">Commercial workspace data is unavailable.</section>;
}

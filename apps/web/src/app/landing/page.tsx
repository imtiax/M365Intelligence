import Image from "next/image";

export const dynamic = "force-dynamic";

const capabilities = [
  ["01", "Explorer 360", "Connect identity, device, mailbox, collaboration, license, and risk context for every user."],
  ["02", "Security operations", "Prioritize incidents and risky identities, then route remediation through controlled approval."],
  ["03", "Reporting studio", "Build, schedule, secure, and export cross-workload reports without exposing provider payloads."],
  ["04", "Compliance evidence", "Track control posture, retention, audit activity, and evidence ownership in one operating view."],
  ["05", "License intelligence", "Expose unused capacity, downgrade candidates, and renewal opportunities with accountable savings."],
  ["06", "Private AI analyst", "Ask grounded operational questions with evidence references and role-aware responses."],
  ["07", "Governed automation", "Require separation of duties, approvals, full audit history, and rollback for sensitive actions."],
  ["08", "Hybrid operations", "Unify Entra ID, Microsoft 365 workloads, devices, and hybrid directory health."],
];

const industries = [
  { tag: "FINANCIAL SERVICES", title: "Evidence before exposure", text: "Continuously inspect privileged access, identity risk, retention, and control posture—without compromising tenant sovereignty.", signal: "Privileged access · audit · retention" },
  { tag: "MANUFACTURING", title: "One view across every site", text: "Correlate plant, office, frontline, and contractor identities with device, collaboration, license, and security context.", signal: "Hybrid workforce · devices · cost" },
  { tag: "LOGISTICS", title: "Operations that move with you", text: "Protect distributed users and service accounts while maintaining visibility across regions, business units, and critical workflows.", signal: "Distributed identity · continuity · risk" },
];

const comparison = [
  ["Cross-workload operating model", "Fragmented views", "Manual joins", "Unified semantic model"],
  ["From insight to remediation", "Report only", "Custom development", "Approval-controlled action"],
  ["Security and accountability", "Tool-specific", "Depends on implementation", "RBAC, audit and rollback"],
  ["Deployment control", "Vendor hosted", "Customer assembled", "Customer-hosted by design"],
  ["Executive-to-operator experience", "Fixed dashboards", "Separate BI project", "Role-aware workspaces"],
];

function Mark() {
  return <span className="landing-mark" aria-hidden="true"><span>◇</span></span>;
}

export default function LandingPage() {
  const publicDemoEnabled = process.env.AEGIS_PUBLIC_DEMO_ENABLED === "true";
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Aegis home"><Mark /><span><strong>Aegis</strong><small>M365 INTELLIGENCE</small></span></a>
        <nav aria-label="Main navigation">
          <a href="#platform">Platform</a><a href="#industries">Industries</a><a href="#difference">Why Aegis</a><a href="#security">Security</a>
        </nav>
        <div className="landing-nav-actions"><a className="nav-signin" href="/login">Sign in</a><a className="landing-button small" href={publicDemoEnabled ? "/landing/demo" : "#demo"}>{publicDemoEnabled ? "Open live demo" : "Request a demo"} <span>{publicDemoEnabled ? "→" : "↗"}</span></a></div>
      </header>

      <section className="landing-hero" id="top">
        <div className="hero-glow" />
        <div className="hero-copy">
          <p className="landing-eyebrow"><i /> MICROSOFT 365 · SECURITY · GOVERNANCE · FINOPS</p>
          <h1>Turn Microsoft 365 signals into <em>governed action.</em></h1>
          <p className="hero-intro">A single intelligence and operations platform for teams that must secure the tenant, prove compliance, control cost, and act with confidence.</p>
          <div className="hero-actions"><a className="landing-button" href={publicDemoEnabled ? "/landing/demo" : "/login"}>{publicDemoEnabled ? "Explore the live demo" : "Explore the platform"} <span>→</span></a><a className="landing-button ghost" href="#product-tour">See the product <span>↓</span></a></div>
          <p className="hero-proof"><span>✓ Fully local deployment</span><span>✓ Customer-controlled data</span><span>✓ Audit-ready</span></p>
        </div>
        <div className="hero-product">
          <div className="product-window">
            <div className="window-bar"><span><i /><i /><i /></span><small>AEGIS DEMO ENTERPRISE · SYNTHETIC SANDBOX</small><b>DEMO</b></div>
            <Image src="/landing/admin-center-dashboard.png?v=warm-slate" width={1580} height={1000} priority alt="Aegis Microsoft 365 report center showing a unified Hybrid Active Directory dashboard" />
          </div>
          <div className="floating-proof"><b>10</b><span>connected<br />admin centers</span></div>
        </div>
      </section>

      <section className="landing-metrics" aria-label="Demo environment scale">
        <div><strong>5,000</strong><span>normalized identities</span></div><div><strong>28,900</strong><span>governed M365 objects</span></div><div><strong>947</strong><span>reporting templates</span></div><div><strong>10</strong><span>admin-center dashboards</span></div>
      </section>

      <section className="local-first-banner" aria-labelledby="local-first-title">
        <div><p className="landing-eyebrow">LOCAL-FIRST BY DESIGN</p><h2 id="local-first-title">Your tenant data stays in your environment.</h2></div>
        <div><p>Aegis is installed on customer-controlled infrastructure. The application, databases, reports, search indexes, audit history, and optional local AI remain inside that boundary—there is no Aegis-operated cloud receiving or storing tenant data.</p><p className="residency-note"><b>Clear boundary:</b> when live Microsoft 365 connectivity is enabled, the platform communicates directly with Microsoft identity and Graph endpoints authorized by your tenant. Optional external integrations require explicit configuration.</p></div>
      </section>

      <section className="landing-section platform-section" id="platform">
        <div className="section-heading"><div><p className="landing-eyebrow">THE OPERATING LAYER</p><h2>One platform. Every Microsoft 365 decision.</h2></div><p>Replace swivel-chair administration with a normalized, role-aware operating model across security, identity, compliance, reporting, and cost.</p></div>
        <div className="capability-grid">{capabilities.map(([number,title,text]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{text}</p><a href="#product-tour" aria-label={`View ${title}`}>Explore <b>↗</b></a></article>)}</div>
      </section>

      <section className="landing-section product-tour" id="product-tour">
        <div className="tour-copy"><p className="landing-eyebrow">REAL PRODUCT · REAL WORKFLOWS</p><h2>See the whole tenant.<br />Understand one user.</h2><p>Explorer 360 brings together identity, activity, licenses, devices, collaboration, and risk—so analysts investigate context, not tabs.</p><ul><li>Search 5,000 normalized identities</li><li>Surface risk and MFA gaps instantly</li><li>Launch governed investigations from user context</li></ul></div>
        <div className="tour-image"><Image src="/landing/explorer-360.png?v=warm-slate" width={1580} height={1000} alt="Explorer 360 displaying a global workforce directory and complete user risk profile" /><span>Explorer 360 · User intelligence</span></div>
      </section>

      <section className="landing-section report-tour">
        <div className="tour-image"><Image src="/landing/custom-report-builder.png?v=warm-slate" width={1580} height={1000} alt="Aegis custom report builder with data sources, calculated fields, security, and scheduling" /><span>Report Studio · Governed analytics</span></div>
        <div className="tour-copy"><p className="landing-eyebrow">FROM QUESTION TO EVIDENCE</p><h2>Reporting built for operators—not just analysts.</h2><p>Compose cross-workload reports from the governed semantic model, apply role security, schedule delivery, and export decision-ready output.</p><ul><li>947-template presentation catalogue</li><li>PDF and Excel export workflows</li><li>Schedules, ownership, and access controls</li></ul></div>
      </section>

      <section className="landing-section industry-section" id="industries">
        <div className="section-heading"><div><p className="landing-eyebrow">BUILT FOR COMPLEX ENTERPRISES</p><h2>Your industry changes the risk.<br />Your control plane should adapt.</h2></div></div>
        <div className="industry-grid">{industries.map((item,index) => <article key={item.tag}><span className="industry-number">0{index + 1}</span><p className="landing-eyebrow">{item.tag}</p><h3>{item.title}</h3><p>{item.text}</p><small>{item.signal}</small></article>)}</div>
      </section>

      <section className="landing-section difference-section" id="difference">
        <div className="section-heading"><div><p className="landing-eyebrow">WHY AEGIS IS DIFFERENT</p><h2>Not another dashboard.<br />An accountable operating system.</h2></div><p>Reporting tools show what happened. Aegis connects evidence to a governed decision, a controlled action, and a provable outcome.</p></div>
        <div className="comparison" role="table" aria-label="Platform category comparison">
          <div className="comparison-row comparison-head" role="row"><span>Capability</span><span>Point reporting</span><span>BI + scripts</span><span>Aegis M365</span></div>
          {comparison.map(row => <div className="comparison-row" role="row" key={row[0]}>{row.map((cell,i) => <span key={cell} className={i === 3 ? "aegis-cell" : ""}>{i === 3 && <b>✓</b>}{cell}</span>)}</div>)}
        </div>
        <p className="comparison-note">Category comparison reflects common deployment patterns; exact capabilities vary by product and implementation.</p>
      </section>

      <section className="landing-section security-section" id="security">
        <div><p className="landing-eyebrow">SECURE BY ARCHITECTURE</p><h2>Installed locally. Controlled by you.</h2><p>The complete platform runs in your environment. Aegis does not require tenant telemetry or operational data to be stored in an Aegis cloud service; identity, authorization, and auditability remain at every boundary.</p></div>
        <div className="security-grid"><article><b>01</b><h3>Least privilege</h3><p>Scoped Graph permissions and role-aware access minimize exposure.</p></article><article><b>02</b><h3>Separation of duties</h3><p>Sensitive changes require independent, accountable approval.</p></article><article><b>03</b><h3>Tamper-evident audit</h3><p>Decisions, actions, results, and rollback remain traceable.</p></article><article><b>04</b><h3>Deployment sovereignty</h3><p>Run the platform and data services inside your controlled boundary.</p></article></div>
      </section>

      <section className="operating-flow" aria-label="Aegis operating workflow"><span>COLLECT</span><i>→</i><span>NORMALIZE</span><i>→</i><span>ANALYZE</span><i>→</i><span>APPROVE</span><i>→</i><span>ACT</span><i>→</i><span>PROVE</span></section>

      <section className="landing-cta" id="demo"><p className="landing-eyebrow">READY FOR A CONTROLLED PILOT?</p><h2>Try the complete product.<br />Then deploy it locally.</h2><p>{publicDemoEnabled ? "Explore a populated, short-lived synthetic tenant now. When you are ready, request the deployment package and setup guidance for your customer-controlled environment." : "Request the deployment package and setup guidance for a controlled evaluation inside your customer-managed environment."}</p><div>{publicDemoEnabled && <a className="landing-button light" href="/landing/demo">Launch public demo <span>→</span></a>}<a className={publicDemoEnabled ? "landing-button outline-light" : "landing-button light"} href="https://github.com/sherazahmad24/M365Intelligence/issues/new?title=Aegis%20M365%20licensed%20deployment%20request" target="_blank" rel="noreferrer">Request deployment access <span>↗</span></a></div><small>The public demo uses synthetic data and cannot connect to Microsoft 365. Licensed deployments run inside the customer-controlled boundary; live connectivity requires authorized tenant configuration.</small></section>

      <footer className="landing-footer"><a className="landing-brand" href="#top"><Mark /><span><strong>Aegis</strong><small>M365 INTELLIGENCE</small></span></a><p>Microsoft 365 intelligence, security, governance, and cost control.</p><div><a href="#security">Security</a>{publicDemoEnabled && <a href="/landing/demo">Live demo</a>}<a href="/login">Sign in</a><span>© 2026 Aegis</span></div></footer>
    </main>
  );
}

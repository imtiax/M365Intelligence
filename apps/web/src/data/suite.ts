export type SuiteModule = { name:string; family:string; description:string; reports:number; health:number; signals:string; accent:string };
export type CatalogueReport = { id:string; name:string; workload:string; category:string; description:string; rows:string; updated:string; favorite:boolean; scheduled:boolean };

export const suiteModules: SuiteModule[] = [
  {name:'Microsoft Entra ID',family:'Identity',description:'Users, groups, roles, applications, authentication, sign-ins, and lifecycle.',reports:148,health:96,signals:'5.8K objects',accent:'#4f9ee8'},
  {name:'Exchange Online',family:'Messaging',description:'Mailboxes, permissions, mail flow, retention, spam, and usage intelligence.',reports:132,health:98,signals:'5K mailboxes',accent:'#5b82e6'},
  {name:'Microsoft Teams',family:'Collaboration',description:'Teams, channels, membership, meetings, messaging, apps, and external access.',reports:86,health:92,signals:'5.8K teams + channels',accent:'#9384e8'},
  {name:'SharePoint Online',family:'Content',description:'Sites, permissions, sharing, storage, activity, and governance posture.',reports:104,health:89,signals:'300 sites',accent:'#35b7a3'},
  {name:'OneDrive',family:'Content',description:'Personal storage, sharing links, external access, usage, and inactive content.',reports:61,health:94,signals:'5K drives',accent:'#55a9dc'},
  {name:'Microsoft Intune',family:'Endpoint',description:'Devices, compliance, applications, configuration profiles, and enrollment.',reports:93,health:91,signals:'7K devices',accent:'#4cb9ca'},
  {name:'Defender XDR',family:'Security',description:'Incidents, alerts, vulnerabilities, exposure, investigations, and response.',reports:76,health:95,signals:'100 incidents',accent:'#e56872'},
  {name:'Microsoft Purview',family:'Compliance',description:'Labels, DLP, retention, eDiscovery, insider risk, and audit evidence.',reports:72,health:93,signals:'24 controls',accent:'#b58add'},
  {name:'Licensing & Cost',family:'FinOps',description:'Subscriptions, assignments, service plans, activity, cost, and optimization.',reports:58,health:97,signals:'1.5K unused E5',accent:'#e4ad50'},
  {name:'Hybrid Active Directory',family:'Hybrid',description:'Domains, forests, users, computers, GPOs, synchronization, and replication.',reports:118,health:90,signals:'22.8K objects',accent:'#70a5d8'},
];

const reportSeed: Omit<CatalogueReport,'id'|'favorite'|'scheduled'>[] = [
  {name:'All licensed users',workload:'Microsoft Entra ID',category:'Users',description:'License assignments, service plans, account state, department, and activity.',rows:'5,000',updated:'2m'},
  {name:'Users without MFA registration',workload:'Microsoft Entra ID',category:'Authentication',description:'Members and guests missing an accepted multifactor authentication method.',rows:'401',updated:'2m'},
  {name:'Privileged users and authentication strength',workload:'Microsoft Entra ID',category:'Roles',description:'Active and eligible role holders with strongest registered authentication method.',rows:'186',updated:'2m'},
  {name:'Risky sign-ins by conditional access result',workload:'Microsoft Entra ID',category:'Sign-ins',description:'Risk detections, policy decisions, location, device, and authentication context.',rows:'1,842',updated:'4m'},
  {name:'Enterprise applications with expiring credentials',workload:'Microsoft Entra ID',category:'Applications',description:'Certificates and secrets approaching expiration with owners and usage.',rows:'37',updated:'12m'},
  {name:'Dynamic groups with processing errors',workload:'Microsoft Entra ID',category:'Groups',description:'Membership rules, processing state, owners, and recent changes.',rows:'14',updated:'6m'},
  {name:'Mailbox size and quota status',workload:'Exchange Online',category:'Mailboxes',description:'Mailbox size, archive usage, warning quota, prohibit-send quota, and growth.',rows:'5,000',updated:'6m'},
  {name:'Full access permissions outside department',workload:'Exchange Online',category:'Permissions',description:'Cross-department mailbox delegation and inheritance exceptions.',rows:'328',updated:'7m'},
  {name:'Mail forwarding to external domains',workload:'Exchange Online',category:'Mail flow',description:'Inbox rules and mailbox forwarding targeting external recipients.',rows:'49',updated:'5m'},
  {name:'Inactive shared mailboxes',workload:'Exchange Online',category:'Usage',description:'Shared mailboxes with no interactive or mail-flow activity for 90 days.',rows:'214',updated:'8m'},
  {name:'Anti-phishing policy coverage',workload:'Exchange Online',category:'Protection',description:'User and domain impersonation protection coverage with gaps.',rows:'27 policies',updated:'11m'},
  {name:'Teams with no owner',workload:'Microsoft Teams',category:'Governance',description:'Active teams without an accountable active owner.',rows:'86',updated:'5m'},
  {name:'Externally accessible teams',workload:'Microsoft Teams',category:'External access',description:'Teams containing guests, external shared channels, or federation exposure.',rows:'438',updated:'6m'},
  {name:'Teams usage by department',workload:'Microsoft Teams',category:'Adoption',description:'Meetings, chat, channel activity, calling, and active users by organization.',rows:'54 departments',updated:'1h'},
  {name:'Stale teams and channels',workload:'Microsoft Teams',category:'Lifecycle',description:'Teams and channels with no qualifying activity for configured periods.',rows:'612',updated:'19m'},
  {name:'Sites with Anyone sharing links',workload:'SharePoint Online',category:'Sharing',description:'Sites and content with active anonymous access links.',rows:'12 sites',updated:'7m'},
  {name:'Site collection administrators',workload:'SharePoint Online',category:'Permissions',description:'Primary and additional administrators with last activity and risk.',rows:'1,284',updated:'7m'},
  {name:'Storage growth by site',workload:'SharePoint Online',category:'Storage',description:'Current storage, 30/90-day growth, quota, sensitivity, and ownership.',rows:'4,316',updated:'22m'},
  {name:'Inactive sites with retained content',workload:'SharePoint Online',category:'Lifecycle',description:'Sites without activity that remain subject to retention or legal hold.',rows:'368',updated:'26m'},
  {name:'OneDrive external sharing inventory',workload:'OneDrive',category:'Sharing',description:'External users, links, domains, sensitivity labels, and expiration.',rows:'2,716',updated:'9m'},
  {name:'Former employee OneDrive ownership',workload:'OneDrive',category:'Lifecycle',description:'Departed-user drives, delegated owners, retention, and deletion dates.',rows:'81',updated:'14m'},
  {name:'Noncompliant managed devices',workload:'Microsoft Intune',category:'Compliance',description:'Compliance state, failed settings, primary user, ownership, and risk.',rows:'1,487',updated:'18m'},
  {name:'Devices without recent check-in',workload:'Microsoft Intune',category:'Inventory',description:'Managed devices beyond the configured check-in threshold.',rows:'692',updated:'18m'},
  {name:'Application deployment failures',workload:'Microsoft Intune',category:'Applications',description:'Failed application installations by app, error, device, and user.',rows:'319',updated:'21m'},
  {name:'Active Defender incidents',workload:'Defender XDR',category:'Incidents',description:'Correlated incidents, severity, entities, owner, status, and response SLA.',rows:'24',updated:'4m'},
  {name:'Vulnerable devices by exposure score',workload:'Defender XDR',category:'Vulnerability',description:'Device exposure, critical CVEs, exploit availability, and remediation.',rows:'1,108',updated:'15m'},
  {name:'DLP policy matches by sensitive type',workload:'Microsoft Purview',category:'DLP',description:'Policy matches, locations, sensitive information types, and disposition.',rows:'3,421',updated:'11m'},
  {name:'Retention assignment exceptions',workload:'Microsoft Purview',category:'Retention',description:'Regulated objects differing from approved retention baseline.',rows:'64',updated:'11m'},
  {name:'License assignments without activity',workload:'Licensing & Cost',category:'Optimization',description:'Assigned products with no qualifying workload activity by threshold.',rows:'1,463',updated:'35m'},
  {name:'Subscription capacity forecast',workload:'Licensing & Cost',category:'Forecasting',description:'Available units, consumption trend, renewal date, and projected demand.',rows:'31 SKUs',updated:'1h'},
  {name:'Directory synchronization errors',workload:'Hybrid Active Directory',category:'Synchronization',description:'Object synchronization, attribute, duplicate, and connector-space errors.',rows:'73',updated:'13m'},
  {name:'Inactive privileged AD accounts',workload:'Hybrid Active Directory',category:'Privileged access',description:'Domain and enterprise administrators without recent approved activity.',rows:'18',updated:'15m'},
];

const customerReportTemplates: CatalogueReport[] = [
  ['MFA Compliance Report','Microsoft Entra ID','Security','MFA registration, authentication strength, and Conditional Access coverage.','5,000'],
  ['Risk User Report','Microsoft Entra ID','Security','High, medium, and low-risk users with detections and recommendations.','450'],
  ['Admin Activity Report','Microsoft Entra ID','Security','Privileged role, sign-in, PIM, and administrative activity evidence.','1,284'],
  ['Inactive Users','Microsoft Entra ID','Identity','Inactive workforce accounts, last login, owner, license, and risk.','380'],
  ['Guest Users','Microsoft Entra ID','Identity','Guest identities, sponsors, access, activity, and expiry.','612'],
  ['Privileged Users','Microsoft Entra ID','Identity','Active and eligible privileged users with MFA and access-review state.','186'],
  ['License Usage','Licensing & Cost','License','Assigned, active, unused, and service-plan utilization.','5,000'],
  ['Cost Optimization','Licensing & Cost','License','Downgrade and reclaim candidates with modeled annual savings.','1,500'],
  ['ISO 27001 Report','Microsoft Purview','Compliance','ISO 27001 control readiness, evidence, owners, exceptions, and remediation.','24 controls'],
  ['CIS Benchmark Report','Microsoft Purview','Compliance','CIS Microsoft 365 benchmark posture and failed-object evidence.','24 controls'],
].map(([name,workload,category,description,rows],index)=>({id:`DEMO-${String(index+1).padStart(3,'0')}`,name,workload,category,description,rows,updated:'Live',favorite:index<4,scheduled:index%3===0}));

const generatedCatalogue: CatalogueReport[] = Array.from({length:96},(_,index)=>{
  const source=reportSeed[index%reportSeed.length];
  const cycle=Math.floor(index/reportSeed.length);
  return {...source,id:`RPT-${String(index+1).padStart(4,'0')}`,name:cycle?`${source.name} — ${['trend','exceptions'][cycle-1]}`:source.name,favorite:index%11===0,scheduled:index%7===0};
});
export const reportCatalogue: CatalogueReport[] = [...customerReportTemplates, ...generatedCatalogue];

export const auditActivities = [
  {time:'10:42:18',workload:'Entra ID',activity:'Add member to role',actor:'s.ibrahim@globalholdings.com',target:'Exchange Administrator',result:'Success',risk:'High',location:'Dubai, AE'},
  {time:'10:39:04',workload:'Exchange',activity:'New-InboxRule',actor:'l.chen@globalholdings.com',target:'Forward Treasury Alerts',result:'Success',risk:'Critical',location:'Singapore, SG'},
  {time:'10:35:51',workload:'SharePoint',activity:'AnonymousLinkCreated',actor:'n.almasi@globalholdings.com',target:'Project Falcon / Forecast.xlsx',result:'Success',risk:'High',location:'Dubai, AE'},
  {time:'10:28:12',workload:'Teams',activity:'MemberAdded',actor:'r.santos@globalholdings.com',target:'Infrastructure CAB',result:'Success',risk:'Low',location:'London, GB'},
  {time:'10:22:46',workload:'Intune',activity:'CompliancePolicyUpdated',actor:'d.okafor@globalholdings.com',target:'Windows Regulated Baseline',result:'Success',risk:'Medium',location:'Abu Dhabi, AE'},
  {time:'10:14:33',workload:'Purview',activity:'DLPRuleMatch',actor:'system',target:'Customer PII / OneDrive',result:'Blocked',risk:'High',location:'Workload'},
  {time:'10:07:19',workload:'Entra ID',activity:'UserLoginFailed',actor:'j.wilson_ext@globalholdings.com',target:'Azure Portal',result:'Failure',risk:'Medium',location:'Frankfurt, DE'},
  {time:'09:58:44',workload:'Exchange',activity:'Set-Mailbox',actor:'workflow-engine',target:'USR-108821',result:'Approved',risk:'Low',location:'Workload'},
];

export const managementActions = [
  {name:'Create or update user',area:'Identity lifecycle',risk:'Medium',approval:'Manager + IAM',objects:'Users',description:'Provision identity attributes, manager, usage location, groups, and licenses.'},
  {name:'Reset authentication methods',area:'Identity security',risk:'High',approval:'Security Admin',objects:'Users',description:'Require authentication re-registration and revoke existing methods.'},
  {name:'Assign Microsoft 365 licenses',area:'Licensing',risk:'Medium',approval:'FinOps policy',objects:'Users',description:'Add or remove SKUs and service plans with dependency validation.'},
  {name:'Manage group membership',area:'Groups',risk:'Medium',approval:'Group owner',objects:'Groups',description:'Bulk add/remove members with dynamic-group and privilege safeguards.'},
  {name:'Convert mailbox type',area:'Exchange',risk:'High',approval:'Exchange Admin',objects:'Mailboxes',description:'Convert user/shared/room mailboxes with license preflight checks.'},
  {name:'Grant mailbox delegation',area:'Exchange',risk:'High',approval:'Data owner',objects:'Mailboxes',description:'Grant Full Access, Send As, or Send on Behalf with expiry.'},
  {name:'Create Microsoft Team',area:'Collaboration',risk:'Low',approval:'Business owner',objects:'Teams',description:'Create from governed template with sensitivity and lifecycle policy.'},
  {name:'Archive inactive team',area:'Collaboration',risk:'Medium',approval:'Team owner',objects:'Teams',description:'Archive team, preserve content, and record governance evidence.'},
  {name:'Change site sharing policy',area:'SharePoint',risk:'High',approval:'Data Governance',objects:'Sites',description:'Apply approved external-sharing level and guest expiration.'},
  {name:'Retire stale device',area:'Endpoint',risk:'High',approval:'Endpoint Admin',objects:'Devices',description:'Retire or wipe managed device after ownership and legal-hold checks.'},
  {name:'Revoke user sessions',area:'Incident response',risk:'High',approval:'Security Admin',objects:'Users',description:'Revoke refresh tokens and active sessions across Microsoft 365.'},
  {name:'Apply retention policy',area:'Compliance',risk:'High',approval:'Compliance Admin',objects:'Content',description:'Assign retention label or policy with immutable change evidence.'},
];

export const adoption = [
  {service:'Exchange Online',active:4620,eligible:5000,adoption:92,trend:1.1,depth:92},
  {service:'Microsoft Teams',active:4350,eligible:5000,adoption:87,trend:3.8,depth:76},
  {service:'SharePoint Online',active:3700,eligible:5000,adoption:74,trend:2.4,depth:68},
  {service:'OneDrive',active:4150,eligible:5000,adoption:83,trend:1.7,depth:72},
  {service:'Viva Engage',active:1300,eligible:5000,adoption:26,trend:-1.2,depth:21},
  {service:'Power BI',active:1018,eligible:1400,adoption:73,trend:4.1,depth:79},
];

export const governanceRequests = [
  {id:'GOV-2841',type:'Team creation',requester:'Mariam Hassan',resource:'Private Wealth Advisory',stage:'Owner approval',age:'2h',risk:'Low'},
  {id:'GOV-2838',type:'External sharing',requester:'Nadia Almasi',resource:'Project Falcon Data Room',stage:'Security review',age:'5h',risk:'High'},
  {id:'GOV-2831',type:'Guest extension',requester:'Omar Rahman',resource:'James Wilson (External Audit)',stage:'Sponsor attestation',age:'1d',risk:'Medium'},
  {id:'GOV-2822',type:'Site retention exception',requester:'Amira Malik',resource:'Regulatory Investigation 24-18',stage:'Compliance approval',age:'2d',risk:'High'},
  {id:'GOV-2814',type:'Application consent',requester:'Robert Santos',resource:'Infrastructure Inventory Agent',stage:'Privacy review',age:'3d',risk:'Medium'},
];

export const alertPolicies = [
  {name:'Privileged role assignment outside PIM',category:'Identity',severity:'Critical',channels:'SOC · Teams · SMS',matches:3,state:'Enabled',latency:'< 2m'},
  {name:'Anonymous link on confidential content',category:'Data',severity:'High',channels:'Data Governance · Email',matches:12,state:'Enabled',latency:'< 5m'},
  {name:'License capacity below 5 percent',category:'FinOps',severity:'Medium',channels:'IT Finance · Email',matches:1,state:'Enabled',latency:'Daily'},
  {name:'Mailbox forwarding to new external domain',category:'Exchange',severity:'High',channels:'SOC · ServiceNow',matches:7,state:'Enabled',latency:'< 5m'},
  {name:'Device compliance below 90 percent',category:'Endpoint',severity:'High',channels:'Endpoint Operations',matches:1,state:'Enabled',latency:'Hourly'},
  {name:'Connector collection lag exceeds SLA',category:'Platform',severity:'Medium',channels:'Platform Operations',matches:2,state:'Enabled',latency:'< 2m'},
];

export const reminderAgents = [
  {name:'MFA registration campaign',audience:'401 users',cadence:'Day 0, 3, 7, 12',completion:76,owner:'Identity Operations',next:'Today 14:00'},
  {name:'Guest sponsor recertification',audience:'184 sponsors',cadence:'Weekly until expiry',completion:68,owner:'Data Governance',next:'Tomorrow 09:00'},
  {name:'License usage validation',audience:'1,463 managers',cadence:'Day 0, 5, 10',completion:41,owner:'FinOps',next:'Today 16:00'},
  {name:'Security training follow-up',audience:'212 users',cadence:'Weekly',completion:88,owner:'Security Awareness',next:'Friday 10:00'},
  {name:'Access review escalation',audience:'47 reviewers',cadence:'3 days before due',completion:92,owner:'IAM Governance',next:'18 Jul 08:00'},
];

export const delegatedRoles = [
  {name:'Regional Helpdesk — UAE',members:18,scope:'UAE users and devices',permissions:'12 actions · 28 reports',expires:'Quarterly review',risk:'Low'},
  {name:'SOC Tier 1 Analysts',members:24,scope:'Security incidents and audit',permissions:'8 actions · 42 reports',expires:'Monthly review',risk:'Medium'},
  {name:'License Coordinators',members:11,scope:'Assigned business units',permissions:'3 actions · 16 reports',expires:'Quarterly review',risk:'Low'},
  {name:'External Compliance Auditors',members:6,scope:'Evidence packs only',permissions:'0 actions · 31 reports',expires:'30 Sep 2026',risk:'Medium'},
  {name:'Data Governance Stewards',members:14,scope:'SharePoint and OneDrive',permissions:'7 actions · 37 reports',expires:'Quarterly review',risk:'Medium'},
];

export const hybridHealth = [
  {name:'APEXFG.COM',type:'Forest root',controllers:8,objects:'18,642',replication:'Healthy',sync:'4m'},
  {name:'EMEA.APEXFG.COM',type:'Child domain',controllers:6,objects:'9,184',replication:'Warning',sync:'11m'},
  {name:'APAC.APEXFG.COM',type:'Child domain',controllers:4,objects:'5,628',replication:'Healthy',sync:'7m'},
  {name:'LAB.APEXFG.COM',type:'Isolated domain',controllers:2,objects:'842',replication:'Healthy',sync:'18m'},
];

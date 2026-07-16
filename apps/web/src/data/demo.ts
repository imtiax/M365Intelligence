export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Finding = {
  id: string; title: string; category: string; severity: Severity; riskScore: number; affected: number;
  impact: string; recommendation: string; status: 'Active' | 'Investigating' | 'Remediating' | 'Accepted';
  owner: string; evidence: string; framework: string[]; automation: boolean;
};

export const tenant = { name: 'Northstar Example Group', short: 'NE', region: '25 countries', industry: 'Logistics · Manufacturing · Financial Services', users: 5000, demoDate: '16 Jul 2026' };

export const findings: Finding[] = [
  { id:'FND-1042', title:'Privileged identities lack phishing-resistant MFA', category:'Identity', severity:'critical', riskScore:96, affected:45, impact:'Administrator accounts remain exposed to credential phishing and token theft.', recommendation:'Complete FIDO2 registration and enforce authentication strength through staged Conditional Access.', status:'Active', owner:'Identity Operations', evidence:'45 of 186 privileged identities do not meet the authentication-strength policy.', framework:['CIS 5.2','NIST PR.AA-02'], automation:true },
  { id:'FND-1038', title:'Unmanaged external sharing remains enabled', category:'Data protection', severity:'high', riskScore:82, affected:12, impact:'Confidential deal and customer content can be accessed from unmanaged identities and devices.', recommendation:'Validate approved exceptions, enforce guest expiry, and restrict sharing domains.', status:'Investigating', owner:'Data Governance', evidence:'12 SharePoint sites permit Anyone links; 4 contain Confidential-labeled documents.', framework:['ISO A.5.14','GDPR Art. 32'], automation:true },
  { id:'FND-1034', title:'Users operate exclusively from noncompliant devices', category:'Endpoint', severity:'high', riskScore:79, affected:23, impact:'Corporate services are accessible from endpoints below the regulated security baseline.', recommendation:'Remediate device health and stage compliant-device access enforcement.', status:'Remediating', owner:'Endpoint Security', evidence:'23 active identities have no compliant managed device registered during the last 30 days.', framework:['CIS 1.1','NIST PR.PS-01'], automation:false },
  { id:'FND-1029', title:'Dormant E5 assignments show no qualifying activity', category:'Licensing', severity:'medium', riskScore:58, affected:87, impact:'Approximately $4,957 of subscription value may be recoverable each month.', recommendation:'Review leave, service-account, and legal-hold exceptions before reclaiming licenses.', status:'Active', owner:'FinOps', evidence:'87 E5 assignments have no Exchange, Teams, Office, or Defender activity for 90 days.', framework:['FIN-OPT-03'], automation:true },
  { id:'FND-1021', title:'Legacy authentication observed in production', category:'Identity', severity:'high', riskScore:76, affected:31, impact:'Password spray and MFA bypass risk persists through legacy protocols.', recommendation:'Confirm application owners, migrate protocol usage, then block legacy authentication.', status:'Investigating', owner:'SOC Tier 2', evidence:'318 legacy authentication attempts from 31 identities over the last seven days.', framework:['CIS 1.3','NIST PR.AA-03'], automation:true },
  { id:'FND-1014', title:'Retention policy drift across regulated mailboxes', category:'Compliance', severity:'medium', riskScore:63, affected:64, impact:'Required correspondence may not be retained consistently for regulatory discovery.', recommendation:'Restore the approved seven-year retention assignment and validate preservation.', status:'Remediating', owner:'Compliance Office', evidence:'64 regulated mailboxes differ from policy baseline v4.2.', framework:['ISO A.5.33','SOC2 CC7.4'], automation:true },
];

export const riskTrend = [
  {label:'Feb',score:66,alerts:238},{label:'Mar',score:69,alerts:214},{label:'Apr',score:68,alerts:247},
  {label:'May',score:78,alerts:191},{label:'Jun',score:83,alerts:164},{label:'Jul',score:87,alerts:100},
];

export const securitySignals = [
  {time:'09:42',type:'Impossible travel',entity:'n.almasi@northstar.example',source:'Entra ID Protection',severity:'High',state:'Investigating'},
  {time:'09:18',type:'Mass download',entity:'Project Falcon / Finance',source:'Defender for Cloud Apps',severity:'High',state:'Contained'},
  {time:'08:54',type:'Role elevation',entity:'r.santos@northstar.example',source:'Entra PIM',severity:'Medium',state:'Approved'},
  {time:'08:31',type:'Malicious inbox rule',entity:'l.chen@northstar.example',source:'Defender for Office 365',severity:'Critical',state:'Remediated'},
  {time:'07:48',type:'Anonymous sharing link',entity:'M&A Data Room',source:'SharePoint Online',severity:'High',state:'Open'},
];

export const identities = [
  {name:'Nadia Almasi',upn:'n.almasi@northstar.example',department:'Private Banking',risk:'High',mfa:'FIDO2',activity:'3m ago',licenses:'E5 + Power BI'},
  {name:'Robert Santos',upn:'r.santos@northstar.example',department:'Infrastructure',risk:'Medium',mfa:'Authenticator',activity:'12m ago',licenses:'E5'},
  {name:'Li Chen',upn:'l.chen@northstar.example',department:'Treasury',risk:'High',mfa:'Authenticator',activity:'24m ago',licenses:'E5 + Visio'},
  {name:'Amira Malik',upn:'a.malik@northstar.example',department:'Compliance',risk:'Low',mfa:'FIDO2',activity:'1h ago',licenses:'E5 + Power BI'},
  {name:'James Wilson',upn:'j.wilson_ext@northstar.example',department:'External Audit',risk:'Medium',mfa:'SMS',activity:'2d ago',licenses:'Guest'},
];

export const departments = [
  {name:'Corporate Banking',users:2840,risky:18,coverage:96},{name:'Retail Banking',users:3760,risky:29,coverage:94},
  {name:'Technology',users:1980,risky:11,coverage:98},{name:'Operations',users:2240,risky:22,coverage:93},
  {name:'Risk & Compliance',users:820,risky:4,coverage:99},{name:'Corporate Functions',users:840,risky:8,coverage:97},
];

export const controls = [
  {framework:'ISO 27001:2022',score:88,passed:82,failed:7,evidence:94,status:'On track'},
  {framework:'NIST CSF 2.0',score:83,passed:91,failed:12,evidence:89,status:'On track'},
  {framework:'CIS Microsoft 365',score:79,passed:63,failed:14,evidence:100,status:'Attention'},
  {framework:'SOC 2',score:91,passed:54,failed:3,evidence:96,status:'On track'},
  {framework:'GDPR',score:86,passed:38,failed:5,evidence:92,status:'On track'},
];

export const failedControls = [
  {id:'CIS-1.1.3',name:'Ensure multifactor authentication for all privileged users',framework:'CIS',owner:'Identity Operations',due:'18 Jul',severity:'Critical'},
  {id:'ISO-A.5.14',name:'Information transfer controls for external sharing',framework:'ISO 27001',owner:'Data Governance',due:'22 Jul',severity:'High'},
  {id:'NIST-PR.PS-01',name:'Configuration management practices established',framework:'NIST CSF',owner:'Endpoint Security',due:'26 Jul',severity:'High'},
  {id:'SOC2-CC7.4',name:'Incident response and retention exceptions',framework:'SOC 2',owner:'Compliance Office',due:'30 Jul',severity:'Medium'},
];

export const licenses = [
  {sku:'Microsoft 365 E5',purchased:10000,assigned:9632,active:9197,waste:435,monthly:24990,utilization:95},
  {sku:'Power BI Pro',purchased:2600,assigned:2438,active:2014,waste:424,monthly:5936,utilization:83},
  {sku:'Visio Plan 2',purchased:850,assigned:782,active:541,waste:241,monthly:3615,utilization:69},
  {sku:'Project Plan 3',purchased:620,assigned:588,active:407,waste:181,monthly:5430,utilization:69},
  {sku:'Teams Premium',purchased:1200,assigned:1098,active:916,waste:182,monthly:1820,utilization:83},
];

export const twinObjects = [
  {type:'Users',count:'12,480',change:'+64',health:98,icon:'people'},{type:'Groups',count:'3,246',change:'+31',health:96,icon:'groups'},
  {type:'Devices',count:'18,921',change:'+214',health:92,icon:'devices'},{type:'Applications',count:'1,108',change:'+8',health:95,icon:'apps'},
  {type:'Teams',count:'2,842',change:'+19',health:91,icon:'teams'},{type:'SharePoint sites',count:'4,316',change:'+27',health:89,icon:'sites'},
  {type:'Mailboxes',count:'12,106',change:'+42',health:99,icon:'mail'},{type:'Policies',count:'486',change:'3 drifted',health:94,icon:'policy'},
];

export const relationships = [
  {from:'Nadia Almasi',relation:'MEMBER_OF',to:'Private Banking Leadership',risk:'High'},
  {from:'Private Banking Leadership',relation:'ASSIGNED_ROLE',to:'SharePoint Site Owner',risk:'Medium'},
  {from:'M&A Data Room',relation:'SHARED_WITH',to:'External Audit Guests',risk:'High'},
  {from:'Finance CA Policy',relation:'PROTECTS',to:'Microsoft 365 E5 Users',risk:'Low'},
  {from:'Windows-APX-4421',relation:'PRIMARY_DEVICE',to:'Robert Santos',risk:'Medium'},
];

export const reports = [
  {name:'Board Cyber Risk Briefing',type:'Executive',schedule:'Monthly · 1st',owner:'CISO Office',last:'01 Jul 2026',status:'Delivered',pages:18},
  {name:'UAE Regulatory Compliance Pack',type:'Compliance',schedule:'Quarterly',owner:'Compliance Office',last:'30 Jun 2026',status:'Delivered',pages:64},
  {name:'Identity Risk Operations',type:'Security',schedule:'Every Monday',owner:'IAM Team',last:'13 Jul 2026',status:'Delivered',pages:12},
  {name:'License Optimization Review',type:'FinOps',schedule:'Monthly · 15th',owner:'IT Finance',last:'15 Jul 2026',status:'Ready',pages:9},
  {name:'External Sharing Exceptions',type:'Governance',schedule:'Weekly',owner:'Data Governance',last:'12 Jul 2026',status:'Attention',pages:7},
];

export const workflows = [
  {name:'Inactive user remediation',trigger:'Inactive user detected',runs:380,success:98.9,savings:'$150K annual',state:'Active',steps:['Risk analysis','Approval request','Disable account simulation','Remove license','Generate audit record']},
  {name:'High-risk sign-in response',trigger:'Identity risk = High',runs:47,success:95.7,savings:'—',state:'Active',steps:['Enrich context','SOC approval','Revoke sessions','Require secure password reset','Close alert']},
  {name:'Guest access recertification',trigger:'Guest age > 180 days',runs:612,success:97.2,savings:'—',state:'Active',steps:['Identify sponsor','Request review','Wait 7 days','Remove access','Record evidence']},
  {name:'License reclamation',trigger:'No activity 90 days',runs:329,success:99.1,savings:'$18.7K',state:'Active',steps:['Validate signals','Check exclusions','FinOps approval','Remove SKU','Notify manager']},
  {name:'External sharing containment',trigger:'Anonymous link detected',runs:76,success:93.4,savings:'—',state:'Paused',steps:['Classify content','Notify owner','Security approval','Expire link','Validate access']},
];

export const auditEvents = [
  {time:'10:02:14',actor:'Alex Morgan',action:'REPORT.EXPORT',object:'Board Cyber Risk Briefing',result:'Success',ip:'10.24.18.42'},
  {time:'09:58:31',actor:'Workflow Engine',action:'LICENSE.REMOVE',object:'USR-108821 / E5',result:'Approved',ip:'workload-id'},
  {time:'09:46:05',actor:'Sara Ibrahim',action:'FINDING.ASSIGN',object:'FND-1042',result:'Success',ip:'10.24.32.19'},
  {time:'09:31:52',actor:'Graph Collector',action:'SYNC.COMPLETE',object:'Entra ID delta',result:'12,480 objects',ip:'workload-id'},
  {time:'09:17:22',actor:'David Okafor',action:'POLICY.CHANGE',object:'CA-Finance-v4',result:'Pending approval',ip:'10.24.8.104'},
];

export const connectors = [
  {name:'Microsoft Entra ID',scope:'Users, groups, roles, sign-ins',status:'Healthy',sync:'2m',objects:'18,642'},
  {name:'Microsoft Defender XDR',scope:'Alerts, incidents, vulnerabilities',status:'Healthy',sync:'4m',objects:'2,184'},
  {name:'Microsoft Intune',scope:'Devices, compliance, applications',status:'Delayed',sync:'18m',objects:'31,506'},
  {name:'Exchange Online',scope:'Mailboxes, activity, configuration',status:'Healthy',sync:'6m',objects:'14,821'},
  {name:'SharePoint & OneDrive',scope:'Sites, sharing, permissions',status:'Healthy',sync:'7m',objects:'42,318'},
  {name:'Microsoft Purview',scope:'Labels, DLP, retention, audit',status:'Healthy',sync:'11m',objects:'8,742'},
];

export const aiPrompts = [
  'Show me security problems',
  'Why did our security posture change this month?',
  'Show privileged users without phishing-resistant MFA',
  'Summarize license savings for the CFO',
  'Create a board-ready cyber risk briefing',
];

export const aiAnswer = {
  summary:'Security posture improved by 3 points to 78, primarily because legacy authentication attempts fell 41% and 192 devices returned to compliance. Two material risks remain open.',
  insights:[
    '45 privileged identities still lack phishing-resistant MFA; this is the highest weighted exposure.',
    'Anonymous sharing remains enabled on 12 sites, including 4 containing Confidential-labeled documents.',
    'License optimization identified $41,791 in potential monthly savings across five SKUs.',
  ],
  sources:['Finding FND-1042 · observed 08:14','Conditional Access baseline v4.2','License activity snapshot · 15 Jul 2026'],
};

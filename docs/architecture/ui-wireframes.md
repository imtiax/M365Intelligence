# UI/UX architecture and wireframes

The information architecture follows user decisions: understand posture, investigate evidence, assign or remediate, then prove the outcome. Global navigation contains Command Center, Security, Identity, Compliance, Licenses, Digital Twin, Reports, Automations, AI Analyst, and Administration. Visibility is role driven.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Tenant switcher  Search / ask AI                     alerts  profile │
├──────────────┬───────────────────────────────────────────────────────┤
│ Command      │ Command Center                     Last sync 2m ago   │
│ Security     │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│ Identity     │ │Posture │ │Critical│ │Savings │ │Controls│          │
│ Compliance   │ └────────┘ └────────┘ └────────┘ └────────┘          │
│ Licenses     │ ┌───────────────────────┐ ┌───────────────────────┐  │
│ Digital twin │ │ Risk trend            │ │ Priority findings     │  │
│ Reports      │ │ chart                 │ │ severity / impact     │  │
│ Automations  │ └───────────────────────┘ └───────────────────────┘  │
│ AI Analyst   │ ┌──────────────────────────────────────────────────┐ │
│ Admin        │ │ Tenant health / connectors / collection lag      │ │
│              │ └──────────────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────────────┘
```

Finding detail uses a three-column progressive layout: risk and business explanation; affected resources/evidence/history; recommended action and controlled workflow. Color is never the only severity cue. Keyboard navigation, visible focus, semantic landmarks, reduced motion, 200% zoom, and WCAG 2.2 AA contrast are release requirements.

Dashboard widgets use a constrained responsive grid and persist per role/user. Dragging has keyboard alternatives. Exported charts carry text summaries. Dark and light themes use design tokens aligned with Fluent UI rather than hard-coded colors.


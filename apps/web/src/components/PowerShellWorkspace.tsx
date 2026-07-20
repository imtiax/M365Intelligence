"use client";

import { useMemo, useState } from "react";
import { ClipboardTask24Regular, Copy24Regular, Play24Regular, Save24Regular, ShieldCheckmark24Regular } from "@fluentui/react-icons";
import { tables } from "@/data/portal";

type Persona = "Modern workplace" | "Intune" | "Exchange" | "Identity" | "Security";
type Command = {
  id: string;
  persona: Persona;
  title: string;
  modules: string;
  description: string;
  command: string;
  preview: () => string[];
};

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

function downloadScript(name: string, body: string) {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

const commandCatalog: Command[] = [
  {
    id: "group-owners", persona: "Modern workplace", title: "Find ownerless Microsoft 365 groups", modules: "Microsoft.Graph.Groups",
    description: "Prioritise groups that have no accountable owner before access and lifecycle reviews.",
    command: `Connect-MgGraph -Scopes 'Group.Read.All','Directory.Read.All'\nGet-MgGroup -All -Filter "groupTypes/any(c:c eq 'Unified')" | ForEach-Object {\n  $owners = Get-MgGroupOwner -GroupId $_.Id -All\n  if (-not $owners) { [pscustomobject]@{ DisplayName=$_.DisplayName; Id=$_.Id; Mail=$_.Mail } }\n} | Export-Csv .\\Ownerless-M365Groups.csv -NoTypeInformation`,
    preview: () => tables.teams.filter((group) => Number(group.owners) === 0).slice(0, 6).map((group) => `${group.teamName} | ${group.privacy} | ${group.members} members | no owners`),
  },
  {
    id: "group-members", persona: "Modern workplace", title: "Export group owners and members", modules: "Microsoft.Graph.Groups",
    description: "Creates auditable membership evidence for a specified group, including owner/member role.",
    command: `Connect-MgGraph -Scopes 'GroupMember.Read.All','Group.Read.All'\n$group = Get-MgGroup -Filter "displayName eq 'Finance Leadership'"\nGet-MgGroupMember -GroupId $group.Id -All | ForEach-Object {\n  [pscustomobject]@{ Group=$group.DisplayName; MemberId=$_.Id; MemberType=$_.AdditionalProperties['@odata.type'] }\n} | Export-Csv .\\Group-Members.csv -NoTypeInformation`,
    preview: () => tables.groupMembers.filter((member) => member.membershipRole === "Owner").slice(0, 6).map((member) => `${member.groupName} | ${member.memberName} | Owner | ${member.memberType}`),
  },
  {
    id: "intune-stale", persona: "Intune", title: "Find stale Intune devices", modules: "Microsoft.Graph.DeviceManagement",
    description: "Lists managed devices that have not checked in recently for validation before retire or wipe decisions.",
    command: `Connect-MgGraph -Scopes 'DeviceManagementManagedDevices.Read.All'\nGet-MgDeviceManagementManagedDevice -All | Where-Object {\n  $_.LastSyncDateTime -lt (Get-Date).AddDays(-30)\n} | Select-Object DeviceName,UserPrincipalName,OperatingSystem,ComplianceState,LastSyncDateTime |\n  Export-Csv .\\Stale-IntuneDevices.csv -NoTypeInformation`,
    preview: () => tables.devices.filter((device) => Number(device.staleDays) > 30).slice(0, 6).map((device) => `${device.deviceName} | ${device.os} | ${device.compliance} | ${device.staleDays} days since check-in`),
  },
  {
    id: "exo-forwarding", persona: "Exchange", title: "Review mailbox forwarding", modules: "ExchangeOnlineManagement",
    description: "Exports mailboxes with forwarding destinations; investigate external destinations and documented exceptions.",
    command: `Connect-ExchangeOnline\nGet-EXOMailbox -ResultSize Unlimited -Properties ForwardingSmtpAddress,DeliverToMailboxAndForward |\n  Where-Object { $_.ForwardingSmtpAddress } |\n  Select-Object DisplayName,PrimarySmtpAddress,ForwardingSmtpAddress,DeliverToMailboxAndForward |\n  Export-Csv .\\Mailbox-Forwarding.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: () => tables.mailboxes.filter((mailbox) => String(mailbox.forwardingTo) !== "—").slice(0, 6).map((mailbox) => `${mailbox.displayName} | ${mailbox.upn} | forwards to ${mailbox.forwardingTo}`),
  },
  {
    id: "exo-dl-members", persona: "Exchange", title: "Export distribution group members", modules: "ExchangeOnlineManagement",
    description: "Produces a membership extract for a distribution group with a repeatable local CSV output.",
    command: `Connect-ExchangeOnline\nGet-DistributionGroupMember -Identity 'DL - Finance All' -ResultSize Unlimited |\n  Select-Object DisplayName,PrimarySmtpAddress,RecipientTypeDetails |\n  Export-Csv .\\DistributionGroup-Members.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: () => tables.groupMembers.filter((member) => member.groupType === "Distribution group").slice(0, 6).map((member) => `${member.groupName} | ${member.memberName} | ${member.memberUpn}`),
  },
  {
    id: "identity-admins", persona: "Identity", title: "Review privileged role members", modules: "Microsoft.Graph.Identity.Governance",
    description: "Exports active directory-role assignments for privileged access review and MFA validation.",
    command: `Connect-MgGraph -Scopes 'RoleManagement.Read.Directory','Directory.Read.All'\nGet-MgDirectoryRole -All | ForEach-Object {\n  $role = $_\n  Get-MgDirectoryRoleMember -DirectoryRoleId $role.Id -All |\n    Select-Object @{N='Role';E={$role.DisplayName}},Id,AdditionalProperties\n} | Export-Csv .\\Privileged-RoleMembers.csv -NoTypeInformation`,
    preview: () => tables.users.filter((user) => String(user.adminRole) !== "—").slice(0, 6).map((user) => `${user.displayName} | ${user.adminRole} | MFA ${user.mfaStatus} | ${user.lastSignIn}`),
  },
  {
    id: "audit-membership", persona: "Security", title: "Search group membership changes", modules: "ExchangeOnlineManagement / Purview",
    description: "Queries the Unified Audit Log for group membership changes over the previous seven days.",
    command: `Connect-ExchangeOnline\nSearch-UnifiedAuditLog -StartDate (Get-Date).AddDays(-7) -EndDate (Get-Date) -Operations AddMemberToGroup,RemoveMemberFromGroup -ResultSize 5000 |\n  Select-Object CreationDate,UserIds,Operations,AuditData |\n  Export-Csv .\\Group-MembershipAudit.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: () => tables.auditEvents.filter((event) => /member.*group/i.test(String(event.operation))).slice(0, 6).map((event) => `${event.time} | ${event.operation} | ${event.actor} | ${event.target}`),
  },
];

export function PowerShellWorkspace({ notify }: { notify: (message: string) => void }) {
  const [persona, setPersona] = useState<Persona>("Modern workplace");
  const commands = useMemo(() => commandCatalog.filter((command) => command.persona === persona), [persona]);
  const [selectedId, setSelectedId] = useState(commandCatalog[0].id);
  const selected = commandCatalog.find((command) => command.id === selectedId) ?? commandCatalog[0];
  const preview = selected.preview();
  const select = (id: string) => setSelectedId(id);

  return (
    <section className="pr-powershell" data-testid="portal-powershell">
      <header className="pr-page-head">
        <div>
          <h1>PowerShell workspace</h1>
          <p>Role-aware command runbooks for repeatable Microsoft 365 administration. Copy or download commands for your approved local PowerShell environment; the preview below is synthetic and never executes against a tenant.</p>
        </div>
        <span className="pr-safety"><ShieldCheckmark24Regular /> Local execution only · no tenant command is run by this browser</span>
      </header>
      <div className="pr-personas" role="tablist" aria-label="Administrator role">
        {(["Modern workplace", "Intune", "Exchange", "Identity", "Security"] as Persona[]).map((item) => <button key={item} className={persona === item ? "pr-on" : ""} onClick={() => { setPersona(item); const first = commandCatalog.find((command) => command.persona === item); if (first) select(first.id); }} role="tab" aria-selected={persona === item} data-testid={`portal-ps-persona-${item.toLowerCase().replaceAll(" ", "-")}`}>{item}</button>)}
      </div>
      <div className="pr-powershell-layout">
        <aside className="pr-command-list">
          {commands.map((command) => <button key={command.id} className={selected.id === command.id ? "pr-active" : ""} onClick={() => select(command.id)} data-testid={`portal-ps-${command.id}`}><ClipboardTask24Regular /><span><b>{command.title}</b><small>{command.modules}</small></span></button>)}
        </aside>
        <article className="pr-command-detail">
          <span className="pr-kicker">{selected.persona.toUpperCase()} RUNBOOK</span>
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
          <div className="pr-command-actions">
            <button className="pr-btn" onClick={() => void copy(selected.command).then((ok) => notify(ok ? "PowerShell command copied to clipboard." : "Copy was blocked by this browser."))} data-testid="portal-ps-copy"><Copy24Regular /> Copy command</button>
            <button className="pr-btn" onClick={() => { downloadScript(`${selected.id}.ps1`, `${selected.command}\n`); notify("PowerShell runbook downloaded."); }} data-testid="portal-ps-download"><Save24Regular /> Download .ps1</button>
            <button className="pr-btn pr-primary" onClick={() => notify("Synthetic preview refreshed; no tenant command was executed.")} data-testid="portal-ps-preview"><Play24Regular /> Run synthetic preview</button>
          </div>
          <pre className="pr-command-code"><code>{selected.command}</code></pre>
          <div className="pr-command-output" data-testid="portal-ps-output"><header><span>SIMULATED LOCAL OUTPUT</span><b>{preview.length} records shown</b></header>{preview.length ? preview.map((line) => <code key={line}>{line}</code>) : <p>No synthetic records matched. The runbook remains available for a connected tenant.</p>}</div>
        </article>
      </div>
    </section>
  );
}

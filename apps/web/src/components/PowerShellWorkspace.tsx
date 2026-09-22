"use client";

import { useMemo, useState } from "react";
import { ArrowRight24Regular, ClipboardTask24Regular, Copy24Regular, Play24Regular, Save24Regular, ShieldCheckmark24Regular } from "@fluentui/react-icons";
import { tables } from "@/data/portal";

type Persona = "Modern workplace" | "Licensing & FinOps" | "Intune" | "Exchange" | "Collaboration" | "Identity" | "Security";
type Command = {
  id: string;
  persona: Persona;
  title: string;
  modules: string;
  description: string;
  reportId: string;
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

const preview = {
  users: (predicate: (row: Record<string, unknown>) => boolean, format: (row: Record<string, unknown>) => string) => () => tables.users.filter(predicate).slice(0, 6).map(format),
  mailboxes: (predicate: (row: Record<string, unknown>) => boolean, format: (row: Record<string, unknown>) => string) => () => tables.mailboxes.filter(predicate).slice(0, 6).map(format),
  teams: (predicate: (row: Record<string, unknown>) => boolean, format: (row: Record<string, unknown>) => string) => () => tables.teams.filter(predicate).slice(0, 6).map(format),
  sites: (predicate: (row: Record<string, unknown>) => boolean, format: (row: Record<string, unknown>) => string) => () => tables.sites.filter(predicate).slice(0, 6).map(format),
  drives: (predicate: (row: Record<string, unknown>) => boolean, format: (row: Record<string, unknown>) => string) => () => tables.drives.filter(predicate).slice(0, 6).map(format),
  devices: (predicate: (row: Record<string, unknown>) => boolean, format: (row: Record<string, unknown>) => string) => () => tables.devices.filter(predicate).slice(0, 6).map(format),
  members: (predicate: (row: Record<string, unknown>) => boolean, format: (row: Record<string, unknown>) => string) => () => tables.groupMembers.filter(predicate).slice(0, 6).map(format),
  signIns: (predicate: (row: Record<string, unknown>) => boolean, format: (row: Record<string, unknown>) => string) => () => tables.signIns.filter(predicate).slice(0, 6).map(format),
  audit: (predicate: (row: Record<string, unknown>) => boolean, format: (row: Record<string, unknown>) => string) => () => tables.auditEvents.filter(predicate).slice(0, 6).map(format),
};

// These are original, read-only runbooks. They are intentionally designed for
// approved local execution and map back to the same evidence reports in Aegis.
const commandCatalog: Command[] = [
  {
    id: "group-owners", persona: "Modern workplace", title: "Find ownerless Microsoft 365 groups", modules: "Microsoft.Graph.Groups", reportId: "entra-m365-groups",
    description: "Prioritise groups with no accountable owner before access and lifecycle reviews.",
    command: `Connect-MgGraph -Scopes 'Group.Read.All','Directory.Read.All'\nGet-MgGroup -All -Filter "groupTypes/any(c:c eq 'Unified')" | ForEach-Object {\n  $owners = Get-MgGroupOwner -GroupId $_.Id -All\n  if (-not $owners) { [pscustomobject]@{ DisplayName=$_.DisplayName; Id=$_.Id; Mail=$_.Mail } }\n} | Export-Csv .\\Ownerless-M365Groups.csv -NoTypeInformation`,
    preview: preview.teams((group) => Number(group.owners) === 0, (group) => `${group.teamName} | ${group.privacy} | ${group.members} members | no owners`),
  },
  {
    id: "group-members", persona: "Modern workplace", title: "Export group owners and members", modules: "Microsoft.Graph.Groups", reportId: "entra-group-members",
    description: "Creates auditable membership evidence for a specified group, including owner/member role.",
    command: `Connect-MgGraph -Scopes 'GroupMember.Read.All','Group.Read.All'\n$group = Get-MgGroup -Filter "displayName eq 'Finance Leadership'"\nGet-MgGroupMember -GroupId $group.Id -All | ForEach-Object {\n  [pscustomobject]@{ Group=$group.DisplayName; MemberId=$_.Id; MemberType=$_.AdditionalProperties['@odata.type'] }\n} | Export-Csv .\\Group-Members.csv -NoTypeInformation`,
    preview: preview.members((member) => member.membershipRole === "Owner", (member) => `${member.groupName} | ${member.memberName} | Owner | ${member.memberType}`),
  },
  {
    id: "group-guest-members", persona: "Modern workplace", title: "Review guest members in groups", modules: "Microsoft.Graph.Groups", reportId: "entra-group-members",
    description: "Exports external identities found in Microsoft 365 and distribution group membership evidence.",
    command: `Connect-MgGraph -Scopes 'GroupMember.Read.All','Group.Read.All','User.Read.All'\nGet-MgGroup -All | ForEach-Object {\n  $group = $_\n  Get-MgGroupMember -GroupId $group.Id -All | Where-Object { $_.AdditionalProperties.userType -eq 'Guest' } |\n    Select-Object @{N='Group';E={$group.DisplayName}},Id,AdditionalProperties\n} | Export-Csv .\\Group-GuestMembers.csv -NoTypeInformation`,
    preview: preview.members((member) => member.memberType === "Guest", (member) => `${member.groupName} | ${member.memberName} | guest | ${member.membershipRole}`),
  },
  {
    id: "identity-password-policy", persona: "Modern workplace", title: "Review users with non-expiring passwords", modules: "Microsoft.Graph", reportId: "entra-all-users",
    description: "Exports accounts where password-expiry policy needs a documented service-account or break-glass exception.",
    command: `Connect-MgGraph -Scopes 'User.Read.All'\nGet-MgUser -All -Property DisplayName,UserPrincipalName,AccountEnabled,PasswordPolicies |\n  Where-Object { $_.PasswordPolicies -match 'DisablePasswordExpiration' } |\n  Select-Object DisplayName,UserPrincipalName,AccountEnabled,PasswordPolicies |\n  Export-Csv .\\NonExpiring-Passwords.csv -NoTypeInformation`,
    preview: preview.users((user) => user.passwordNeverExpires === "Yes", (user) => `${user.displayName} | ${user.upn} | ${user.accountEnabled} | password never expires`),
  },
  {
    id: "license-consumption", persona: "Licensing & FinOps", title: "Report licence consumption by SKU", modules: "Microsoft.Graph", reportId: "entra-licensed-users",
    description: "Creates a SKU-level supply-and-consumption baseline for licence renewal and optimisation reviews.",
    command: `Connect-MgGraph -Scopes 'Organization.Read.All'\nGet-MgSubscribedSku | ForEach-Object {\n  [pscustomobject]@{ Sku=$_.SkuPartNumber; Consumed=$_.ConsumedUnits; Enabled=$_.PrepaidUnits.Enabled; Warning=$_.PrepaidUnits.Warning; Suspended=$_.PrepaidUnits.Suspended }\n} | Export-Csv .\\License-Consumption.csv -NoTypeInformation`,
    preview: () => Object.entries(tables.users.filter((user) => user.licensed === "Licensed").reduce<Record<string, number>>((totals, user) => { for (const sku of String(user.licenses).split(" + ")) totals[sku] = (totals[sku] ?? 0) + 1; return totals; }, {})).slice(0, 6).map(([sku, assigned]) => `${sku} | ${assigned} assigned licences`),
  },
  {
    id: "license-unlicensed-users", persona: "Licensing & FinOps", title: "Export unlicensed enabled users", modules: "Microsoft.Graph", reportId: "entra-licensed-users",
    description: "Surfaces active accounts without a licence so owners can validate intended access and service eligibility.",
    command: `Connect-MgGraph -Scopes 'User.Read.All'\nGet-MgUser -All -Property DisplayName,UserPrincipalName,AccountEnabled,AssignedLicenses,Department |\n  Where-Object { $_.AccountEnabled -and $_.AssignedLicenses.Count -eq 0 } |\n  Select-Object DisplayName,UserPrincipalName,Department,AccountEnabled |\n  Export-Csv .\\Unlicensed-EnabledUsers.csv -NoTypeInformation`,
    preview: preview.users((user) => user.licensed === "Unlicensed" && user.accountEnabled === "Enabled", (user) => `${user.displayName} | ${user.upn} | ${user.department} | enabled, unlicensed`),
  },
  {
    id: "license-group-assignment", persona: "Licensing & FinOps", title: "Review group-based licence assignments", modules: "Microsoft.Graph", reportId: "entra-m365-groups",
    description: "Exports Entra groups carrying assigned licences for entitlement design and nested-membership checks.",
    command: `Connect-MgGraph -Scopes 'Group.Read.All'\nGet-MgGroup -All -Property DisplayName,Mail,GroupTypes,AssignedLicenses |\n  Where-Object { $_.AssignedLicenses.Count -gt 0 } |\n  Select-Object DisplayName,Mail,GroupTypes,AssignedLicenses |\n  Export-Csv .\\GroupBased-LicenseAssignments.csv -NoTypeInformation`,
    preview: preview.teams((team) => Number(team.members) > 50, (team) => `${team.teamName} | ${team.members} members | review eligibility before group-based licensing`),
  },
  {
    id: "intune-stale", persona: "Intune", title: "Find stale Intune devices", modules: "Microsoft.Graph.DeviceManagement", reportId: "intune-stale",
    description: "Lists managed devices that have not checked in recently for validation before retire or wipe decisions.",
    command: `Connect-MgGraph -Scopes 'DeviceManagementManagedDevices.Read.All'\nGet-MgDeviceManagementManagedDevice -All | Where-Object {\n  $_.LastSyncDateTime -lt (Get-Date).AddDays(-30)\n} | Select-Object DeviceName,UserPrincipalName,OperatingSystem,ComplianceState,LastSyncDateTime |\n  Export-Csv .\\Stale-IntuneDevices.csv -NoTypeInformation`,
    preview: preview.devices((device) => Number(device.staleDays) > 30, (device) => `${device.deviceName} | ${device.os} | ${device.compliance} | ${device.staleDays} days since check-in`),
  },
  {
    id: "intune-noncompliant", persona: "Intune", title: "Export non-compliant Intune devices", modules: "Microsoft.Graph.DeviceManagement", reportId: "intune-noncompliant",
    description: "Provides the device owner, compliance state, and remediation signal for a daily posture review.",
    command: `Connect-MgGraph -Scopes 'DeviceManagementManagedDevices.Read.All'\nGet-MgDeviceManagementManagedDevice -All | Where-Object { $_.ComplianceState -ne 'compliant' } |\n  Select-Object DeviceName,UserPrincipalName,OperatingSystem,ComplianceState,JailBroken,LastSyncDateTime |\n  Export-Csv .\\NonCompliant-IntuneDevices.csv -NoTypeInformation`,
    preview: preview.devices((device) => device.compliance !== "Compliant", (device) => `${device.deviceName} | ${device.owner} | ${device.compliance} | ${device.complianceIssue}`),
  },
  {
    id: "exo-forwarding", persona: "Exchange", title: "Review mailbox forwarding", modules: "ExchangeOnlineManagement", reportId: "exo-forwarding",
    description: "Exports mailboxes with forwarding destinations; investigate external destinations and documented exceptions.",
    command: `Connect-ExchangeOnline\nGet-EXOMailbox -ResultSize Unlimited -Properties ForwardingSmtpAddress,DeliverToMailboxAndForward |\n  Where-Object { $_.ForwardingSmtpAddress } |\n  Select-Object DisplayName,PrimarySmtpAddress,ForwardingSmtpAddress,DeliverToMailboxAndForward |\n  Export-Csv .\\Mailbox-Forwarding.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.mailboxes((mailbox) => String(mailbox.forwardingTo) !== "â€”", (mailbox) => `${mailbox.displayName} | ${mailbox.upn} | forwards to ${mailbox.forwardingTo}`),
  },
  {
    id: "exo-mailbox-storage", persona: "Exchange", title: "Report mailbox storage and quota", modules: "ExchangeOnlineManagement", reportId: "exo-mailbox-size",
    description: "Exports mailbox usage against quota so operations teams can plan archive, retention, or licence action.",
    command: `Connect-ExchangeOnline\nGet-EXOMailbox -ResultSize Unlimited -Properties ArchiveStatus | Get-EXOMailboxStatistics |\n  Select-Object DisplayName,ItemCount,TotalItemSize,LastUserActionTime |\n  Export-Csv .\\Mailbox-Storage.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.mailboxes((mailbox) => Number(mailbox.usagePercent) >= 70, (mailbox) => `${mailbox.displayName} | ${mailbox.sizeGB} GB / ${mailbox.quotaGB} GB | ${mailbox.usagePercent}% used`),
  },
  {
    id: "exo-dl-members", persona: "Exchange", title: "Export distribution group members", modules: "ExchangeOnlineManagement", reportId: "entra-group-members",
    description: "Produces a membership extract for distribution groups with repeatable local CSV output.",
    command: `Connect-ExchangeOnline\nGet-DistributionGroup -ResultSize Unlimited | ForEach-Object {\n  $group = $_\n  Get-DistributionGroupMember -Identity $group.Identity -ResultSize Unlimited |\n    Select-Object @{N='Group';E={$group.DisplayName}},DisplayName,PrimarySmtpAddress,RecipientTypeDetails\n} | Export-Csv .\\DistributionGroup-Members.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.members((member) => member.groupType === "Distribution group", (member) => `${member.groupName} | ${member.memberName} | ${member.memberUpn}`),
  },
  {
    id: "exo-delegates", persona: "Exchange", title: "Review mailbox delegates", modules: "ExchangeOnlineManagement", reportId: "exo-all-mailboxes",
    description: "Finds non-inherited Full Access assignments that require business ownership or periodic recertification.",
    command: `Connect-ExchangeOnline\nGet-EXOMailbox -ResultSize Unlimited | ForEach-Object {\n  $mailbox = $_\n  Get-EXOMailboxPermission -Identity $mailbox.UserPrincipalName |\n    Where-Object { $_.AccessRights -contains 'FullAccess' -and -not $_.IsInherited -and -not $_.Deny } |\n    Select-Object @{N='Mailbox';E={$mailbox.PrimarySmtpAddress}},User,AccessRights,IsInherited\n} | Export-Csv .\\Mailbox-Delegates.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.mailboxes((mailbox) => Number(mailbox.fullAccessDelegates) > 0, (mailbox) => `${mailbox.displayName} | ${mailbox.fullAccessDelegates} Full Access delegate(s) | ${mailbox.mailboxType}`),
  },
  {
    id: "exo-folder-permissions", persona: "Exchange", title: "Export mailbox folder permissions", modules: "ExchangeOnlineManagement", reportId: "exo-permission-audit",
    description: "Collects Calendar permissions for user and shared mailboxes so delegated access can be recertified.",
    command: `Connect-ExchangeOnline\nGet-EXOMailbox -ResultSize Unlimited -RecipientTypeDetails UserMailbox,SharedMailbox | ForEach-Object {\n  $mailbox = $_\n  Get-MailboxFolderPermission -Identity "$($mailbox.PrimarySmtpAddress):\\Calendar" -ErrorAction SilentlyContinue |\n    Where-Object { $_.User -notmatch 'Default|Anonymous' } |\n    Select-Object @{N='Mailbox';E={$mailbox.PrimarySmtpAddress}},User,AccessRights,SharingPermissionFlags\n} | Export-Csv .\\Mailbox-CalendarPermissions.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.mailboxes((mailbox) => Number(mailbox.fullAccessDelegates) > 0, (mailbox) => `${mailbox.displayName} | ${mailbox.fullAccessDelegates} delegate(s) | review Calendar permissions`),
  },
  {
    id: "exo-shared-mailbox-audit", persona: "Exchange", title: "Search shared mailbox activity", modules: "ExchangeOnlineManagement / Purview", reportId: "exo-permission-audit",
    description: "Produces an evidence export of mailbox access and delete actions before investigating shared-mailbox activity.",
    command: `Connect-ExchangeOnline\nSearch-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -RecordType ExchangeItemAggregated -ResultSize 5000 |\n  Select-Object CreationDate,UserIds,Operations,AuditData |\n  Export-Csv .\\SharedMailbox-Activity.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.audit((event) => event.service === "Exchange Online" && /access|permission|mailbox/i.test(String(event.operation)), (event) => `${event.time} | ${event.operation} | ${event.actor} | ${event.target}`),
  },
  {
    id: "teams-inactive", persona: "Collaboration", title: "Find inactive Teams", modules: "MicrosoftTeams", reportId: "teams-inactive",
    description: "Reviews Teams with no recent messages or meetings before archive, owner outreach, or retention action.",
    command: `Connect-MicrosoftTeams\nGet-Team -NumberOfThreads 4 | ForEach-Object {\n  $team = $_\n  Get-TeamUser -GroupId $team.GroupId | Select-Object @{N='Team';E={$team.DisplayName}},Name,User,Role\n} | Export-Csv .\\Teams-MembershipBaseline.csv -NoTypeInformation\n# Use the linked Reporter 360 Teams activity report to apply the 30-day inactivity window.\nDisconnect-MicrosoftTeams`,
    preview: preview.teams((team) => Number(team.messages30d) === 0 && Number(team.meetings30d) === 0, (team) => `${team.teamName} | ${team.members} members | last activity ${team.lastActivity}`),
  },
  {
    id: "teams-external-members", persona: "Collaboration", title: "Export external Teams members", modules: "MicrosoftTeams", reportId: "teams-all",
    description: "Establishes an external-collaboration evidence set across Team memberships before guest access review.",
    command: `Connect-MicrosoftTeams\nGet-Team -NumberOfThreads 4 | ForEach-Object {\n  $team = $_\n  Get-TeamUser -GroupId $team.GroupId | Where-Object { $_.User -match '#EXT#' } |\n    Select-Object @{N='Team';E={$team.DisplayName}},Name,User,Role\n} | Export-Csv .\\Teams-ExternalMembers.csv -NoTypeInformation\nDisconnect-MicrosoftTeams`,
    preview: preview.teams((team) => Number(team.guests) > 0, (team) => `${team.teamName} | ${team.guests} guest(s) | ${team.privacy}`),
  },
  {
    id: "teams-channel-inventory", persona: "Collaboration", title: "Export Teams channel inventory", modules: "MicrosoftTeams", reportId: "teams-all",
    description: "Exports standard, private, and shared channel inventory to support collaboration lifecycle ownership.",
    command: `Connect-MicrosoftTeams\nGet-Team -NumberOfThreads 4 | ForEach-Object {\n  $team = $_\n  Get-TeamChannel -GroupId $team.GroupId |\n    Select-Object @{N='Team';E={$team.DisplayName}},DisplayName,MembershipType,Description\n} | Export-Csv .\\Teams-ChannelInventory.csv -NoTypeInformation\nDisconnect-MicrosoftTeams`,
    preview: preview.teams((team) => Number(team.channels) > 10, (team) => `${team.teamName} | ${team.channels} channels | ${team.members} members`),
  },
  {
    id: "spo-external-sharing", persona: "Collaboration", title: "Review SharePoint external sharing", modules: "PnP.PowerShell", reportId: "spo-external",
    description: "Exports sharing capability and external guest exposure for review before access is restricted.",
    command: `Connect-PnPOnline -Url 'https://contoso-admin.sharepoint.com' -Interactive\nGet-PnPTenantSite -Detailed | Where-Object { $_.SharingCapability -ne 'Disabled' } |\n  Select-Object Title,Url,SharingCapability,StorageUsageCurrent,StorageQuota,LastContentModifiedDate |\n  Export-Csv .\\SharePoint-ExternalSharing.csv -NoTypeInformation\nDisconnect-PnPOnline`,
    preview: preview.sites((site) => site.externalSharing === "Enabled", (site) => `${site.siteName} | ${site.anyoneLinks} Anyone links | ${site.guestUsers} guests`),
  },
  {
    id: "spo-sharing-audit", persona: "Collaboration", title: "Audit SharePoint sharing and downloads", modules: "ExchangeOnlineManagement / Purview", reportId: "spo-audit",
    description: "Searches file-sharing and download events for investigation, data-owner assurance, and compliance evidence.",
    command: `Connect-ExchangeOnline\nSearch-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -Operations SharingSet,AnonymousLinkCreated,FileDownloaded -ResultSize 5000 |\n  Select-Object CreationDate,UserIds,Operations,AuditData |\n  Export-Csv .\\SharePoint-SharingAndDownloads.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.audit((event) => event.service === "SharePoint Online" && /sharing|download|link/i.test(String(event.operation)), (event) => `${event.time} | ${event.operation} | ${event.actor} | ${event.target}`),
  },
  {
    id: "onedrive-external", persona: "Collaboration", title: "Review externally shared OneDrive content", modules: "Microsoft.Graph", reportId: "od-external",
    description: "Collects shared links exposed by OneDrive items for owner-led verification and evidence retention.",
    command: `Connect-MgGraph -Scopes 'Files.Read.All','Sites.Read.All','User.Read.All'\nGet-MgUser -All | ForEach-Object {\n  $user = $_; $drive = Get-MgUserDrive -UserId $user.Id\n  Get-MgDriveRootChild -DriveId $drive.Id -All | ForEach-Object {\n    $item = $_\n    Get-MgDriveItemPermission -DriveId $drive.Id -DriveItemId $item.Id -All |\n      Where-Object { $_.Link.Scope -in 'anonymous','organization' } |\n      Select-Object @{N='Owner';E={$user.UserPrincipalName}},@{N='Item';E={$item.Name}},Link\n  }\n} | Export-Csv .\\OneDrive-SharedContent.csv -NoTypeInformation`,
    preview: preview.drives((drive) => Number(drive.externalLinks) > 0 || Number(drive.anyoneLinks) > 0, (drive) => `${drive.owner} | ${drive.externalLinks} external links | ${drive.anyoneLinks} Anyone links`),
  },
  {
    id: "onedrive-usage", persona: "Collaboration", title: "Export OneDrive usage detail", modules: "Microsoft.Graph", reportId: "od-accounts",
    description: "Creates a storage and activity baseline for OneDrive service ownership and capacity planning.",
    command: `Connect-MgGraph -Scopes 'Reports.Read.All'\nGet-MgReportOneDriveUsageAccountDetail -Period D30 -OutFile .\\OneDrive-UsageDetail.csv\nDisconnect-MgGraph`,
    preview: preview.drives(() => true, (drive) => `${drive.owner} | ${drive.storageGB} GB / ${drive.quotaGB} GB | last activity ${drive.lastActivity}`),
  },
  {
    id: "identity-no-mfa", persona: "Identity", title: "Export users without MFA", modules: "Microsoft.Graph.Users", reportId: "sec-users-no-mfa",
    description: "Collects registration detail for accounts without a registered strong authentication method.",
    command: `Connect-MgGraph -Scopes 'User.Read.All','UserAuthenticationMethod.Read.All'\nGet-MgReportAuthenticationMethodUserRegistrationDetail -All | Where-Object {\n  -not $_.IsMfaRegistered\n} | Select-Object UserDisplayName,UserPrincipalName,IsMfaRegistered,IsMfaCapable,MethodsRegistered |\n  Export-Csv .\\Users-WithoutMFA.csv -NoTypeInformation`,
    preview: preview.users((user) => user.mfaStatus === "Disabled", (user) => `${user.displayName} | ${user.upn} | ${user.userType} | MFA disabled`),
  },
  {
    id: "identity-inactive-users", persona: "Identity", title: "Review inactive Entra users", modules: "Microsoft.Graph.Users", reportId: "entra-inactive-users",
    description: "Exports accounts with an old sign-in timestamp for leave, service-account, and licence-reclaim review.",
    command: `Connect-MgGraph -Scopes 'User.Read.All','AuditLog.Read.All'\nGet-MgUser -All -Property DisplayName,UserPrincipalName,AccountEnabled,SignInActivity |\n  Where-Object { $_.SignInActivity.LastSignInDateTime -lt (Get-Date).AddDays(-90) } |\n  Select-Object DisplayName,UserPrincipalName,AccountEnabled,@{N='LastSignIn';E={$_.SignInActivity.LastSignInDateTime}} |\n  Export-Csv .\\Inactive-EntraUsers.csv -NoTypeInformation`,
    preview: preview.users((user) => Number(user.inactiveDays) > 90, (user) => `${user.displayName} | ${user.upn} | ${user.inactiveDays} inactive days | ${user.licensed}`),
  },
  {
    id: "identity-admins", persona: "Identity", title: "Review privileged role members", modules: "Microsoft.Graph.Identity.Governance", reportId: "entra-admins",
    description: "Exports active directory-role assignments for privileged access review and MFA validation.",
    command: `Connect-MgGraph -Scopes 'RoleManagement.Read.Directory','Directory.Read.All'\nGet-MgDirectoryRole -All | ForEach-Object {\n  $role = $_\n  Get-MgDirectoryRoleMember -DirectoryRoleId $role.Id -All |\n    Select-Object @{N='Role';E={$role.DisplayName}},Id,AdditionalProperties\n} | Export-Csv .\\Privileged-RoleMembers.csv -NoTypeInformation`,
    preview: preview.users((user) => String(user.adminRole) !== "â€”", (user) => `${user.displayName} | ${user.adminRole} | MFA ${user.mfaStatus} | ${user.lastSignIn}`),
  },
  {
    id: "identity-guests-last-signin", persona: "Identity", title: "Review guest user last sign-in", modules: "Microsoft.Graph", reportId: "entra-guests",
    description: "Exports external identities with their latest interactive sign-in to support access recertification.",
    command: `Connect-MgGraph -Scopes 'User.Read.All','AuditLog.Read.All'\nGet-MgUser -All -Filter "userType eq 'Guest'" -Property DisplayName,UserPrincipalName,AccountEnabled,SignInActivity |\n  Select-Object DisplayName,UserPrincipalName,AccountEnabled,@{N='LastSignIn';E={$_.SignInActivity.LastSignInDateTime}} |\n  Export-Csv .\\Guest-LastSignIn.csv -NoTypeInformation`,
    preview: preview.users((user) => user.userType === "Guest", (user) => `${user.displayName} | ${user.upn} | ${user.lastSignIn} | ${user.accountEnabled}`),
  },
  {
    id: "identity-ca-export", persona: "Identity", title: "Export Conditional Access policies", modules: "Microsoft.Graph", reportId: "entra-ca-policies",
    description: "Exports policy state, conditions, and grant controls before a reviewed configuration change.",
    command: `Connect-MgGraph -Scopes 'Policy.Read.All','Application.Read.All'\nGet-MgIdentityConditionalAccessPolicy -All |\n  Select-Object DisplayName,State,Conditions,GrantControls,SessionControls,CreatedDateTime,ModifiedDateTime |\n  Export-Csv .\\ConditionalAccess-Policies.csv -NoTypeInformation`,
    preview: () => tables.caPolicies.slice(0, 6).map((policy) => `${policy.policyName} | ${policy.state} | ${policy.controls} | ${policy.failuresLast30d} failures`),
  },
  {
    id: "audit-membership", persona: "Security", title: "Search group membership changes", modules: "ExchangeOnlineManagement / Purview", reportId: "sec-audit-search",
    description: "Queries the Unified Audit Log for group membership changes over the previous seven days.",
    command: `Connect-ExchangeOnline\nSearch-UnifiedAuditLog -StartDate (Get-Date).AddDays(-7) -EndDate (Get-Date) -Operations AddMemberToGroup,RemoveMemberFromGroup -ResultSize 5000 |\n  Select-Object CreationDate,UserIds,Operations,AuditData |\n  Export-Csv .\\Group-MembershipAudit.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.audit((event) => /member.*group/i.test(String(event.operation)), (event) => `${event.time} | ${event.operation} | ${event.actor} | ${event.target}`),
  },
  {
    id: "audit-pim-activations", persona: "Security", title: "Audit privileged role activations", modules: "ExchangeOnlineManagement / Purview", reportId: "sec-audit-search",
    description: "Exports role-assignment activity for privileged access monitoring and periodic PIM evidence reviews.",
    command: `Connect-ExchangeOnline\nSearch-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -Operations AddMemberToRole,RemoveMemberFromRole -ResultSize 5000 |\n  Select-Object CreationDate,UserIds,Operations,AuditData |\n  Export-Csv .\\PrivilegedRole-Activity.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.audit((event) => /member.*role/i.test(String(event.operation)), (event) => `${event.time} | ${event.operation} | ${event.actor} | ${event.target}`),
  },
  {
    id: "audit-dlp-events", persona: "Security", title: "Search DLP policy events", modules: "ExchangeOnlineManagement / Purview", reportId: "sec-audit-search",
    description: "Creates a reviewable DLP evidence extract without altering policy or message state.",
    command: `Connect-ExchangeOnline\nSearch-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -RecordType DLPAll -ResultSize 5000 |\n  Select-Object CreationDate,UserIds,Operations,AuditData |\n  Export-Csv .\\DLP-PolicyEvents.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.audit((event) => event.service === "Security", (event) => `${event.time} | ${event.operation} | ${event.actor} | ${event.target}`),
  },
  {
    id: "audit-admin-activity", persona: "Security", title: "Search Microsoft 365 admin activity", modules: "ExchangeOnlineManagement / Purview", reportId: "sec-audit-search",
    description: "Exports administrative activity for change review, incident analysis, and audit preparation.",
    command: `Connect-ExchangeOnline\nSearch-UnifiedAuditLog -StartDate (Get-Date).AddDays(-7) -EndDate (Get-Date) -RecordType AzureActiveDirectory -ResultSize 5000 |\n  Select-Object CreationDate,UserIds,Operations,AuditData |\n  Export-Csv .\\Microsoft365-AdminActivity.csv -NoTypeInformation\nDisconnect-ExchangeOnline -Confirm:$false`,
    preview: preview.audit((event) => event.service === "Entra ID" && /user|role|conditional/i.test(String(event.operation)), (event) => `${event.time} | ${event.operation} | ${event.actor} | ${event.target}`),
  },
  {
    id: "audit-signin-failures", persona: "Security", title: "Export failed Entra sign-ins", modules: "Microsoft.Graph", reportId: "entra-signin-failures",
    description: "Collects failed interactive sign-ins for triage, conditional-access analysis, and trend reporting.",
    command: `Connect-MgGraph -Scopes 'AuditLog.Read.All'\nGet-MgAuditLogSignIn -All -Filter "status/errorCode ne 0" |\n  Select-Object CreatedDateTime,UserPrincipalName,AppDisplayName,IPAddress,Location,Status,ConditionalAccessStatus |\n  Export-Csv .\\Failed-EntraSignIns.csv -NoTypeInformation`,
    preview: preview.signIns((signIn) => signIn.status === "Failure", (signIn) => `${signIn.time} | ${signIn.upn} | ${signIn.application} | ${signIn.failureReason}`),
  },
  {
    id: "audit-risky-signins", persona: "Security", title: "Review risky Entra sign-ins", modules: "Microsoft.Graph", reportId: "entra-risky-signins",
    description: "Exports sign-ins carrying an identity-protection risk signal for analysts to review in context.",
    command: `Connect-MgGraph -Scopes 'IdentityRiskyUser.Read.All','AuditLog.Read.All'\nGet-MgRiskyUser -All | Where-Object { $_.RiskLevel -ne 'none' } |\n  Select-Object UserDisplayName,UserPrincipalName,RiskLevel,RiskState,RiskLastUpdatedDateTime |\n  Export-Csv .\\Risky-EntraUsers.csv -NoTypeInformation`,
    preview: preview.signIns((signIn) => String(signIn.riskLevel) !== "None", (signIn) => `${signIn.time} | ${signIn.upn} | risk ${signIn.riskLevel} | ${signIn.location}`),
  },
];

export function PowerShellWorkspace({ notify, onOpenReport }: { notify: (message: string) => void; onOpenReport: (reportId: string) => void }) {
  const [persona, setPersona] = useState<Persona>("Modern workplace");
  const commands = useMemo(() => commandCatalog.filter((command) => command.persona === persona), [persona]);
  const [selectedId, setSelectedId] = useState(commandCatalog[0].id);
  const selected = commandCatalog.find((command) => command.id === selectedId) ?? commandCatalog[0];
  const output = selected.preview();
  const select = (id: string) => setSelectedId(id);

  return (
    <section className="pr-powershell" data-testid="portal-powershell">
      <header className="pr-page-head">
        <div>
          <h1>PowerShell workspace</h1>
          <p>Original, role-aware runbooks aligned to the Reporter 360 catalogue. Copy or download commands for your approved local PowerShell environment; this workspace never executes a command against a tenant.</p>
        </div>
        <span className="pr-safety"><ShieldCheckmark24Regular /> Local execution only - no tenant command is run by this browser</span>
      </header>
      <div className="pr-personas" role="tablist" aria-label="Administrator role">
        {(["Modern workplace", "Licensing & FinOps", "Intune", "Exchange", "Collaboration", "Identity", "Security"] as Persona[]).map((item) => <button key={item} className={persona === item ? "pr-on" : ""} onClick={() => { setPersona(item); const first = commandCatalog.find((command) => command.persona === item); if (first) select(first.id); }} role="tab" aria-selected={persona === item} data-testid={`portal-ps-persona-${item.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`}>{item}</button>)}
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
            <button className="pr-btn" onClick={() => onOpenReport(selected.reportId)} data-testid="portal-ps-open-report"><ArrowRight24Regular /> Open supporting report</button>
            <button className="pr-btn pr-primary" onClick={() => notify("Local command preview refreshed; no tenant command was executed.")} data-testid="portal-ps-preview"><Play24Regular /> Refresh local preview</button>
          </div>
          <pre className="pr-command-code"><code>{selected.command}</code></pre>
          <div className="pr-command-output" data-testid="portal-ps-output"><header><span>LOCAL COMMAND PREVIEW</span><b>{output.length} records shown</b></header>{output.length ? output.map((line) => <code key={line}>{line}</code>) : <p>No records are available until a tenant collector is connected. The runbook remains available for an approved environment.</p>}</div>
        </article>
      </div>
    </section>
  );
}

param(
  [Parameter(Mandatory = $true)]
  [string]$DemoPassword,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $root "artifacts"
$reportPath = Join-Path $artifactDirectory "release-candidate.json"
$results = [System.Collections.Generic.List[object]]::new()
$startedAt = [DateTimeOffset]::UtcNow

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Set-Location $root
$env:AEGIS_SMOKE_PASSWORD = $DemoPassword

function Invoke-ReleaseStep {
  param([string]$Name, [scriptblock]$Action)
  $stepStarted = [DateTimeOffset]::UtcNow
  Write-Host "`n== $Name ==" -ForegroundColor Cyan
  try {
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "$Name exited with code $LASTEXITCODE." }
    $results.Add([pscustomobject]@{ name = $Name; status = "passed"; durationSeconds = [Math]::Round(([DateTimeOffset]::UtcNow - $stepStarted).TotalSeconds, 2) })
  } catch {
    $results.Add([pscustomobject]@{ name = $Name; status = "failed"; durationSeconds = [Math]::Round(([DateTimeOffset]::UtcNow - $stepStarted).TotalSeconds, 2); error = $_.Exception.Message })
    throw
  }
}

try {
  Invoke-ReleaseStep "Stop existing acceptance runtime" { & powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\stop-acceptance.ps1") }
  Invoke-ReleaseStep "Production dependency audit" {
    & npm.cmd --prefix apps\web audit --omit=dev --audit-level=high
    if ($LASTEXITCODE -ne 0) { throw "Web production dependency audit failed." }
    & npm.cmd --prefix apps\api audit --omit=dev --audit-level=high
  }
  Invoke-ReleaseStep "API unit tests" { & npm.cmd --prefix apps\api test -- --runInBand }
  if (-not $SkipBuild) {
    Invoke-ReleaseStep "API production build" { & npm.cmd --prefix apps\api run build }
    Invoke-ReleaseStep "Web production build" { & npm.cmd --prefix apps\web run build }
  }
  Invoke-ReleaseStep "Docker Compose validation" { & docker compose --env-file .env.example config --quiet }
  Invoke-ReleaseStep "Start acceptance runtime" { & powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\start-acceptance.ps1") -SkipBuild }
  Invoke-ReleaseStep "API end-to-end and persistence" { & npm.cmd --prefix apps\api run test:e2e }
  Invoke-ReleaseStep "Complete browser workflow" { & npm.cmd --prefix apps\web run test:smoke }
  Invoke-ReleaseStep "API role matrix" { & npm.cmd --prefix apps\web run test:roles }
  Invoke-ReleaseStep "UI role and deep-link matrix" { & npm.cmd --prefix apps\web run test:role-ui }
  Invoke-ReleaseStep "Control and accessibility inventory" { & npm.cmd --prefix apps\web run audit:controls }
  Invoke-ReleaseStep "Public landing and CTA validation" { & npm.cmd --prefix apps\web run test:landing }
  Invoke-ReleaseStep "Public demo personas and isolation" { & npm.cmd --prefix apps\web run test:public-demo }
} finally {
  $finishedAt = [DateTimeOffset]::UtcNow
  $failed = @($results | Where-Object status -eq "failed").Count
  $report = [ordered]@{
    schemaVersion = 1
    releaseCandidate = (git rev-parse --short HEAD).Trim()
    startedAt = $startedAt.ToString("o")
    finishedAt = $finishedAt.ToString("o")
    durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)
    status = if ($failed -eq 0) { "passed" } else { "failed" }
    passed = @($results | Where-Object status -eq "passed").Count
    failed = $failed
    scope = "local enterprise and isolated public-demo release candidate"
    productionDecision = "See docs/GO-LIVE-RUNBOOK.md; external production gates are evaluated separately."
    steps = $results
  }
  $report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $reportPath -Encoding utf8
  Write-Host "`nRelease evidence: $reportPath" -ForegroundColor Green
}

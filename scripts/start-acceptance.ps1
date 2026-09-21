param(
  [switch]$SkipBuild,
  [switch]$ResetData
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root '.runtime'
$api = Join-Path $root 'apps\api'
$web = Join-Path $root 'apps\web'

New-Item -ItemType Directory -Force -Path $runtime | Out-Null

if (-not (Test-Path (Join-Path $web '.env.local'))) {
  throw 'Local web credentials are missing. Run: cd apps\web; npm.cmd run auth:setup'
}

Get-Content -LiteralPath (Join-Path $web '.env.local') | ForEach-Object {
  if ($_ -match '^([^#][^=]*)=(.*)$') {
    Set-Item -Path "Env:$($matches[1].Trim())" -Value $matches[2]
  }
}

# The acceptance runtime is the only local launcher that enables the public
# synthetic tour automatically. Docker and ordinary deployments remain opt-in.
$env:AEGIS_PUBLIC_DEMO_ENABLED = 'true'

foreach ($port in 3001, 3008) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    throw "Port $port is already in use by PID $($listener.OwningProcess). Stop it before starting the acceptance environment."
  }
}

if (-not $SkipBuild) {
  Push-Location $api
  try { npm.cmd run build } finally { Pop-Location }
  Push-Location $web
  try { npm.cmd run build } finally { Pop-Location }
}

$env:PORT = '3001'
$env:NODE_ENV = 'production'
$env:AUTH_MODE = 'internal'
$env:WEB_ORIGIN = 'http://localhost:3008,http://127.0.0.1:3008'
$env:RUNTIME_DATA_PATH = Join-Path $api 'data\runtime-state.json'

$apiProcess = Start-Process -FilePath 'node' -ArgumentList 'dist/main.js' -WorkingDirectory $api -RedirectStandardOutput (Join-Path $runtime 'api.log') -RedirectStandardError (Join-Path $runtime 'api-error.log') -WindowStyle Hidden -PassThru
$env:NODE_ENV = 'production'
$env:PORT = '3008'
$env:HOSTNAME = '0.0.0.0'
$standalone = Join-Path $web '.next\standalone'
Copy-Item -Recurse -Force (Join-Path $web 'public') (Join-Path $standalone 'public')
New-Item -ItemType Directory -Force -Path (Join-Path $standalone '.next') | Out-Null
Copy-Item -Recurse -Force (Join-Path $web '.next\static') (Join-Path $standalone '.next\static')
$webProcess = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $standalone -RedirectStandardOutput (Join-Path $runtime 'web.log') -RedirectStandardError (Join-Path $runtime 'web-error.log') -WindowStyle Hidden -PassThru

Set-Content -LiteralPath (Join-Path $runtime 'api.pid') -Value $apiProcess.Id
Set-Content -LiteralPath (Join-Path $runtime 'web.pid') -Value $webProcess.Id

$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  try {
    $apiHealth = Invoke-RestMethod -Uri 'http://127.0.0.1:3001/health/ready' -TimeoutSec 2
    $webHealth = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3008/login' -TimeoutSec 2
    if ($apiHealth.status -eq 'ready' -and $webHealth.StatusCode -eq 200) { $ready = $true; break }
  } catch { Start-Sleep -Milliseconds 500 }
}

if (-not $ready) {
  throw "Acceptance environment failed to start. Review $runtime\api-error.log and $runtime\web-error.log."
}

if ($ResetData) {
  $identityJson = @{
    tenantId = '00000000-0000-4000-8000-000000000001'
    actorId = 'acceptance.bootstrap@local.invalid'
    roles = @('platform-admin')
    issuedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    nonce = [guid]::NewGuid().ToString()
  } | ConvertTo-Json -Compress
  $identity = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($identityJson)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  $hmac = [Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($env:AEGIS_INTERNAL_API_SECRET))
  try {
    $signature = [Convert]::ToBase64String($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($identity))).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  } finally { $hmac.Dispose() }
  Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3001/api/v1/simulation/reset' -Headers @{ 'x-aegis-identity' = $identity; 'x-aegis-signature' = $signature } | Out-Null
}

Write-Host 'Acceptance environment is ready.' -ForegroundColor Green
Write-Host 'Web: http://localhost:3008/login'
Write-Host 'Public synthetic demo: http://localhost:3008/landing/demo'
Write-Host 'API: http://localhost:3001/api/docs'
Write-Host 'Run API E2E: cd apps\api; npm.cmd run test:e2e'
Write-Host 'Run browser E2E: cd apps\web; $env:AEGIS_SMOKE_PASSWORD="<password>"; npm.cmd run test:smoke'
Write-Host 'Run public demo isolation: cd apps\web; npm.cmd run test:public-demo'

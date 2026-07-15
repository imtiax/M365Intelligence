$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root '.runtime'

foreach ($name in 'api', 'web') {
  $pidFile = Join-Path $runtime "$name.pid"
  if (-not (Test-Path $pidFile)) { continue }
  $processId = [int](Get-Content -LiteralPath $pidFile -Raw)
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($process -and $process.ProcessName -eq 'node') {
    Stop-Process -Id $processId
    Write-Host "Stopped $name process $processId."
  }
  Remove-Item -LiteralPath $pidFile -Force
}

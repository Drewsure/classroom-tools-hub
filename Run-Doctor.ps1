$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $repoRoot

try {
  Write-Host "Running Classroom Tools Hub doctor checks from $repoRoot" -ForegroundColor Cyan
  npm run doctor
} finally {
  Pop-Location
}

#Requires -Version 5.1
<#
.SYNOPSIS
  Start VBNB locally against the hosted Supabase project (.env.local is preserved).

.USAGE
  .\scripts\run-local.ps1
  npm run local
  npm run dev
#>
param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root "package.json"))) {
  $Root = $PSScriptRoot
  if (-not (Test-Path (Join-Path $Root "package.json"))) {
    throw "Cannot find project root (package.json)."
  }
}

Set-Location $Root
Write-Host ""
Write-Host "=== VBNB dev (hosted Supabase) ===" -ForegroundColor Green
Write-Host "Root: $Root"

function Test-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-EnvValue([string]$Path, [string]$Key) {
  foreach ($line in Get-Content $Path) {
    if ($line -match "^\s*$([regex]::Escape($Key))\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

if (-not (Test-Command "node")) { throw "Node.js is required." }
if (-not (Test-Command "npm")) { throw "npm is required." }

$envPath = Join-Path $Root ".env.local"
if (-not (Test-Path $envPath)) {
  throw @"
Missing .env.local.

Copy .env.example to .env.local and fill in the hosted Supabase URL + keys
(Supabase dashboard → Project Settings → API).
"@
}

$required = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
)
$missing = @()
foreach ($key in $required) {
  $value = Get-EnvValue $envPath $key
  if (-not $value) { $missing += $key }
}
if ($missing.Count -gt 0) {
  throw "Missing in .env.local: $($missing -join ', ')"
}

$supabaseUrl = Get-EnvValue $envPath "NEXT_PUBLIC_SUPABASE_URL"
if ($supabaseUrl -match '(localhost|127\.0\.0\.1)') {
  Write-Host ""
  Write-Host "[warn] .env.local points at local Supabase ($supabaseUrl)." -ForegroundColor Yellow
  Write-Host "       This project uses one hosted database for dev and production." -ForegroundColor Yellow
  Write-Host "       Update NEXT_PUBLIC_SUPABASE_URL to https://<project-ref>.supabase.co" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Database: $supabaseUrl" -ForegroundColor Cyan
Write-Host ".env.local is preserved (not overwritten)." -ForegroundColor DarkGreen

if (-not (Test-Path (Join-Path $Root "node_modules"))) {
  Write-Host "-> npm install..." -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
}

Write-Host ""
Write-Host "Dev tips:" -ForegroundColor Yellow
Write-Host "  Mock OTP (non-production): set MOCK_OTP_CODE in .env.local"
Write-Host "  Register Owner/Sale at /login → create account"
Write-Host "  Local app URL should match NEXT_PUBLIC_APP_URL in .env.local"
Write-Host ""
Write-Host "-> next dev -- http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  Stop: Ctrl+C"
Write-Host ""

npm run dev -- -p $Port

#Requires -Version 5.1
<#
.SYNOPSIS
  Start VBNB locally: Docker check → Supabase → sync .env.local → Next.js dev.

.USAGE
  .\scripts\run-local.ps1
  .\scripts\run-local.ps1 -ResetDb
  npm run local
#>
param(
  [switch]$ResetDb,
  [switch]$SkipSupabase,
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
Write-Host "=== VBNB local ===" -ForegroundColor Green
Write-Host "Root: $Root"

function Test-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-LocalApiPort {
  $cfg = Join-Path $Root "supabase\config.toml"
  if (Test-Path $cfg) {
    $inApi = $false
    foreach ($line in Get-Content $cfg) {
      if ($line -match '^\s*\[api\]') { $inApi = $true; continue }
      if ($inApi -and $line -match '^\s*\[') { break }
      if ($inApi -and $line -match '^\s*port\s*=\s*(\d+)') { return [int]$Matches[1] }
    }
  }
  return 54321
}

function Test-TcpOpen([string]$TargetHost, [int]$Port, [int]$TimeoutMs = 2000) {
  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $iar = $client.BeginConnect($TargetHost, $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
    if (-not $ok) { $client.Close(); return $false }
    $client.EndConnect($iar) | Out-Null
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

if (-not (Test-Command "node")) { throw "Node.js is required." }
if (-not (Test-Command "npm")) { throw "npm is required." }

if (-not $SkipSupabase) {
  if (-not (Test-Command "docker")) {
    throw "Docker is required for Supabase local. Start Docker Desktop, then retry."
  }
  try {
    docker info 1>$null 2>$null
  } catch {
    throw "Docker daemon is not running. Open Docker Desktop and wait until it is ready."
  }

  Write-Host ""
  Write-Host "-> Ensuring Supabase is up..." -ForegroundColor Cyan
  $statusOk = $false
  try {
    npx supabase status 1>$null 2>$null
    if ($LASTEXITCODE -eq 0) { $statusOk = $true }
  } catch {
    $statusOk = $false
  }

  if (-not $statusOk) {
    Write-Host "-> supabase start (first time may pull images)..." -ForegroundColor Cyan
    npx supabase start
    if ($LASTEXITCODE -ne 0) { throw "supabase start failed." }
  } else {
    Write-Host "[ok] Supabase already running" -ForegroundColor DarkGreen
  }

  # Docker Desktop on Windows can leave containers "healthy" with a dead host
  # port proxy (WinNAT excluded ranges). supabase status still exits 0.
  $apiPort = Get-LocalApiPort
  if (-not (Test-TcpOpen "127.0.0.1" $apiPort)) {
    Write-Host "-> API port $apiPort not reachable; recreating local stack..." -ForegroundColor Yellow
    npx supabase stop
    if ($LASTEXITCODE -ne 0) { throw "supabase stop failed." }
    npx supabase start
    if ($LASTEXITCODE -ne 0) {
      throw "supabase start failed. If Windows blocked the bind, check: netsh interface ipv4 show excludedportrange protocol=tcp"
    }
    if (-not (Test-TcpOpen "127.0.0.1" $apiPort)) {
      throw "Supabase API still not reachable on 127.0.0.1:$apiPort. Port may be in a Windows excluded range."
    }
  }

  if ($ResetDb) {
    Write-Host "-> supabase db reset (migrations + seed)..." -ForegroundColor Cyan
    npx supabase db reset
    if ($LASTEXITCODE -ne 0) { throw "supabase db reset failed." }

    # db reset restarts auth with a new container IP; Kong keeps the old
    # upstream → /auth/v1 returns 502 until Kong is refreshed.
    Write-Host "-> Restarting Kong (refresh auth upstream after reset)..." -ForegroundColor Cyan
    $kong = docker ps --format "{{.Names}}" | Where-Object { $_ -like "supabase_kong_*" } | Select-Object -First 1
    if ($kong) {
      docker restart $kong 1>$null
      Start-Sleep -Seconds 5
      Write-Host "[ok] Restarted $kong" -ForegroundColor DarkGreen
    } else {
      Write-Host "[warn] Kong container not found - if login fails with 502, run: npx supabase stop ; npx supabase start" -ForegroundColor Yellow
    }
  }

  Write-Host "-> Syncing .env.local from supabase status..." -ForegroundColor Cyan
  # supabase may print "Stopped services: ..." on stderr; do not treat as fatal
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $envLines = npx supabase status -o env 2>$null
  $statusExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($statusExit -ne 0 -or -not $envLines) {
    throw "Could not read supabase status env. Run: npx supabase status"
  }

  $map = @{}
  foreach ($line in $envLines) {
    if ($line -match '^\s*([A-Z0-9_]+)=(.*)$') {
      $map[$Matches[1]] = $Matches[2].Trim().Trim('"')
    }
  }

  # supabase status -o env uses API_URL / ANON_KEY / SERVICE_ROLE_KEY (or newer names)
  $apiUrl = $map["API_URL"]
  if (-not $apiUrl) { $apiUrl = $map["SUPABASE_URL"] }
  $anon = $map["ANON_KEY"]
  if (-not $anon) { $anon = $map["PUBLISHABLE_KEY"] }
  $service = $map["SERVICE_ROLE_KEY"]
  if (-not $service) { $service = $map["SECRET_KEY"] }

  if (-not $apiUrl -or -not $anon -or -not $service) {
    Write-Host "Available keys: $($map.Keys -join ', ')" -ForegroundColor Yellow
    throw "Missing API_URL / ANON_KEY / SERVICE_ROLE_KEY from supabase status."
  }

  $envPath = Join-Path $Root ".env.local"
  $content = @"
NEXT_PUBLIC_SUPABASE_URL=$apiUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anon
SUPABASE_SERVICE_ROLE_KEY=$service
MOCK_OTP_CODE=000000
NEXT_PUBLIC_APP_URL=http://localhost:$Port
CRON_SECRET=dev-cron-secret
"@
  # UTF-8 without BOM — supabase config loader rejects BOM in .env.local
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($envPath, $content.TrimStart() + "`n", $utf8NoBom)
  Write-Host "[ok] Wrote $envPath" -ForegroundColor DarkGreen

  Write-Host ""
  Write-Host "Supabase:" -ForegroundColor Cyan
  Write-Host "  API    $apiUrl"
  if ($map["STUDIO_URL"]) { Write-Host ("  Studio " + $map["STUDIO_URL"]) }
}

if (-not (Test-Path (Join-Path $Root "node_modules"))) {
  Write-Host "-> npm install..." -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
}

Write-Host ""
Write-Host "Seed login (password: password123)" -ForegroundColor Yellow
Write-Host "  admin@vbnb.local | owner@vbnb.local | sale@vbnb.local | guest@vbnb.local"
Write-Host "  Mock OTP: 000000"
Write-Host ""
Write-Host "-> next dev -- http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  Stop: Ctrl+C  |  DB stop: npm run db:stop"
Write-Host ""

npm run dev -- -p $Port

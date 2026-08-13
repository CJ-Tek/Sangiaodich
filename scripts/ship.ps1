#Requires -Version 5.1
<#
.SYNOPSIS
  Ship recent local changes: commit -> db:push (if migrations) -> git push (= Vercel deploy).

.DESCRIPTION
  Fast  = last 6h,  tsc + test
  Solid = last 24h, db:reset (local) + tsc + build + test

  Only stages files that are dirty AND modified within the time window.
  Older dirty files are left unstaged and reported.

  NEVER runs vercel --prod. NEVER runs db:reset against hosted Supabase.
  DROP/truncate in a migration is a warning, not a stop: db:push still runs
  (new code needs the new schema), then git push.

.USAGE
  npm run ship:fast
  npm run ship:solid
  .\scripts\ship.ps1 -Mode Fast -DryRun
  .\scripts\ship.ps1 -Mode Solid -Message "Scale RPCs and guest search"
#>
param(
  [ValidateSet('Fast', 'Solid')]
  [string]$Mode = 'Fast',

  [int]$Hours = 0,

  [string]$Message = '',

  [switch]$DryRun,
  [switch]$SkipTests,
  [switch]$AllowDestructive
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root 'package.json'))) {
  throw 'Cannot find project root (package.json).'
}
Set-Location $Root

if ($Hours -le 0) {
  $Hours = if ($Mode -eq 'Fast') { 6 } else { 24 }
}

$Cutoff = (Get-Date).AddHours(-$Hours)

Write-Host ''
Write-Host "=== VBNB ship ($Mode) ===" -ForegroundColor Green
Write-Host "Root:   $Root"
Write-Host "Window: last $Hours h (since $($Cutoff.ToString('s')))"
Write-Host 'Deploy: git push -> Vercel (never vercel --prod)'
if ($DryRun) {
  Write-Host 'DRY RUN - no commit / db:push / push' -ForegroundColor Yellow
}

function Assert-ExitOk([string]$Step) {
  if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    throw "$Step failed (exit $LASTEXITCODE)."
  }
}

function Test-Cmd([string]$Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

foreach ($cmd in @('git', 'node', 'npm', 'npx')) {
  if (-not (Test-Cmd $cmd)) { throw "$cmd is required." }
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') {
  Write-Host "[warn] Not on main (on $branch). Push deploys that branch's Vercel target." -ForegroundColor Yellow
}

git fetch origin --quiet 2>$null
$aheadRaw = git rev-list --count "origin/$branch..HEAD" 2>$null
$ahead = 0
if ($aheadRaw -match '^\d+$') { $ahead = [int]$aheadRaw }

$porcelain = @(git status --porcelain --untracked-files=all)
if ($porcelain.Count -eq 0 -and $ahead -eq 0) {
  Write-Host '[ok] Nothing to ship (clean tree, nothing unpushed).' -ForegroundColor DarkGreen
  exit 0
}

$inWindow = New-Object System.Collections.Generic.List[string]
$outWindow = New-Object System.Collections.Generic.List[string]

foreach ($line in $porcelain) {
  if ($line.Length -lt 4) { continue }
  $code = $line.Substring(0, 2)
  $path = $line.Substring(3).Trim()
  if ($path -match ' -> ') {
    $path = ($path -split ' -> ')[-1].Trim()
  }
  $path = $path.Trim('"')

  $full = Join-Path $Root $path
  $isDelete = ($code -match 'D') -or (-not (Test-Path -LiteralPath $full))

  if ($isDelete) {
    # Deletes have no usable mtime - include them so renames/removals
    # from the same work session are not left behind.
    if (-not $inWindow.Contains($path)) { [void]$inWindow.Add($path) }
    continue
  }

  $item = Get-Item -LiteralPath $full -ErrorAction SilentlyContinue
  if (-not $item) {
    if (-not $outWindow.Contains($path)) { [void]$outWindow.Add($path) }
    continue
  }

  if ($item.LastWriteTime -ge $Cutoff) {
    if (-not $inWindow.Contains($path)) { [void]$inWindow.Add($path) }
  } else {
    if (-not $outWindow.Contains($path)) { [void]$outWindow.Add($path) }
  }
}

Write-Host ''
Write-Host "In window ($($inWindow.Count)):" -ForegroundColor Cyan
if ($inWindow.Count -eq 0) {
  Write-Host '  (none)'
} else {
  $inWindow | ForEach-Object { Write-Host "  + $_" }
}

if ($outWindow.Count -gt 0) {
  Write-Host ('Left unstaged - older than {0}h ({1}):' -f $Hours, $outWindow.Count) -ForegroundColor Yellow
  $outWindow | ForEach-Object { Write-Host "  - $_" }
}

if ($inWindow.Count -eq 0 -and $ahead -eq 0) {
  Write-Host "[ok] No files in the $Hours h window. Nothing to commit/push." -ForegroundColor DarkGreen
  exit 0
}

$migPaths = @($inWindow | Where-Object { $_ -like 'supabase/migrations/*.sql' })
$destructive = New-Object System.Collections.Generic.List[string]
$caution = New-Object System.Collections.Generic.List[string]

# Warn-only: DROP of replaced objects is a normal cutover (create new, drop old).
# Skipping db:push here would ship code that calls RPCs that do not exist yet.
$rxDestructive = '(?im)^\s*(drop\s+(table|function|column|type|view|schema|extension)\b|truncate\b|alter\s+table\b[^\r\n]*(drop\s+column|rename\s+to|\bset\s+not\s+null\b))'
$rxCaution = '(?im)^\s*drop\s+policy\b'

foreach ($m in $migPaths) {
  $text = Get-Content -LiteralPath (Join-Path $Root $m) -Raw -ErrorAction SilentlyContinue
  if (-not $text) { continue }
  if ($text -match $rxDestructive) {
    [void]$destructive.Add($m)
  } elseif ($text -match $rxCaution) {
    [void]$caution.Add($m)
  }
}

if ($migPaths.Count -gt 0) {
  Write-Host ''
  Write-Host 'Migrations in window:' -ForegroundColor Cyan
  $migPaths | ForEach-Object { Write-Host "  * $_" }
  if ($caution.Count -gt 0) {
    Write-Host 'Caution (drop policy / recreate - review RLS semantics):' -ForegroundColor Yellow
    $caution | ForEach-Object { Write-Host "  ~ $_" -ForegroundColor Yellow }
  }
  if ($destructive.Count -gt 0) {
    Write-Host 'DROP in migration (old table/function being replaced):' -ForegroundColor Yellow
    $destructive | ForEach-Object { Write-Host "  ! $_" -ForegroundColor Yellow }
    Write-Host 'Will db:push (including DROP) then git push. Prod may error until Vercel is Ready.' -ForegroundColor Yellow
    if ($AllowDestructive) {
      Write-Host '[ok] -AllowDestructive noted; db:push still runs (new code needs new schema).' -ForegroundColor DarkGreen
    }
  }
}

if ($migPaths.Count -gt 0 -and -not $DryRun) {
  Write-Host ''
  Write-Host '-> db:status (must be linked to hosted project)' -ForegroundColor Cyan
  npm run db:status
  Assert-ExitOk 'db:status'
}

if (-not $SkipTests) {
  Write-Host ''
  if ($Mode -eq 'Solid') {
    Write-Host '-> Solid checks: db:reset (LOCAL) + tsc + build + test' -ForegroundColor Cyan
    if (-not $DryRun) {
      npm run db:reset
      Assert-ExitOk 'db:reset'
      npx tsc --noEmit
      Assert-ExitOk 'tsc'
      npm run build
      Assert-ExitOk 'build'
      npm test
      Assert-ExitOk 'test'
    }
  } else {
    Write-Host '-> Fast checks: tsc + test (no db:reset / no build)' -ForegroundColor Cyan
    if (-not $DryRun) {
      npx tsc --noEmit
      Assert-ExitOk 'tsc'
      npm test
      Assert-ExitOk 'test'
    }
  }
} else {
  Write-Host '[warn] -SkipTests: checks skipped' -ForegroundColor Yellow
}

if (-not $Message) {
  $Message = 'Ship {0} window ({1}h): {2} paths' -f $Mode, $Hours, $inWindow.Count
  if ($migPaths.Count -gt 0) {
    $Message += ' (+{0} migrations)' -f $migPaths.Count
  }
}

Write-Host ''
Write-Host "Commit message: $Message" -ForegroundColor Cyan

if ($DryRun) {
  Write-Host ''
  Write-Host '[dry-run] Would: git add (in-window) -> commit -> ' -NoNewline
  if ($migPaths.Count -gt 0) {
    Write-Host 'db:push -> git push'
  } else {
    Write-Host 'git push'
  }
  if ($destructive.Count -gt 0) {
    Write-Host '[dry-run] DROP present: db:push still runs, then git push.' -ForegroundColor Yellow
  }
  if ($ahead -gt 0) {
    Write-Host ('[dry-run] Also {0} local commit(s) already ahead of origin - would push those too.' -f $ahead)
  }
  exit 0
}

$committed = $false
if ($inWindow.Count -gt 0) {
  foreach ($p in $inWindow) {
    git add -- $p
    Assert-ExitOk "git add $p"
  }

  $tmp = Join-Path $env:TEMP ('vbnb-ship-msg-{0}.txt' -f [guid]::NewGuid().ToString('n'))
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($tmp, $Message, $utf8NoBom)

  git commit -F $tmp
  $commitCode = $LASTEXITCODE
  Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue

  if ($commitCode -eq 0) {
    $committed = $true
  } else {
    Write-Host "[warn] git commit exited $commitCode (empty commit or hook). Continuing if anything is ahead." -ForegroundColor Yellow
  }
}

$aheadAfter = 0
$aheadAfterRaw = git rev-list --count "origin/$branch..HEAD" 2>$null
if ($aheadAfterRaw -match '^\d+$') { $aheadAfter = [int]$aheadAfterRaw }

if (-not $committed -and $aheadAfter -eq 0) {
  throw 'Nothing committed and nothing ahead of origin - aborting push.'
}

if ($migPaths.Count -gt 0) {
  Write-Host ''
  Write-Host '-> npm run db:push (before git push; new code needs this schema)' -ForegroundColor Cyan
  npm run db:push
  Assert-ExitOk 'db:push'
}

Write-Host ''
Write-Host '-> git push (triggers Vercel)' -ForegroundColor Cyan
git push -u origin HEAD
Assert-ExitOk 'git push'

$sha = (git rev-parse --short HEAD).Trim()
Write-Host ''
Write-Host "=== Shipped $sha ===" -ForegroundColor Green
Write-Host 'Next:'
Write-Host "  1. Vercel -> deployment Ready, SHA = $sha"
Write-Host '  2. npm run db:status'
Write-Host "  3. Move CHANGELOG 'Chua ship' -> 'Da ship' if you keep one"
if ($outWindow.Count -gt 0) {
  Write-Host '  4. Still dirty (outside window):' -ForegroundColor Yellow
  $outWindow | ForEach-Object { Write-Host "       $_" }
}
if ($destructive.Count -gt 0) {
  Write-Host '  5. DROP already applied with db:push. If prod errors, wait for Vercel Ready.' -ForegroundColor Yellow
}

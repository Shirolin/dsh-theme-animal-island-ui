<#
.SYNOPSIS
  Capture the DeepSeek Harness desktop window without bringing it to the front.

.DESCRIPTION
  Two paths:
    1. CDP (preferred): if the app was launched with --remote-debugging-port,
       ask the renderer for Page.captureScreenshot. This is the same surface
       Playwright captures for the web client: occlusion-proof and text-complete.
    2. DWM fallback: if no debug port is available, register the window as a DWM
       thumbnail on an offscreen host and capture that. Works while covered by
       other windows; may freeze/blank when minimized.

  The CDP path requires a one-time debug launch:
      scripts\dsh-desktop-debug.cmd
  The DWM fallback needs no restart, but runs through Windows PowerShell 5.1.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/capture-desktop.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/capture-desktop.ps1 -OutFile artifacts/smoke/after.png -FullPage
#>
param(
  [int]$Port = 9222,
  [string]$OutFile = '',
  [switch]$FullPage,
  [string]$Target = 'DeepSeek Harness',
  [string]$TitleLike = 'DeepSeek Harness',
  [switch]$NoFallback
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

if (-not $OutFile) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $OutFile = Join-Path $root "artifacts\smoke\desktop-$stamp.png"
}
$OutFile = [System.IO.Path]::GetFullPath($OutFile)
$outDir = [System.IO.Path]::GetDirectoryName($OutFile)
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'node is not on PATH; the CDP screenshot helper needs Node.js' }

Write-Host "[capture] CDP port $Port ..."
$cdpArgs = @((Join-Path $PSScriptRoot 'cdp-shot.mjs'), '--port', $Port, '--out', $OutFile, '--target', $Target)
if ($FullPage) { $cdpArgs += '--full' }
& $node.Source @cdpArgs
$cdpExit = $LASTEXITCODE

if ($cdpExit -eq 0 -and (Test-Path -LiteralPath $OutFile)) {
  $size = (Get-Item -LiteralPath $OutFile).Length
  Write-Host "[capture] CDP ok: $OutFile ($size bytes)"
  exit 0
}

if ($NoFallback) {
  Write-Error "CDP capture failed (exit $cdpExit). Start the app with scripts\dsh-desktop-debug.cmd, or rerun without -NoFallback for DWM."
  exit 1
}

Write-Host '[capture] CDP unavailable; falling back to DWM thumbnail ...'
$winPs = Get-Command powershell.exe -ErrorAction SilentlyContinue
if (-not $winPs) { throw 'powershell.exe (Windows PowerShell 5.1) is required for the DWM fallback' }

$dwmArgs = @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $PSScriptRoot 'dwm-shot.ps1'),
  '-OutFile', $OutFile,
  '-TitleLike', $TitleLike
)
& $winPs.Source @dwmArgs
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $OutFile)) {
  Write-Error "DWM capture failed (exit $LASTEXITCODE)."
  exit 1
}
$size = (Get-Item -LiteralPath $OutFile).Length
Write-Host "[capture] DWM ok: $OutFile ($size bytes)"

# MedExplain_AI — Local Development Startup Script
# Run this script from the project root to start both servers.
# Usage: powershell -ExecutionPolicy Bypass -File start-dev.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$tsx = "$root\node_modules\.bin\tsx.cmd"
$vite = "$root\node_modules\.bin\vite.cmd"

Write-Host "=== MedExplain_AI Local Dev ===" -ForegroundColor Cyan
Write-Host "Starting backend (Express + embedded MongoDB) on http://localhost:5000"
Write-Host "Starting frontend (Vite) on http://localhost:5173"
Write-Host ""
Write-Host "NOTE: On first run, the embedded MongoDB downloads ~592MB MongoDB binary."
Write-Host "This only happens once and takes a few minutes."
Write-Host ""
Write-Host "Open http://localhost:5173 in your browser after both servers start."
Write-Host "Press Ctrl+C to stop all processes."
Write-Host ""

# Start both with concurrently
$concurrently = "$root\node_modules\.bin\concurrently.cmd"
& $concurrently `
    --names "SERVER,CLIENT" `
    --prefix-colors "blue,green" `
    "`"$tsx $root\server\src\server.ts`"" `
    "`"$vite --config $root\client\vite.config.ts`""

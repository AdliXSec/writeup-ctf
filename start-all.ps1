Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "    Starting 0xL33XY 2026 CTF Platform       " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Ensure .env is a file, not a directory created by docker-compose
if (Test-Path -Path "challenge\.env" -PathType Container) {
    Remove-Item -Path "challenge\.env" -Recurse -Force
}
if (!(Test-Path -Path "challenge\.env" -PathType Leaf)) {
    New-Item -Path "challenge\.env" -ItemType File -Force | Out-Null
}

Write-Host "[1/2] Building and Starting Challenges & Game Server..." -ForegroundColor Yellow
Push-Location -Path "challenge"
docker compose build
docker compose up -d
Pop-Location

Write-Host "[2/2] Building and Starting Platform Scoreboard..." -ForegroundColor Yellow
Push-Location -Path "platform"
docker compose build
docker compose up -d
Pop-Location

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " CTF Platform is LIVE!" -ForegroundColor Green
Write-Host " URL: http://localhost:8000" -ForegroundColor Green
Write-Host " To stop, run .\stop-all.ps1" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "    Starting 0xL33XY 2026 CTF Platform       " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Building and Starting Instance Manager & Challenges..." -ForegroundColor Yellow
Push-Location -Path "challenge"
docker compose build
docker compose up -d
Pop-Location

Write-Host "[2/3] Building and Starting Platform Scoreboard..." -ForegroundColor Yellow
Push-Location -Path "platform"
docker compose build
docker compose up -d
Pop-Location

Write-Host "[3/3] Building and Starting React Frontend..." -ForegroundColor Yellow
Push-Location -Path "platform-v2"
docker compose build
docker compose up -d
Pop-Location

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " CTF Platform is LIVE!" -ForegroundColor Green
Write-Host " URL: http://localhost:3000" -ForegroundColor Green
Write-Host " To stop, run .\stop-all.ps1" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

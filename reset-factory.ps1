Write-Host "=============================================" -ForegroundColor Red
Write-Host "    FACTORY RESET: 0xL33XY 2026 CTF          " -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Red
Write-Host "WARNING: This will DESTROY all databases, users, scores, and game states." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel, or wait 5 seconds to proceed..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[1/3] Destroying Instance Manager & Challenges state..." -ForegroundColor Cyan
Push-Location -Path "challenge"
docker compose down -v
if (Test-Path -Path ".env") {
    Remove-Item -Path ".env" -Force
}
Pop-Location

Write-Host "[2/3] Destroying Platform Scoreboard database..." -ForegroundColor Cyan
Push-Location -Path "platform"
docker compose down -v
Pop-Location

Write-Host "[3/3] Destroying React Frontend state..." -ForegroundColor Cyan
Push-Location -Path "platform-v2"
docker compose down -v
Pop-Location

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " Factory Reset complete! The CTF is now clean." -ForegroundColor Green
Write-Host " Run .\start-all.ps1 to start a fresh competition." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

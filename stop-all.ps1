Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "    Stopping Play IT 2026 CTF Platform       " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Stopping Challenges & Game Server..." -ForegroundColor Yellow
Push-Location -Path "challenge"
docker compose down
Pop-Location

Write-Host "[2/2] Stopping Platform Scoreboard..." -ForegroundColor Yellow
Push-Location -Path "platform"
docker compose down
Pop-Location

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " All CTF services stopped successfully." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

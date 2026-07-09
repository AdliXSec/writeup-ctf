Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "    Stopping 0xL33XY 2026 CTF Platform       " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Stopping Platform Scoreboard..." -ForegroundColor Yellow
Push-Location -Path "platform"
docker compose down
Pop-Location

Write-Host "[2/2] Stopping Instance Manager & Challenges..." -ForegroundColor Yellow
Push-Location -Path "challenge"
# Force remove any lingering dynamic challenge containers attached to the network
$containers = docker ps -q --filter "network=ctf-net" --filter "name=ctf-"
if ($containers) {
    docker stop $containers
    docker rm $containers
}
docker compose down
Pop-Location

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " All CTF services stopped successfully." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

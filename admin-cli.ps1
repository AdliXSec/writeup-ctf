param (
    [string]$Action = "list",
    [string]$TeamId = "",
    [string]$Challenge = ""
)

$apiUrl = "http://localhost:9000"

if ($Action -eq "list") {
    Write-Host "Fetching all active instances..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/instances" -Method Get
        if ($response.instances.Count -eq 0) {
            Write-Host "No active instances found." -ForegroundColor Yellow
        } else {
            $response.instances | Format-Table -Property team_id, challenge, port, expires_at
        }
    } catch {
        Write-Host "Error fetching instances: $_" -ForegroundColor Red
    }
} elseif ($Action -eq "stop") {
    if ([string]::IsNullOrEmpty($TeamId) -or [string]::IsNullOrEmpty($Challenge)) {
        Write-Host "Error: Both -TeamId and -Challenge are required to stop an instance." -ForegroundColor Red
        Write-Host "Usage: .\admin-cli.ps1 -Action stop -TeamId 1 -Challenge fetcher" -ForegroundColor Yellow
        exit
    }
    
    Write-Host "Stopping challenge '$Challenge' for Team '$TeamId'..." -ForegroundColor Cyan
    $body = @{
        team_id = [int]$TeamId
        challenge = $Challenge
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/instances/stop" -Method Post -Body $body -ContentType "application/json"
        Write-Host "Success: $($response.status)" -ForegroundColor Green
    } catch {
        Write-Host "Error stopping instance: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Unknown action: $Action" -ForegroundColor Red
    Write-Host "Valid actions: list, stop" -ForegroundColor Yellow
}

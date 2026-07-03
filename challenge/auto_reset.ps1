Set-Location $PSScriptRoot
Write-Host "Memulai auto-reset CTF setiap 20 menit..."
while ($true) {
    Write-Host "[$(Get-Date)] Me-reset container agar kembali ke state awal..."
    
    $rnd = -join ((48..57) + (97..122) | Get-Random -Count 12 | % {[char]$_})
    $envContent = @"
FLAG_FETCHER=LEEXY{_r_u_the_next_cve_hunter_$rnd}
FLAG_NSLOOKUP=LEEXY{nslookup_command_injection_$rnd}
FLAG_GAGWIKI=LEEXY{sqli_admin_bypass_$rnd}
FLAG_SVG_VIEWER=LEEXY{xxe_file_read_svg_$rnd}
FLAG_PASSFORGE=LEEXY{passforge_hash_extension_$rnd}
PROOF_PASSFORGE=PROOF{passforge_unlock_$rnd}
FLAG_PAPERMAKER=LEEXY{papermaker_yaml_deserialization_rce_$rnd}
FLAG_ARCHIVEDESK=LEEXY{archivedesk_weak_crypto_idor_$rnd}
FLAG_BETORGANIZER=LEEXY{betorganizer_toctou_ssti_$rnd}
FLAG_ACTION_PACKED=LEEXY{action_packed_broken_access_control_$rnd}
FLAG_SILENT_ORACLE=LEEXY{silent_oracle_graphql_sqli_$rnd}
FLAG_NEON_REACTOR=LEEXY{neon_reactor_magic_hash_mass_assignment_$rnd}
FLAG_OPTIX_ARCHIVER=LEEXY{optix_archiver_imagetragick_lfi_$rnd}
"@
    Set-Content -Path ".env" -Value $envContent
    
    docker compose up --force-recreate -d
    Write-Host "[$(Get-Date)] Reset selesai! Menunggu 20 menit..."
    Start-Sleep -Seconds 1200
}

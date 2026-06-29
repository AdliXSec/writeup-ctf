#!/bin/sh
# Script untuk mereset container challenge CTF kembali ke state awal
cd /challenge

while true; do
  echo "[$(date)] Me-reset container CTF..."

  RND1=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 12 | head -n 1)
  RND2=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 12 | head -n 1)
  RND3=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 12 | head -n 1)
  RND4=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 12 | head -n 1)
  RND5=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 12 | head -n 1)
  RND6=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 12 | head -n 1)
  RND7=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 12 | head -n 1)
  RND8=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 12 | head -n 1)
  RND9=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 12 | head -n 1)

  cat > .env <<EOF
FLAG_FETCHER=LEEXY{_r_u_the_next_cve_hunter_${RND1}}
FLAG_NSLOOKUP=LEEXY{nslookup_command_injection_${RND2}}
FLAG_GAGWIKI=LEEXY{sqli_admin_bypass_${RND3}}
FLAG_SVG_VIEWER=LEEXY{xxe_file_read_svg_${RND4}}
FLAG_PASSFORGE=LEEXY{passforge_hash_extension_${RND5}}
PROOF_PASSFORGE=PROOF{passforge_unlock_${RND6}}
FLAG_PAPERMAKER=LEEXY{papermaker_yaml_deserialization_rce_${RND7}}
FLAG_ARCHIVEDESK=LEEXY{archivedesk_weak_crypto_idor_${RND8}}
FLAG_BETORGANIZER=LEEXY{betorganizer_toctou_ssti_${RND9}}
EOF

  # Recreate ONLY the challenge containers, skipping resetter
  docker compose up --force-recreate -d fetcher nslookup gag-wiki svg-viewer passforge papermaker archivedesk betorganizer
  
  echo "[$(date)] Reset selesai. Menunggu 5 menit..."
  sleep 300
done

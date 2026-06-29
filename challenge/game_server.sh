#!/bin/sh
# Game Server Engine for CTF (NTP-Synced Ticks)
cd /challenge

while true; do
  # Menghitung detik hingga batas 300 detik (5 menit) berikutnya
  NOW=$(date +%s)
  REMAINING=$(( 300 - (NOW % 300) ))
  
  echo "[$(date)] Menunggu $REMAINING detik untuk sinkronisasi Tick berikutnya (NTP Sync)..."
  sleep $REMAINING

  echo "[$(date)] WAKTU TICK TIBA! Mengeksekusi rotasi flag dan Factory Reset..."

  TICK=1
  if grep -q "CTF_TICK=" .env 2>/dev/null; then
    TICK=$(grep "CTF_TICK=" .env | cut -d'=' -f2)
    TICK=$((TICK+1))
  fi

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
CTF_TICK=${TICK}
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

  # Factory Reset: Menghapus perubahan attacker dan memasukkan flag baru
  docker compose up --force-recreate -d fetcher nslookup gag-wiki svg-viewer passforge papermaker archivedesk betorganizer
  
  echo "[$(date)] Factory Reset selesai untuk Tick #${TICK}."
done

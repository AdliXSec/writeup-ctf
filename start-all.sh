#!/bin/bash
echo -e "\033[0;36m=============================================\033[0m"
echo -e "\033[0;36m    Starting 0xL33XY 2026 CTF Platform       \033[0m"
echo -e "\033[0;36m=============================================\033[0m"
echo ""

echo -e "\033[1;33m[1/2] Building and Starting Instance Manager & Challenges...\033[0m"
cd challenge || exit 1
docker compose build
docker compose up -d
cd ..

echo -e "\033[1;33m[2/2] Building and Starting Platform Scoreboard...\033[0m"
cd platform || exit 1
docker compose build
docker compose up -d
cd ..

echo ""
echo -e "\033[0;32m=============================================\033[0m"
echo -e "\033[0;32m CTF Platform is LIVE!\033[0m"
echo -e "\033[0;32m URL: http://localhost:8000\033[0m"
echo -e "\033[0;32m To stop, run ./stop-all.sh\033[0m"
echo -e "\033[0;32m=============================================\033[0m"

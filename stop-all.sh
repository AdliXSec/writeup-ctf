#!/bin/bash
echo -e "\033[0;36m=============================================\033[0m"
echo -e "\033[0;36m    Stopping 0xL33XY 2026 CTF Platform       \033[0m"
echo -e "\033[0;36m=============================================\033[0m"
echo ""

echo -e "\033[1;33m[1/2] Stopping Instance Manager & Challenges...\033[0m"
cd challenge || exit 1
docker compose down
cd ..

echo -e "\033[1;33m[2/2] Stopping Platform Scoreboard...\033[0m"
cd platform || exit 1
docker compose down
cd ..

echo ""
echo -e "\033[0;32m=============================================\033[0m"
echo -e "\033[0;32m All CTF services stopped successfully.\033[0m"
echo -e "\033[0;32m=============================================\033[0m"

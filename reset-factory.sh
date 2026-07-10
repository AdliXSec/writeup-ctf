#!/bin/bash
echo -e "\033[0;31m=============================================\033[0m"
echo -e "\033[0;31m    FACTORY RESET: 0xL33XY 2026 CTF          \033[0m"
echo -e "\033[0;31m=============================================\033[0m"
echo -e "\033[1;33mWARNING: This will DESTROY all databases, users, scores, and game states.\033[0m"
echo -e "\033[1;33mPress Ctrl+C to cancel, or wait 5 seconds to proceed...\033[0m"
sleep 5

echo -e "\033[1;36m[1/3] Destroying Instance Manager & Challenges state...\033[0m"
cd challenge || exit 1
docker compose down -v
rm -f .env
cd ..

echo -e "\033[1;36m[2/3] Destroying Platform Scoreboard database...\033[0m"
cd platform || exit 1
docker compose down -v
cd ..

echo -e "\033[1;36m[3/3] Destroying React Frontend state...\033[0m"
cd platform-v2 || exit 1
docker compose down -v
cd ..

echo ""
echo -e "\033[0;32m=============================================\033[0m"
echo -e "\033[0;32m Factory Reset complete! The CTF is now clean.\033[0m"
echo -e "\033[0;32m Run ./start-all.sh to start a fresh competition.\033[0m"
echo -e "\033[0;32m=============================================\033[0m"

#!/bin/bash

ACTION=${1:-list}
TEAM_ID=$2
CHALLENGE=$3

API_URL="http://localhost:9000"

if [ "$ACTION" == "list" ]; then
    echo -e "\033[0;36mFetching all active instances...\033[0m"
    RESPONSE=$(curl -s "$API_URL/instances")
    
    if [ -z "$RESPONSE" ]; then
        echo -e "\033[0;31mError fetching instances: Unable to connect to the remote server\033[0m"
        exit 1
    fi
    
    # Use python to format the JSON output nicely as a table
    python -c "
import sys, json
try:
    data = json.loads(sys.argv[1])
    instances = data.get('instances', [])
    if not instances:
        print('\033[0;33mNo active instances found.\033[0m')
    else:
        print(f'{str(\"team_id\").ljust(10)} {str(\"challenge\").ljust(20)} {str(\"port\").ljust(10)} expires_at')
        print('-'*70)
        for i in instances:
            print(f'{str(i.get(\"team_id\")).ljust(10)} {str(i.get(\"challenge\")).ljust(20)} {str(i.get(\"port\")).ljust(10)} {i.get(\"expires_at\")}')
except Exception as e:
    print('\033[0;31mError parsing response:\033[0m', e)
" "$RESPONSE"

elif [ "$ACTION" == "stop" ]; then
    if [ -z "$TEAM_ID" ] || [ -z "$CHALLENGE" ]; then
        echo -e "\033[0;31mError: Both Team ID and Challenge name are required to stop an instance.\033[0m"
        echo -e "\033[0;33mUsage: ./admin-cli.sh stop 1 fetcher\033[0m"
        exit 1
    fi
    
    echo -e "\033[0;36mStopping challenge '$CHALLENGE' for Team '$TEAM_ID'...\033[0m"
    
    JSON_BODY=$(cat <<EOF
{
    "team_id": $TEAM_ID,
    "challenge": "$CHALLENGE"
}
EOF
)
    
    RESPONSE=$(curl -s -X POST "$API_URL/instances/stop" \
        -H "Content-Type: application/json" \
        -d "$JSON_BODY")
    
    echo -e "\033[0;32mResponse: $RESPONSE\033[0m"
    
else
    echo -e "\033[0;31mUnknown action: $ACTION\033[0m"
    echo -e "\033[0;33mValid actions: list, stop\033[0m"
fi

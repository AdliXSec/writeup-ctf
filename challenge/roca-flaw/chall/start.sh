#!/bin/sh
mkdir -p /run/sshd

# Encrypt dynamic flag with ROCA-vulnerable key
python3 /app/encrypt_flag.py

# Remove flag from environment
unset FLAG

# Start SSH
exec /usr/sbin/sshd -D -e

#!/bin/sh
mkdir -p /run/sshd

# Encrypt dynamic flag with ROCA-vulnerable key
# Write to /tmp (writable tmpfs) since filesystem is read-only
python3 /app/encrypt_flag.py

# Symlink crypto files to player home directory
ln -sf /tmp/public_key.txt /home/ctf/public_key.txt
ln -sf /tmp/encrypted_flag.txt /home/ctf/encrypted_flag.txt

# Remove flag from environment
unset FLAG

# Start SSH
exec /usr/sbin/sshd -D -e

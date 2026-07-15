#!/bin/sh

# Set dynamic flag in /tmp which is writable
echo "Selamat! Kamu berhasil login via SSH." > /tmp/flag.txt
echo "Berikut adalah flag kamu:" >> /tmp/flag.txt
echo "$FLAG" >> /tmp/flag.txt

# Secure the flag file
chown ctf:ctf /tmp/flag.txt
chmod 444 /tmp/flag.txt

# Remove env var so it can't be read directly
unset FLAG

# Start SSH daemon in foreground mode
exec /usr/sbin/sshd -D -e

FROM alpine:latest

# Install OpenSSH and create user 'ctf' with password 'ctf'
RUN apk add --no-cache openssh && \
    adduser -D -s /bin/sh ctf && \
    echo "ctf:ctf" | chpasswd

# Configure SSH daemon and generate host keys
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/g' /etc/ssh/sshd_config && \
    sed -i 's/AllowTcpForwarding yes/AllowTcpForwarding no/g' /etc/ssh/sshd_config && \
    ssh-keygen -A

COPY start.sh /app/start.sh

# Symlink flag.txt to writable /tmp
RUN chmod +x /app/start.sh && \
    ln -s /tmp/flag.txt /home/ctf/flag.txt

EXPOSE 22

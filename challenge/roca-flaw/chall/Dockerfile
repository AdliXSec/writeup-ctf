FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssh-server python3 nano less file && \
    rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash ctf && \
    echo "ctf:ctf" | chpasswd

RUN mkdir -p /run/sshd && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config

COPY encrypt_flag.py /app/encrypt_flag.py
COPY start.sh /app/start.sh
COPY hint.txt /home/ctf/README.txt
COPY opt_research /opt/research

RUN chmod +x /app/start.sh && \
    chmod -R 444 /opt/research && chmod 555 /opt/research

EXPOSE 22

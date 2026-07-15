FROM php:8.1-apache

WORKDIR /var/www/html/

# Secure permissions
RUN chown -R root:root /var/www/html && \
    chmod -R 755 /var/www/html

COPY src/ /var/www/html/
COPY start.sh /app/start.sh

# Make start.sh executable and symlink flag.php to writable /tmp
RUN chmod +x /app/start.sh && \
    rm -f /var/www/html/flag.php && \
    ln -s /tmp/flag.php /var/www/html/flag.php

EXPOSE 80

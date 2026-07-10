FROM php:8.1-apache

WORKDIR /var/www/html/

# Secure permissions
RUN chown -R root:root /var/www/html &&     chmod -R 755 /var/www/html

COPY src/ /var/www/html/
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 80

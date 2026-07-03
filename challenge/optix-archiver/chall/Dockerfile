FROM php:7.4-apache

# Install ImageMagick and required tools
RUN apt-get update && apt-get install -y \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Configure Apache
RUN a2enmod rewrite

# Copy challenge files
COPY . /var/www/html/
RUN rm -f /var/www/html/server.js /var/www/html/package*.json
RUN rm /var/www/html/index.html || true
RUN mv /var/www/html/public/* /var/www/html/ || true
RUN rm -rf /var/www/html/public

# Setup API endpoint
RUN mkdir -p /var/www/html/api/v1/process
COPY api/v1/process/index.php /var/www/html/api/v1/process/index.php

# Create uploads directory with appropriate permissions
RUN mkdir -p /var/www/html/uploads && chown -R www-data:www-data /var/www/html/uploads && chmod 777 /var/www/html/uploads

# Disable ImageMagick security policies for simulation
RUN rm -f /etc/ImageMagick-6/policy.xml

# Set permissions for everything
RUN chown -R www-data:www-data /var/www/html

# Create flag placeholder
RUN echo "LEEXY{test_flag_local_im_tragick}" > /flag.txt \
    && chmod 444 /flag.txt

EXPOSE 8190

RUN echo "Listen 8190" >> /etc/apache2/ports.conf
CMD ["apache2-foreground"]

RUN rm -f /flag.txt && ln -s /tmp/flag.txt /flag.txt

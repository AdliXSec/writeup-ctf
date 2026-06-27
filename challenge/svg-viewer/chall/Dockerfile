FROM php:8.2-apache

# dom & libxml sudah include by default di php:8.2-apache

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Plant flag
RUN echo "LEEXY{670ef0276339a9989da10a47d46a6115}" > /flag.txt

# Setup .git directory (exposed - part of the challenge)
WORKDIR /var/www/html

COPY dashboard.php .
COPY index.php .

# Buat direktori uploads
RUN mkdir -p /var/www/html/uploads && chmod 777 /var/www/html/uploads

# Simulasi .git directory yang terekspos
RUN mkdir -p /var/www/html/.git/refs/heads && \
    mkdir -p /var/www/html/.git/objects && \
    echo "ref: refs/heads/main" > /var/www/html/.git/HEAD && \
    echo "[core]\n\trepositoryformatversion = 0\n\tfilemode = true" > /var/www/html/.git/config && \
    echo "SVG Viewer Challenge" > /var/www/html/.git/description

# Apache config - allow .git access (vulnerable config)
RUN echo '<Directory /var/www/html/.git>\n\
    Options Indexes\n\
    Require all granted\n\
    </Directory>' > /etc/apache2/conf-available/git-exposed.conf && \
    a2enconf git-exposed

EXPOSE 80

CMD ["apache2-foreground"]

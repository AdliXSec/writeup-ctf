#!/bin/sh
sed -i "s/PLACEHOLDER_FLAG/$FLAG/g" /var/www/html/flag.php
unset FLAG
apache2-foreground

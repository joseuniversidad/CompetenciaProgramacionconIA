FROM php:8.3-apache
RUN apt-get update && apt-get install -y libonig-dev libxml2-dev libzip-dev unzip git && docker-php-ext-install pdo_mysql mbstring xml zip bcmath && a2enmod rewrite && a2dismod mpm_event mpm_worker 2>/dev/null; a2enmod mpm_prefork && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader && chown -R www-data:www-data storage bootstrap/cache
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 80
CMD ["/usr/local/bin/entrypoint.sh"]

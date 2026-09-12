FROM php:8.3-cli
RUN apt-get update && apt-get install -y libonig-dev libxml2-dev libzip-dev unzip git && docker-php-ext-install pdo_mysql mbstring xml zip bcmath && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader && chown -R www-data:www-data storage bootstrap/cache
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 80
CMD ["/usr/local/bin/entrypoint.sh"]

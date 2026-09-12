#!/bin/sh
set -e

PORT="${PORT:-80}"

php artisan config:clear
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec php -S 0.0.0.0:"${PORT}" -t public server.php

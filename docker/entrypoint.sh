#!/bin/sh
set -e

PORT="${PORT:-80}"

if [ -z "${APP_KEY:-}" ]; then
    echo "WARNING: APP_KEY no esta definido. Generando una clave temporal para esta ejecucion."
    echo "Las sesiones y cookies cifradas se invalidaran en cada reinicio hasta que definas"
    echo "APP_KEY de forma permanente en las variables de entorno de Railway."
    export APP_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
fi

php artisan config:clear
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec php -S 0.0.0.0:"${PORT}" -t public server.php

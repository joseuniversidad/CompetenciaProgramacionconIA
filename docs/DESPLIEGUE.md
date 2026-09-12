# Publicación con dominio

La aplicación requiere hosting que ejecute PHP/Laravel y MySQL. Un alojamiento solo estático no cumple el reto. El Dockerfile sirve la carpeta public mediante Apache. Docker no está instalado en la computadora de desarrollo; esta configuración se entrega preparada, no se afirma haberla ejecutado ni desplegado.

## En un servidor con Docker Compose
1. Clonar el repositorio del equipo. Copiar .env.example a .env.
2. Definir APP_KEY con `php artisan key:generate --show` en la instalación local y copiar el resultado solo a las variables del servidor.
3. Definir APP_URL=https://dominio-del-equipo, APP_ENV=production y APP_DEBUG=false. Configurar una contraseña fuerte para DB_PASSWORD, un usuario DB_USERNAME distinto de root y MYSQL_ROOT_PASSWORD. Definir ADMIN_EMAIL/ADMIN_PASSWORD propios y SEED_DEMO=true solo para evaluación.
4. Ejecutar `docker compose up -d --build`.
5. Ejecutar `docker compose exec app php artisan migrate --seed --force`.
6. Ejecutar `docker compose exec app php artisan config:cache` y `docker compose exec app php artisan view:cache`.
7. Configurar el proxy HTTPS del proveedor hacia puerto 8080, DNS del dominio y volumen persistente MySQL. Si hay balanceador TLS, configurar proxies confiables y cookies seguras según el proveedor.
8. Verificar `/up`, `/api/departments`, dashboard, mapa, inicio de sesión y guardar una medición. Comprobar que .env no es accesible públicamente. Hacer copia de seguridad de MySQL antes de actualizaciones.

## En hosting Laravel administrado
Usar PHP 8.3, directorio public/, instalar Composer desde composer.lock, configurar MySQL y las variables anteriores. Ejecutar migraciones y seeder una vez. Mantener storage y bootstrap/cache escribibles. Evitar reconstruir APP_KEY en cada despliegue.

## GitHub
El repositorio local contiene el código y commits reales. Crear el repositorio del equipo en GitHub, añadir su URL con `git remote add origin URL` y usar `git push -u origin HEAD`. No subir .env, ACCESO-LOCAL.txt, vendor ni archivos de sesión. Las credenciales de GitHub se configuran en el gestor de credenciales, no en el código.

## Criterio de finalización
Guardar aquí la URL pública y GitHub reales cuando se publiquen y registrar la prueba externa. Actualmente esos destinos están pendientes de que el equipo proporcione su cuenta o servidor; una URL localhost no satisface el despliegue en nube exigido.

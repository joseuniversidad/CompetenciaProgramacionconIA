# Solar GT

Aplicación Laravel para registrar y monitorear generación solar en los 22 departamentos de Guatemala. Incluye paneles, granjas, mediciones mensuales, mapa, reportes CSV, alertas y proyección explicable.

## Ejecutar en esta computadora

La aplicación se configuró con PHP 8.3 y MySQL 8.0 en una instancia independiente, puerto 3308. La URL local es http://127.0.0.1:8000. Las credenciales administrativas locales están en `ACCESO-LOCAL.txt`, excluido de Git.

Desde PowerShell: `./iniciar.ps1`. Requiere las rutas de PHP/MySQL instaladas en Laragon. El script inicia la base del proyecto y la aplicación sin modificar otras bases. Para detener únicamente estos servicios: `./detener.ps1`.

## Instalación en otra computadora

1. Instalar PHP 8.2 o superior con pdo_mysql, mbstring, xml, curl, zip y Composer. Crear una base MySQL vacía.
2. Ejecutar `composer install`.
3. Copiar `.env.example` a `.env` y configurar DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME y DB_PASSWORD.
4. Configurar ADMIN_EMAIL y ADMIN_PASSWORD con credenciales propias. Usar SEED_DEMO=true si se requieren datos simulados.
5. Ejecutar `php artisan key:generate`, `php artisan migrate --seed` y `php artisan serve`.
6. Abrir http://127.0.0.1:8000. No requiere compilación de Node: CSS y JavaScript están en public.

## Entregables

- `docs/MANUAL.md`: objetivos, manual resumido, arquitectura y decisiones.
- `docs/RUBRICA.md`: trazabilidad de RF-01 a RF-17 y criterios de evaluación.
- `docs/IA-Y-EQUIPO.md`: evidencia de uso de IA y créditos pendientes de identificación humana.
- `docs/DESPLIEGUE.md`: instalación pública con Docker y MySQL.
- `docs/DIAGRAMA.md` y `public/diagrama.svg`: relaciones de base de datos.
- `public/openapi.json`: documentación formal de las consultas REST.
- `public/presentacion.html`: presentación de 9 diapositivas, navegable con flechas, con diagrama y guion de demostración. Abrir /presentacion.html.
- `tests/Feature/SolarTest.php`: pruebas de negocio y validación.

## Verificación

`php artisan test` ejecuta pruebas aisladas con SQLite en memoria, sin alterar MySQL de demostración. La aplicación en ejecución usa MySQL. `php artisan route:list` enumera API y administración. `composer audit` revisa avisos de seguridad de dependencias.

## Alcance y estado

Los datos de demostración son sintéticos, no mediciones oficiales. La instalación local está separada de los demás proyectos. La publicación pública y el enlace GitHub requieren una cuenta/destino proporcionado por el equipo; no se considera completada la entrega en nube hasta comprobar la URL externa. El historial de Git registra trabajo real de esta sesión; no sustituye fotos ni check-in exigidos por el organizador.

## Referencias

- Bases específicas: Competencia_Programacion_con_IA_Generacion_Solar_Guatemala.pdf, RF-01 a RF-17.
- Reglamento: Bases para Competencia Dia del Programador.docx.
- Ponderaciones: Rubrica de Evaluación.xlsx, I5:I10.
- Laravel: https://laravel.com/docs/12.x
- Leaflet: https://leafletjs.com/examples/quick-start/
- Chart.js: https://www.chartjs.org/docs/latest/

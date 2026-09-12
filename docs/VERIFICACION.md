# Verificación realizada

Fecha: 12 de septiembre de 2026. Entorno local Windows, PHP 8.3.28, Laravel 12.69.2 y MySQL 8.0.30.

## Pruebas automatizadas
- `php artisan test`: 9 pruebas, 31 aserciones, correctas. Incluye 7 pruebas específicas del dominio y 2 comprobaciones base de Laravel.
- Misma suite contra MySQL en base independiente solar_gt_test: 9 pruebas, 31 aserciones, correctas.
- `php vendor/bin/pint --test`: correcto.
- `node --check public/app.js`: correcto.
- `php artisan view:cache`: plantillas Blade compiladas correctamente.

## Comprobaciones HTTP contra MySQL de demostración
Inicio de sesión con credenciales locales generado, sesión y CSRF; actualización de una medición conservando su valor original; rechazo 422 de registro duplicado y de más de dos decimales. API de departamentos: 22 registros. Alertas de agosto: 5. Exportación CSV: HTTP 200, encabezado y 22 filas departamentales.

## Revisión en navegador
Dashboard con valores reales de la base simulada; mapa de Guatemala con 22 marcadores y popup; detalle con equipos e historial; proyección con tabla de backtest; ajuste de filtros en viewport móvil de 390 px. Presentación HTML y diagrama revisados visualmente.

## Valores de control para agosto de 2026
22 granjas, 31,790 paneles, 17,710 kW instalados, 9,801 familias declaradas, 1,846,696.8 kWh reales, 738,678.72 kg CO₂ evitados y 5 alertas. Datos sintéticos.

## Límites de lo verificado
No hay URL pública ni repositorio remoto verificado todavía. Docker no se ejecutó porque no está instalado en el entorno. No se han fabricado fotos, check-in ni validación humana. Las teselas cartográficas requieren conexión externa y pueden cargar progresivamente.

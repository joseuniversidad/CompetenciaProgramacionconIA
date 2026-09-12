# Manual y arquitectura de Solar GT

## Objetivo
Centralizar el inventario y la generación solar por departamento, mostrar su impacto y detectar desempeño inferior al esperado. La solución atiende al reto específico de Laravel; este requisito prevalece sobre la libertad de framework del reglamento general.

## Manual de usuario
1. Vista general: elegir departamento y mes. “Ver acumulado” incluye todos los meses registrados. Energía y CO₂ responden al período; capacidad, paneles y familias corresponden al inventario actual.
2. Mapa: arrastrar, usar zoom y seleccionar marcadores. Cada departamento tiene un color. Detalle muestra equipos, familias e historial. Coordenadas de demostración aproximadas a cabeceras, no instalaciones reales.
3. Acceso administrativo: iniciar sesión con las credenciales de la instalación.
4. Modelos de panel: registrar marca, modelo, potencia en kW y estado. 550 W se ingresa como 0.550 kW.
5. Granjas: registrar nombre, departamento, latitud, longitud y familias. Asociar uno o varios modelos con cantidades positivas. Editar permite cambiar el estado a inactiva y volver a activarla. No se borra el historial.
6. Generación: registrar una medición real y esperada por granja y mes. Los duplicados se rechazan; usar Editar para correcciones. Solo se admiten granjas activas. Si se requiere corregir el historial de una inactiva, reactivarla temporalmente, corregir y desactivarla de nuevo.
7. Alertas: consultar registros que cumplen el umbral. Al corregir la generación se crea, actualiza o elimina automáticamente su alerta. Son alertas de desempeño de registros, no tickets con resolución manual.
8. Proyecciones: seleccionar granja. Consultar la proyección del mes posterior al último registro, MAE y tabla de evaluación histórica.
9. Reportes: comparar departamentos y descargar CSV. El enlace Exportar usa el filtro de departamento y período activo.

## Unidades y reglas
Capacidad = suma de cantidad × potencia nominal, kW. Incluye equipos instalados aunque su modelo de catálogo esté inactivo. Estado inactivo del catálogo no significa equipo retirado.
Generación real y esperada en kWh/mes. CO₂ = kWh reales × 0.40, según factor del reto; toneladas = kg/1000.
Alerta si esperada > 0 y real ≤ 0.8 × esperada. Desviación = 100 × (1 − real/esperada). Con esperada cero no se calcula porcentaje ni alerta.
Familias = suma por granja, no hogares únicos nacionales. El inventario actual no reconstruye capacidades históricas.

## Proyección y justificación
Se utiliza promedio móvil de tres meses consecutivos. Es simple, auditable y viable con poco historial; suaviza cambios aislados. Para proyectar abril se usan enero, febrero y marzo. La evaluación de abril compara luego esa proyección con abril real, sin fuga de información futura. Se repite con ventanas móviles y se informa el error absoluto medio (MAE, kWh).
Se devuelve `insufficient_history` si faltan tres meses consecutivos. No se completa una ausencia con cero. No considera radiación, lluvia, cambios de capacidad ni estacionalidad anual. Una alerta puede reducir el promedio y la proyección; el usuario debe interpretar el motivo de la caída. No se presenta como predicción meteorológica ni IA de producción.

## Arquitectura
Laravel 12 y Eloquent modelan las relaciones. SolarController valida solicitudes y relaciones, usa transacciones y entrega JSON. SolarAnalytics concentra estadísticas y proyecciones. Generation mantiene la alerta al guardar mediante el modelo. Las escrituras de la aplicación usan Eloquent; cambios SQL externos requieren recalcular alertas y quedan fuera del flujo soportado.
Blade entrega la sesión y CSRF; JavaScript consume la API. Leaflet usa teselas OpenStreetMap, que requieren conexión a Internet. Chart.js y Leaflet se distribuyen localmente. Fuentes web tienen respaldo Arial. Sesiones y caché en archivos; MySQL persistente.

## Validación y seguridad
Las lecturas son públicas por alcance del observatorio. Administración requiere sesión; contraseñas con hash y formularios con CSRF. Se limita la frecuencia de acceso y API. Se validan mínimos, máximos, fechas y claves foráneas. Escape de contenido al representar nombres. Coordenadas se validan dentro de una caja aproximada de Guatemala; no es validación de pertenencia al polígono departamental.
Las credenciales solo viven en .env, excluido del repositorio. Producción debe usar HTTPS, APP_DEBUG=false y credenciales propias. No alojar la raíz del proyecto como directorio público: usar public/.

# Validación de la primera versión DEMO

Fecha: 3 de noviembre de 2026. Entorno local: Node.js 24, navegador Chromium de escritorio y vista embebida de 390 px. No se utilizaron datos reales ni un backend.

## Comprobaciones automatizadas

Comandos: `npm test` y `npm run build`.

**Resultado: 24 pruebas aprobadas en 3 archivos; TypeScript estricto y compilación Vite correctos.** El workflow de GitHub repite estas comprobaciones para la rama y el pull request.

| Cobertura          | Verificación                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Cuatro escenarios  | Resultados reproducibles, independientes y compatibles con los esquemas.                   |
| Coordenadas        | Cajas y polígonos normalizados dentro del rango 0–1.                                       |
| Modos              | Separación de detección, segmentación y resultados combinados.                             |
| Imágenes propias   | Ausencia de resultados inventados; rechazo de MIME, firmas y tamaños inválidos.            |
| Análisis           | Estado completado, conservación de datos brutos, alerta y evento asociados.                |
| Identificadores    | UUID válidos también cuando `crypto.randomUUID` no está disponible en HTTP.                |
| Reglas             | Habilitación, umbrales, clases, zona y límite de personas.                                 |
| Perfiles           | Bloqueo de análisis para Auditor y de configuración/revisión para roles no habilitados.    |
| Alertas            | Nota obligatoria, transiciones válidas, responsable y actualización de KPI al cerrar.      |
| Semilla y métricas | 16 registros coherentes, sin fechas futuras, métricas derivadas y estado vacío sin NaN.    |
| Persistencia       | Lectura desde una instancia nueva, interrupciones, datos corruptos y cuota insuficiente.   |
| CSV                | Campos DEMO, filas de detecciones, UTF-8, comillas, saltos y protección frente a fórmulas. |

La compilación puede mostrar advertencias de Rollup por anotaciones de comentarios de Zod. No impiden compilar ni corresponden a errores de tipos de la aplicación.

## Recorrido verificado en navegador

- Acceso con perfil Administrador y carga del dashboard con 16 análisis semilla.
- Ejecución completa de Seguridad industrial: 5 detecciones brutas, 4 visibles con umbral 75 %, 2 máscaras y 1 patrón.
- Activación de máscaras y filtro Persona: 2 detecciones visibles.
- Umbral 100 %: estado vacío sin borrar el resultado original.
- Revisión con nota y cierre de la alerta creada; conservación de estado y responsable después de recargar.
- Historial con el análisis nuevo y cero alertas abiertas para ese registro.
- Búsqueda por usuario de prueba y descarga del CSV filtrado de un análisis.
- Carga de un PNG sintético, validación y registro con cero detecciones y explicación de ausencia de inferencia.
- Perfil Auditor con ejecución deshabilitada y rechazo de la ruta administrativa de reglas.
- Vista de análisis a 390 px con menú móvil; ancho de contenido igual al ancho disponible, sin desbordamiento horizontal.
- Inspección visual del dashboard y del visor de análisis en escritorio.

El recorrido de navegador fue una prueba funcional durante el desarrollo, no una suite E2E incorporada al repositorio. No se afirma compatibilidad exhaustiva con todos los navegadores, dispositivos o tecnologías asistivas.

## Límites de la evidencia

- No demuestra precisión de IA, detección real, mAP, recall, latencia productiva ni seguridad del lado servidor.
- Los datos de revisión utilizados son de demostración y no se publican como registros del repositorio.
- No se verificó concurrencia entre pestañas, autenticación real, carga sostenida, accesibilidad con lector de pantalla ni ejecución sobre dispositivos físicos.
- La configuración de reglas y clases dispone de cobertura de lógica; no se automatizó cada combinación de formulario en navegador.
- No hay despliegue público automático. El resultado de CI debe consultarse en el pull request; una ejecución local correcta no sustituye el estado de GitHub Actions.

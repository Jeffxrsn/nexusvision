# Manual de procedimientos — NexusVision DEMO

**Código:** NV-MP-001 · **Versión:** 1.0 · **Fecha:** 3 de noviembre de 2026

## 1. Objetivo y alcance

Establecer los pasos para instalar, operar y demostrar NexusVision: una aplicación web de detección, segmentación y reconocimiento de patrones simulados. Aplica a la primera versión del proyecto VISION AI y a sus cuatro escenarios ilustrados.

Los resultados proceden de plantillas calibradas, no de una inferencia real. La revisión de un ejemplo no debe interpretarse como evidencia sobre personas, productos o incidentes reales.

## 2. Responsabilidades

| Perfil        | Análisis | Consulta y CSV | Revisar/cerrar alertas | Configurar |
| ------------- | -------- | -------------- | ---------------------- | ---------- |
| Administrador | Sí       | Sí             | Sí                     | Sí         |
| Operador      | Sí       | Sí             | No                     | No         |
| Supervisor    | Sí       | Sí             | Sí                     | No         |
| Auditor       | No       | Sí             | No                     | No         |

Estos perfiles organizan la demostración. No hay cuentas reales ni autenticación de servidor. El administrador puede cambiar nombre, descripción y disponibilidad de las escenas predefinidas; crear una plantilla nueva exige programación y calibración.

## 3. Preparación e instalación

**Responsable:** desarrollador o administrador.

1. Instalar Git y Node.js 24 LTS.
2. Abrir una terminal en la carpeta de trabajo.
3. Ejecutar:

   ```bash
   git clone --branch feat/nexusvision-demo https://github.com/Jeffxrsn/nexusvision.git
   cd nexusvision
   npm ci
   npm run dev
   ```

4. Abrir la dirección indicada por Vite.
5. Elegir Administrador, escribir un nombre opcional y entrar a la demo.
6. Confirmar la presencia de **MODO DEMO** en la cabecera.

**Resultado:** aplicación navegable y 16 registros semilla disponibles si el navegador no tenía datos. No se requiere base de datos ni servicio externo de IA.

## 4. Procedimiento de análisis visual

**Responsable:** administrador, operador o supervisor.

**Entrada:** una escena habilitada o un archivo JPG/PNG válido.

1. Abrir **Centro de análisis**.
2. Seleccionar una escena: Seguridad industrial, Almacén inteligente, Control de calidad o Retail.
3. Elegir el perfil:

   | Perfil       | Salida                                                            |
   | ------------ | ----------------------------------------------------------------- |
   | Combinado    | Cajas, máscaras, patrones y alertas aplicables.                   |
   | Detección    | Cajas de objetos; no genera patrones ni alertas de reglas.        |
   | Segmentación | Máscaras poligonales; no genera detecciones ni alertas de reglas. |
   | Patrones     | Detecciones de apoyo y patrones; puede generar alertas.           |

4. Pulsar **Analizar escenario**. El sistema guarda un registro en proceso y bloquea envíos duplicados.
5. Observar las etapas de progreso simulado.
6. Confirmar el estado **Completado** y revisar la cantidad de objetos visibles, confianza y duración de ejemplo.
7. Activar o desactivar **Cajas**, **Máscaras** y, en el almacén, **Zona**.
8. Seleccionar una fila de detección para resaltar su caja.
9. Usar el filtro de clase y el umbral de confianza. No se eliminan los datos brutos.
10. Consultar las pestañas Objetos, Máscaras y Patrones.
11. Abrir Alertas para revisar la evidencia relacionada.

**Salida:** análisis persistido, resultado determinista, evento de finalización y alertas si las reglas activas se cumplen.

### Archivos propios

1. Pulsar **Cargar imagen** y elegir JPG o PNG.
2. El sistema comprueba extensión, MIME, firma, tamaño (máximo 10 MB), decodificación y resolución (máximo 20 megapíxeles).
3. La vista previa aparece solo en la sesión del centro de análisis.
4. Pulsar **Validar imagen** para registrar la entrada. El resultado no contiene detecciones, máscaras ni patrones: esta versión no ejecuta un modelo sobre imágenes propias.
5. Usar **Usar escenario** para regresar a las plantillas.

El archivo no se sube a un servidor ni se guarda dentro del historial. Tras abandonar la vista, el historial conserva su nombre y metadatos y muestra «Imagen local no conservada».

## 5. Procedimiento de revisión de alertas

**Responsable:** administrador o supervisor.

1. Abrir **Alertas** y filtrar por estado, severidad o texto.
2. Seleccionar el hallazgo y leer su evidencia, confianza y regla.
3. Abrir **Ver análisis original** si es necesario inspeccionar la escena.
4. Escribir una observación. Es obligatoria para conservar trazabilidad.
5. Pulsar **Marcar como revisada**. Se registra responsable, fecha, nota y evento.
6. Cuando termine la interpretación del ejemplo, completar la observación y pulsar **Cerrar alerta**.
7. Comprobar el estado cerrado. La alerta permanece en el historial, pero deja de contar como abierta en el dashboard.

No se admite pasar directamente de Nueva a Cerrada. El registro local de eventos conserva las notas de revisión y cierre, hasta un máximo de 500 eventos; no es un registro inmutable.

## 6. Consulta y exportación

**Responsable:** cualquier perfil.

1. Abrir **Historial**.
2. Buscar por ID, origen o usuario. Opcionalmente filtrar por escenario, estado y fechas.
3. Revisar que la fecha inicial no sea posterior a la final.
4. Usar el enlace de detalle para abrir el análisis original.
5. Pulsar **Exportar CSV**. Se exportan los resultados que cumplen los filtros, no solo la página visible.
6. Abrir el archivo con Excel o LibreOffice. Si el programa no separa columnas automáticamente, importarlo como UTF-8 delimitado por comas.

Columnas: modo del sistema, identificador, fecha, usuario, origen, escenario, perfil, clase, confianza porcentual, estado, indicador de semilla y duración simulada. Cada detección ocupa una fila. Los análisis sin detecciones conservan una fila con campos de detección vacíos.

El reporte incluye **DEMO**, conserva las detecciones brutas y protege celdas que podrían interpretarse como fórmulas.

## 7. Configuración de reglas y zonas

**Responsable:** administrador.

1. Abrir **Reglas y patrones**.
2. Ajustar nombre, activación, severidad y confianza mínima de una regla.
3. Para almacén, definir X, Y, ancho y alto de la zona. Todos son valores normalizados: X + ancho y Y + alto no deben superar 1.
4. La alerta de zona se activa cuando el centro de un montacargas visible entra en la región configurada.
5. Para retail, indicar cuántas personas visibles activan el ejemplo de ocupación elevada.
6. Guardar y ejecutar un análisis nuevo.

Las reglas necesitan un patrón semilla compatible, confianza suficiente y detecciones de apoyo habilitadas. No modifican alertas históricas.

## 8. Configuración general y mantenimiento

1. Abrir **Configuración** como Administrador.
2. Cambiar el umbral general, los colores o las clases habilitadas.
3. Guardar y revisar el registro de eventos.
4. En **Escenarios demo**, usar el control de configuración de una tarjeta para editar su nombre, descripción o disponibilidad.
5. Para demostrar un entorno vacío, exportar antes el historial y elegir **Vaciar datos**. Confirmar solo si se quieren eliminar los registros, eventos y preferencias locales.
6. Para recuperar los ejemplos iniciales, elegir **Restablecer demo** y confirmar.

El almacenamiento es local al navegador y al origen. Cambiar de navegador, dominio o puerto crea un entorno independiente. No borrar datos del navegador sin exportar previamente lo necesario.

## 9. Incidencias habituales

| Situación                           | Procedimiento                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm` no se reconoce                | Instalar Node.js y abrir una terminal nueva.                                                             |
| Dependencias ausentes               | Ejecutar `npm ci` dentro de la carpeta del proyecto.                                                     |
| No aparecen objetos                 | Revisar perfil, clase y umbral; una imagen propia no tiene inferencia.                                   |
| No aparecen máscaras                | Usar Combinado o Segmentación y activar Máscaras en el visor.                                            |
| No se genera una alerta             | Verificar regla habilitada, umbrales, clases, zona y modo del análisis.                                  |
| No se puede revisar/configurar      | Cambiar al perfil correspondiente mediante Cerrar sesión o cambiar perfil.                               |
| El archivo no es compatible         | Exportarlo de nuevo como JPG/PNG y reducir tamaño/resolución.                                            |
| No se guardan cambios               | Permitir almacenamiento local y liberar espacio. El sistema muestra un error y no afirma haber guardado. |
| Datos corruptos/incompatibles       | Usar Configuración → Restablecer demo. El sistema no sobreescribe el contenido corrupto al leerlo.       |
| Análisis interrumpido               | Una recarga durante el proceso lo marca como Error; ejecutar uno nuevo.                                  |
| Una imagen desaparece del historial | Es el comportamiento previsto: no se conserva el archivo propio.                                         |

## 10. Guion sugerido para exposición

1. Presentar el objetivo y dejar claro el modo DEMO.
2. Mostrar los KPI calculados desde registros semilla.
3. Ejecutar Seguridad industrial en modo Combinado.
4. Diferenciar una caja delimitadora de una región de segmentación.
5. Subir el umbral y explicar por qué algunas detecciones dejan de verse.
6. Revisar y cerrar una alerta con una observación.
7. Mostrar el historial, recargar y exportar el CSV.
8. Cambiar la zona del almacén o el umbral de una regla y repetir un análisis.
9. Cerrar explicando el contrato `VisionEngine` y los requisitos pendientes para integrar IA real.

## 11. Control de calidad

Ejecutar `npm test` y `npm run build` antes de presentar o proponer cambios. Consultar [VALIDACION.md](VALIDACION.md) para conocer lo efectivamente probado. La segunda fase requiere backend, autenticación, almacenamiento, modelos y métricas independientes.

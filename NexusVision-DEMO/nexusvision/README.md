# NexusVision

Plataforma web de **visión computacional en modo DEMO**, basada en la especificación VISION AI. Permite recorrer un flujo empresarial de análisis visual: seleccionar una escena, explorar objetos y regiones, interpretar patrones, revisar alertas y exportar resultados.

> Esta versión no contiene un modelo entrenado ni ejecuta inferencia de IA. Las cuatro escenas ilustradas usan resultados deterministas. Las imágenes propias se validan y registran sin inventar predicciones. La interfaz y los reportes indican siempre DEMO.

## Ejecutar en tu computadora

Requisito: **Node.js 24 LTS** y Git. Instala Node desde su sitio oficial si aún no está disponible.

```bash
git clone --branch feat/nexusvision-demo https://github.com/Jeffxrsn/nexusvision.git
cd nexusvision
npm ci
npm run dev
```

Abre la dirección local que muestre Vite (normalmente `http://localhost:5173`). Elige **Administrador** y pulsa **Entrar a la demo**. No se necesita contraseña, base de datos, Python, GPU ni API key.

Cuando la rama se integre a `main`, podrás clonar el repositorio sin `--branch feat/nexusvision-demo`.

## Funciones implementadas

| Módulo             | Comportamiento                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Acceso DEMO        | Nombre opcional y perfiles Administrador, Operador, Supervisor y Auditor.                                                         |
| Resumen            | KPI y gráfico de actividad calculados desde los análisis guardados, con períodos de 7 o 30 días.                                  |
| Centro de análisis | Cuatro escenarios, cuatro perfiles de análisis, progreso, cajas, máscaras poligonales, filtros de clase/confianza y detalle.      |
| Escenarios         | Seguridad industrial, almacén, control de calidad y retail; edición de nombre, descripción y disponibilidad.                      |
| Imágenes propias   | JPG/PNG hasta 10 MB y 20 megapíxeles; validación de MIME, extensión, firma y decodificación. Vista previa local sin predicciones. |
| Alertas            | Evidencia, confianza, severidad, nota obligatoria y flujo nueva → revisada → cerrada.                                             |
| Historial          | Búsqueda, escenario, estado, fechas, paginación, detalle y CSV.                                                                   |
| Reglas             | Confianza, severidad, activación, zona normalizada del almacén y límite de ocupación retail.                                      |
| Configuración      | Umbral general, colores, clases visibles, reinicio de datos y registro local de eventos.                                          |

Se crean 16 análisis semilla al abrir un navegador sin datos. Todos están identificados como ejemplos. Después de la primera modificación, se conservan los registros en `localStorage`. Las imágenes subidas no se envían ni se almacenan de forma persistente; solo permanecen en la vista actual.

## Comandos

```bash
npm test           # pruebas de lógica, reglas, persistencia, CSV e imágenes
npm run typecheck  # comprobación estricta de TypeScript
npm run build      # comprobación de tipos y compilación a dist/
npm run preview    # servir la compilación localmente
```

GitHub Actions ejecuta las pruebas y la compilación en los pushes de `main`/`feat/**` y en pull requests. Este workflow valida el proyecto; no lo despliega automáticamente.

## Organización

```text
src/
  app/                 # navegación, sesión DEMO y coordinación de estado
  core/
    domain/            # entidades, validación de contratos y permisos de interfaz
    application/       # análisis, reglas, métricas y trazabilidad
    ports/             # contratos del motor visual y repositorio
  infrastructure/
    vision/            # DemoVisionAdapter determinista
    persistence/       # LocalAnalysisRepository
    export/            # CSV con protección contra fórmulas
  modules/             # dashboard, analysis, alerts, history, scenarios, patterns, settings, guide
  shared/ui/           # componentes y utilidades visuales
  styles/              # diseño adaptable y movimiento reducido
  tests/               # pruebas automatizadas con Vitest
public/scenes/         # ilustraciones SVG propias, calibradas con las plantillas
docs/                  # manual de procedimientos, arquitectura y validación
server/                # documentación de la siguiente fase; no contiene backend ejecutable
```

## Documentación

- [Manual de procedimientos](docs/MANUAL_PROCEDIMIENTOS.md): instalación, operación, responsabilidades, incidencias y guion de demostración.
- [Arquitectura y alcance](docs/ARQUITECTURA.md): capas, datos, reglas y conexión futura con IA real.
- [Validación](docs/VALIDACION.md): pruebas realizadas y límites de la verificación.
- [Backend futuro](server/README.md): contrato previsto para la segunda fase.

## Límites de la versión

- El inicio de sesión y los permisos son demostrativos y se ejecutan en el cliente. **No constituyen un control de seguridad de producción**.
- Los datos son locales a un navegador y origen, modificables desde sus herramientas; no existe sincronización ni auditoría inmutable. Usa una pestaña para editar la demo.
- La confianza y la duración son valores de ejemplo. No equivalen a precisión, mAP, recall ni tiempos de inferencia medidos.
- Las máscaras son polígonos ilustrativos. No se produce segmentación real de píxeles ni seguimiento temporal.
- Las reglas y clases afectan los próximos análisis; los filtros solo afectan la vista. Los resultados brutos y las alertas históricas no se reescriben.
- No incluye reconocimiento facial, biometría, video continuo, decisiones automáticas críticas ni un servicio de IA productivo.
- La interfaz utiliza fuentes web de Google Fonts si están disponibles y fuentes del sistema como alternativa.

Especificación de referencia: `Proyecto_Vision_Computacional_IA_Arquitectura.pdf`, versión 1.0, noviembre de 2026. El PDF original no se publica en este repositorio.

# Servicio de IA — fase posterior

Esta carpeta documenta la integración futura. **No hay un backend ejecutable ni un modelo de IA en esta versión.**

| Método y ruta prevista | Uso |
| --- | --- |
| `POST /api/v1/analyses` | Recibir imagen/referencia, modo y parámetros; devolver ID y estado. |
| `GET /api/v1/analyses/{id}` | Consultar estado y métricas. |
| `GET /api/v1/analyses/{id}/results` | Consultar detecciones, máscaras, patrones y alertas. |
| `GET /api/v1/analyses` | Historial filtrado y paginado. |
| `PATCH /api/v1/alerts/{id}` | Registrar revisión y observación. |
| `GET /api/v1/dashboard` | Agregados por período. |

Tecnologías propuestas en el documento: Python, FastAPI, OpenCV y un detector/segmentador validado. Seleccionar el modelo, su licencia y el dataset requiere una evaluación posterior.

Antes de habilitar un modo REAL se deben implementar autenticación, autorización, almacenamiento, validación de respuestas, pruebas de carga y métricas de calidad. El frontend actual conserva el contrato `VisionEngine` para separar esta integración de las páginas.

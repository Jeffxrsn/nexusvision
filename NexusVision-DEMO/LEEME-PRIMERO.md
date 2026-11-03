# NexusVision DEMO — proyecto listo para ejecutar

El paquete contiene el código fuente, el manual de procedimientos, 24 pruebas automatizadas y un respaldo Git de la rama `feat/nexusvision-demo`.

**Estado de entrega:** código terminado y probado localmente. No se pudo publicar en GitHub porque la integración devolvió `403 Resource not accessible by integration`. La rama y el pull request aún no existen en el servidor. Este paquete permite continuar sin perder el trabajo.

## Probar la aplicación

1. Extrae el ZIP.
2. Instala Node.js 24 LTS si no está disponible.
3. Abre una terminal dentro de la carpeta `nexusvision` incluida en el paquete.
4. Ejecuta:

   ```bash
   npm ci
   npm run dev
   ```

5. Abre la dirección local indicada por Vite.
6. Elige Administrador y pulsa Entrar a la demo.

No necesitas contraseña ni API key. Los resultados son demostrativos, no inferencia real.

El manual está en `nexusvision/docs/MANUAL_PROCEDIMIENTOS.md`.

## Subir el trabajo conservando su historial Git

El archivo `nexusvision-demo.bundle` conserva los commits del repositorio inicial y la implementación. Desde la carpeta donde extraíste el ZIP, usa **una carpeta nueva** llamada `nexusvision-git`:

```bash
git clone --branch feat/nexusvision-demo nexusvision-demo.bundle nexusvision-git
cd nexusvision-git
git remote set-url origin https://github.com/Jeffxrsn/nexusvision.git
git push -u origin feat/nexusvision-demo
```

Si Git te solicita autenticación, inicia sesión localmente con tu cuenta de GitHub y sus mecanismos habituales. No compartas contraseñas ni tokens en el chat. La subida requiere acceso de escritura al repositorio.

Después, abre el repositorio en GitHub y crea un pull request desde `feat/nexusvision-demo` hacia `main`. El archivo `nexusvision/.github/workflows/ci.yml` ejecutará pruebas y compilación. No hace merge ni despliega automáticamente.

También se puede continuar desde ChatGPT al autorizar la integración para `Jeffxrsn/nexusvision` con los permisos de escritura necesarios.

## Verificación reproducible

```bash
npm test
npm run build
```

Resultado de desarrollo: 24 pruebas aprobadas; build correcto; revisión funcional en navegador de análisis, filtros, máscaras, alertas, persistencia, exportación, carga de PNG, perfil Auditor y vista móvil.

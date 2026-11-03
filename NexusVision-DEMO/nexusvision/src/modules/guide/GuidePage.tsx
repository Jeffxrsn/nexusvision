import { ScanLine, Layers, Sparkles, ShieldCheck } from 'lucide-react';
import { PageHeading, Badge } from '../../shared/ui';
export function GuidePage() {
  return (
    <>
      <PageHeading
        eyebrow="TU PRIMER RECORRIDO"
        title="De la imagen a una decisión informada"
        description="Una guía breve para entender y demostrar NexusVision."
      />
      <div className="guide-intro card">
        <Badge tone="teal">SIMULACIÓN FUNCIONAL</Badge>
        <h2>Aprende el flujo. Entiende sus límites.</h2>
        <p>
          NexusVision reproduce el funcionamiento de una plataforma de visión computacional. Sus
          escenas ilustradas tienen resultados predefinidos: no hay un modelo entrenado ni
          inferencia real en esta versión.
        </p>
        <a href="#/analysis" className="button primary">
          Comenzar demostración →
        </a>
      </div>
      <div className="concept-grid">
        {[
          {
            Icon: ScanLine,
            title: 'Detección',
            text: 'Localiza objetos con cajas y asigna una clase y una confianza. Las coordenadas entre 0 y 1 permiten adaptar el visor.',
          },
          {
            Icon: Layers,
            title: 'Segmentación',
            text: 'Representa regiones de la imagen. Aquí se usan polígonos didácticos, no máscaras producidas por un modelo de píxeles.',
          },
          {
            Icon: Sparkles,
            title: 'Patrones',
            text: 'Interpreta relaciones o condiciones: posible ausencia de casco, ocupación, defectos o entrada a una zona.',
          },
          {
            Icon: ShieldCheck,
            title: 'Revisión humana',
            text: 'Una alerta propone una observación. Revisa su evidencia, registra una nota y decide si corresponde cerrarla.',
          },
        ].map(({ Icon, title, text }) => (
          <section className="card" key={title}>
            <Icon size={25} />
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <section className="card guide-steps">
        <h2>Demostración de principio a fin</h2>
        <ol>
          <li>
            <strong>Ingresa como Administrador.</strong> Es un selector de perfil DEMO; no requiere
            credenciales.
          </li>
          <li>
            <strong>Observa Resumen.</strong> Los KPI se calculan a partir de los registros locales.
            Los ejemplos iniciales están identificados como datos semilla.
          </li>
          <li>
            <strong>Abre Seguridad industrial.</strong> Selecciona Análisis combinado y pulsa
            Analizar escenario.
          </li>
          <li>
            <strong>Explora el visor.</strong> Activa máscaras, selecciona una detección y ajusta el
            umbral. Los filtros mantienen intactos los datos brutos.
          </li>
          <li>
            <strong>Revisa la alerta.</strong> Como Administrador o Supervisor, escribe una
            observación y márcala como revisada. Después puedes cerrarla.
          </li>
          <li>
            <strong>Consulta el historial.</strong> Filtra por escenario, fechas o estado y exporta
            el CSV etiquetado DEMO.
          </li>
          <li>
            <strong>Recarga la página.</strong> Los registros y revisiones siguen en este navegador.
            Cambia reglas o zonas y ejecuta otro análisis para comprobar su efecto.
          </li>
        </ol>
      </section>
      <div className="inline-info">
        La fase de IA real requiere un backend, un modelo validado y evaluación con datos
        representativos. La interfaz, por sí sola, no demuestra precisión.
      </div>
    </>
  );
}

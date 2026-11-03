import { z } from 'zod';

export const roleSchema = z.enum(['admin', 'operator', 'supervisor', 'auditor']);
export type Role = z.infer<typeof roleSchema>;
export const roles: Record<Role, string> = {
  admin: 'Administrador',
  operator: 'Operador',
  supervisor: 'Supervisor',
  auditor: 'Auditor',
};
export const canAnalyze = (role: Role) => role !== 'auditor';
export const canReview = (role: Role) => role === 'admin' || role === 'supervisor';
export const canConfigure = (role: Role) => role === 'admin';
const fraction = z.number().min(0).max(1);
export const boxSchema = z
  .object({ x: fraction, y: fraction, width: fraction.positive(), height: fraction.positive() })
  .refine(
    (b) => b.x + b.width <= 1.00001 && b.y + b.height <= 1.00001,
    'La región debe estar dentro de la imagen.',
  );
export type Box = z.infer<typeof boxSchema>;
export const modeSchema = z.enum(['combined', 'detection', 'segmentation', 'patterns']);
export type AnalysisMode = z.infer<typeof modeSchema>;
export const modeLabels: Record<AnalysisMode, string> = {
  combined: 'Análisis combinado',
  detection: 'Detección de objetos',
  segmentation: 'Segmentación',
  patterns: 'Reconocimiento de patrones',
};
export const detectionSchema = z.object({
  id: z.string(),
  classId: z.string(),
  label: z.string(),
  confidence: fraction,
  box: boxSchema,
});
export type Detection = z.infer<typeof detectionSchema>;
export const maskSchema = z.object({
  id: z.string(),
  classId: z.string(),
  label: z.string(),
  confidence: fraction,
  points: z.array(z.tuple([fraction, fraction])).min(3),
  areaRatio: fraction,
});
export type SegmentationMask = z.infer<typeof maskSchema>;
export const patternTypeSchema = z.enum([
  'missing_ppe',
  'restricted_zone',
  'surface_defect',
  'congestion',
]);
export type PatternType = z.infer<typeof patternTypeSchema>;
export const patternSchema = z.object({
  id: z.string(),
  type: patternTypeSchema,
  label: z.string(),
  confidence: fraction,
  evidence: z.string(),
});
export type Pattern = z.infer<typeof patternSchema>;
export const resultSchema = z.object({
  detections: z.array(detectionSchema),
  masks: z.array(maskSchema),
  patterns: z.array(patternSchema),
  durationMs: z.number().nonnegative(),
});
export type VisionResult = z.infer<typeof resultSchema>;
export const analysisSchema = z.object({
  id: z.string(),
  createdAt: z.iso.datetime(),
  createdBy: z.string(),
  sourceName: z.string(),
  scenarioId: z.string().nullable(),
  sourceKind: z.enum(['scenario', 'upload']),
  mode: modeSchema,
  status: z.enum(['processing', 'completed', 'failed']),
  threshold: fraction,
  averageConfidence: fraction,
  result: resultSchema,
  seeded: z.boolean(),
  error: z.string().optional(),
});
export type Analysis = z.infer<typeof analysisSchema>;
export const severitySchema = z.enum(['low', 'medium', 'high']);
export type Severity = z.infer<typeof severitySchema>;
export const alertSchema = z.object({
  id: z.string(),
  analysisId: z.string(),
  ruleId: z.string(),
  severity: severitySchema,
  message: z.string(),
  evidence: z.string(),
  confidence: fraction,
  status: z.enum(['new', 'reviewed', 'closed']),
  createdAt: z.iso.datetime(),
  reviewedBy: z.string().nullable(),
  note: z.string(),
  updatedAt: z.iso.datetime(),
});
export type Alert = z.infer<typeof alertSchema>;
export const ruleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  condition: patternTypeSchema,
  threshold: fraction,
  severity: severitySchema,
  enabled: z.boolean(),
  minCount: z.number().int().min(1).max(100),
  zone: boxSchema,
});
export type Rule = z.infer<typeof ruleSchema>;
export const classSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  enabled: z.boolean(),
});
export type VisionClass = z.infer<typeof classSchema>;
export const scenarioConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  description: z.string().max(240),
  enabled: z.boolean(),
});
export type ScenarioConfig = z.infer<typeof scenarioConfigSchema>;
export interface Scenario extends ScenarioConfig {
  sector: string;
  asset: string;
  tag: string;
  result: VisionResult;
}
export const eventSchema = z.object({
  id: z.string(),
  at: z.iso.datetime(),
  actor: z.string(),
  action: z.string(),
  target: z.string(),
});
export type AuditEvent = z.infer<typeof eventSchema>;
export const stateSchema = z.object({
  version: z.literal(1),
  analyses: z.array(analysisSchema),
  alerts: z.array(alertSchema),
  rules: z.array(ruleSchema),
  classes: z.array(classSchema),
  scenarios: z.array(scenarioConfigSchema),
  events: z.array(eventSchema),
  threshold: fraction,
});
export type AppState = z.infer<typeof stateSchema>;
export interface Session {
  name: string;
  role: Role;
}
export const statusLabels = {
  processing: 'En proceso',
  completed: 'Completado',
  failed: 'Error',
  new: 'Nueva',
  reviewed: 'Revisada',
  closed: 'Cerrada',
};
export const severityLabels: Record<Severity, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

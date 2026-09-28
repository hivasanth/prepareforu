import { z } from 'zod'
import { SUPPORTED_VISUAL_TYPES } from '../types/exam.types'

export const VISUAL_LIMITS = {
  maxJsonBytes: 200_000,
  maxDepth: 8,
  maxTitleLength: 300,
  maxTableRows: 100,
  maxTableColumns: 20,
  maxCellLength: 2_000,
  maxMermaidCodeLength: 50_000,
  maxLatexExpressionLength: 20_000,
  maxSvgPayloadBytes: 100_000,
  maxChartPoints: 500,
  maxChartSeries: 10,
  maxMapOverlays: 200,
} as const

export const visualTitleSchema = z.string().max(VISUAL_LIMITS.maxTitleLength).nullable().optional()

const cellValueSchema = z.union([z.string().max(VISUAL_LIMITS.maxCellLength), z.number().finite(), z.boolean()])

export const TableVisualSchema = z.object({
  type: z.literal('table'),
  title: visualTitleSchema,
  data: z.object({
    headers: z.array(z.string().max(VISUAL_LIMITS.maxCellLength)).min(1).max(VISUAL_LIMITS.maxTableColumns),
    rows: z.array(z.array(cellValueSchema).max(VISUAL_LIMITS.maxTableColumns)).max(VISUAL_LIMITS.maxTableRows),
  }).strict(),
}).strict()

export const MermaidVisualSchema = z.object({
  type: z.literal('mermaid'),
  title: visualTitleSchema,
  data: z.object({
    code: z.string().min(1).max(VISUAL_LIMITS.maxMermaidCodeLength),
  }).strict(),
}).strict()

export const LatexVisualSchema = z.object({
  type: z.literal('latex'),
  title: visualTitleSchema,
  data: z.object({
    expression: z.string().max(VISUAL_LIMITS.maxLatexExpressionLength).optional(),
    latex: z.string().max(VISUAL_LIMITS.maxLatexExpressionLength).optional(),
  }).strict().refine(d => (d.expression && d.expression.trim().length > 0) || (d.latex && d.latex.trim().length > 0), {
    message: 'latex visual requires a non-empty expression',
  }),
}).strict()

export const SvgVisualSchema = z.object({
  type: z.literal('svg'),
  title: visualTitleSchema,
  data: z.object({
    svg_content: z.string().max(VISUAL_LIMITS.maxSvgPayloadBytes).optional(),
    svg: z.string().max(VISUAL_LIMITS.maxSvgPayloadBytes).optional(),
    viewBox: z.string().max(100).optional(),
  }).strict().refine(d => Boolean(d.svg_content || d.svg), {
    message: 'svg visual requires svg_content or svg payload',
  }),
}).strict()

export const GeometryVisualSchema = z.object({
  type: z.literal('geometry'),
  title: visualTitleSchema,
  data: z.object({
    shape: z.enum(['triangle', 'circle']),
    labels: z.object({
      ab: z.string().max(VISUAL_LIMITS.maxCellLength).optional(),
      bc: z.string().max(VISUAL_LIMITS.maxCellLength).optional(),
      angleA: z.string().max(VISUAL_LIMITS.maxCellLength).optional(),
    }).strict().optional(),
    radius: z.number().finite().nonnegative().optional(),
  }).strict(),
}).strict()

export const VennVisualSchema = z.object({
  type: z.literal('venn'),
  title: visualTitleSchema,
  data: z.object({
    setA: z.string().max(200).optional(),
    setB: z.string().max(200).optional(),
    intersection: z.string().max(200).optional(),
  }).strict(),
}).strict()

const chartPointLabelsSchema = z.array(z.string().max(VISUAL_LIMITS.maxCellLength)).max(VISUAL_LIMITS.maxChartPoints)
const chartValuesSchema = z.array(z.number().finite()).max(VISUAL_LIMITS.maxChartPoints)

export const ChartVisualSchema = z.object({
  type: z.literal('chart'),
  title: visualTitleSchema,
  data: z.object({
    chartType: z.enum(['bar', 'line', 'area', 'pie']).optional(),
    labels: chartPointLabelsSchema.optional(),
    x_axis: chartPointLabelsSchema.optional(),
    data: chartValuesSchema.optional(),
    series: z.array(
      z.union([z.number().finite(), z.object({ name: z.string().max(200).optional(), value: chartValuesSchema }).strict()])
    ).max(VISUAL_LIMITS.maxChartSeries).optional(),
    datasets: z.array(z.object({ data: chartValuesSchema }).strict()).max(VISUAL_LIMITS.maxChartSeries).optional(),
    colors: z.array(z.string().max(40)).max(20).optional(),
    y_axis: z.string().max(120).optional(),
    yAxisLabel: z.string().max(120).optional(),
  }).strict().refine(d => Array.isArray(d.data) || Array.isArray(d.series) || Array.isArray(d.datasets), {
    message: 'chart visual requires data, series, or datasets',
  }),
}).strict()

export const MapOverlayVisualSchema = z.object({
  type: z.literal('map_overlay'),
  title: visualTitleSchema,
  data: z.object({
    center: z.object({ lat: z.number().finite(), lng: z.number().finite() }).strict().optional(),
    zoom: z.number().finite().min(1).max(20).optional(),
    overlays: z.array(z.object({
      lat: z.number().finite(),
      lng: z.number().finite(),
      label: z.string().max(200).optional(),
      color: z.string().max(40).optional(),
    }).strict()).max(VISUAL_LIMITS.maxMapOverlays).optional(),
  }).strict(),
}).strict()

export const QuestionVisualSchema = z.discriminatedUnion('type', [
  TableVisualSchema,
  MermaidVisualSchema,
  LatexVisualSchema,
  SvgVisualSchema,
  GeometryVisualSchema,
  VennVisualSchema,
  ChartVisualSchema,
  MapOverlayVisualSchema,
])

export type CanonicalQuestionVisual = z.infer<typeof QuestionVisualSchema>

const supportedTypeSchema = z.enum(SUPPORTED_VISUAL_TYPES)

/**
 * render_type-led "engine" object — the shared GATE for both legacy engines
 * (render fields under `metadata`) and the CANONICAL AI-generation engines
 * (render fields directly at the top level, e.g. `headers`/`rows` for tables).
 * `metadata` is optional and extra top-level keys pass through, so the exact
 * AI prompt shape `{ render_type, title, headers, rows }` reaches
 * convertLegacyEngine, which derives the canonical `data` object.
 */
export const LegacyVisualEngineObjectSchema = z.object({
  render_type: supportedTypeSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
  title: z.string().max(VISUAL_LIMITS.maxTitleLength).optional(),
}).passthrough()

export const LegacyVisualEngineWrapperSchema = z.object({
  visual_engine: LegacyVisualEngineObjectSchema,
}).strict()

export function measureJsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value ?? null)).length
}

export function assertVisualSizeLimits(input: unknown): void {
  if (measureJsonBytes(input) > VISUAL_LIMITS.maxJsonBytes) {
    throw new Error(`visual exceeds maximum size of ${VISUAL_LIMITS.maxJsonBytes} bytes`)
  }
  assertMaxDepth(input, 0)
}

function assertMaxDepth(value: unknown, depth: number): void {
  if (depth > VISUAL_LIMITS.maxDepth) {
    throw new Error(`visual exceeds maximum nesting depth of ${VISUAL_LIMITS.maxDepth}`)
  }
  if (Array.isArray(value)) {
    for (const item of value) assertMaxDepth(item, depth + 1)
    return
  }
  if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) assertMaxDepth(item, depth + 1)
  }
}

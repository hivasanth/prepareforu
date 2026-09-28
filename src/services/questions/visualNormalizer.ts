import type { QuestionVisual, VisualType } from '../../types/exam.types'
import {
  QuestionVisualSchema,
  LegacyVisualEngineObjectSchema,
  LegacyVisualEngineWrapperSchema,
  assertVisualSizeLimits,
} from '../../validations/questionVisualSchemas'

export class VisualNormalizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VisualNormalizationError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function convertLegacyEngine(engine: Record<string, unknown>): QuestionVisual {
  const renderType = engine.render_type as VisualType
  const metadata = (engine.metadata ?? {}) as Record<string, unknown>
  const titleCandidate = [engine.title, (metadata as Record<string, unknown>).title].find(t => typeof t === 'string' && t.length > 0)
  const title = typeof titleCandidate === 'string' ? titleCandidate : null

  // Compatibility: a legacy mermaid engine may carry its source under
  // `metadata.definition` (optionally alongside `chart_type`) whereas the
  // canonical AI engine shape carries `code` (or `definition`) at the TOP
  // level. Only a non-empty string is accepted, and the mapped payload is
  // rebuilt strictly as { code } so no extra keys survive.
  if (renderType === 'mermaid') {
    const source = (metadata as Record<string, unknown>).code ?? (metadata as Record<string, unknown>).definition ?? engine.code ?? engine.definition
    if (typeof source === 'string' && source.trim().length > 0) {
      return QuestionVisualSchema.parse({ type: 'mermaid', title, data: { code: source } })
    }
  }

  let data: Record<string, unknown>
  if (isRecord(metadata.data)) {
    data = metadata.data
  } else if ('data' in metadata && metadata.data !== undefined) {
    throw new VisualNormalizationError(`visual_engine metadata.data for "${renderType}" must be an object`)
  } else {
    // CANONICAL AI ENGINE SHAPE (AI prompt is the input contract): render keys
    // live at the engine TOP level (render_type/title excluded) — e.g.
    // { render_type: 'table', title, headers, rows } → data = { headers, rows }.
    const topLevelRenderKeys = Object.keys(engine).filter(k => k !== 'render_type' && k !== 'title' && k !== 'metadata')
    if (topLevelRenderKeys.length > 0) {
      data = Object.fromEntries(topLevelRenderKeys.map(k => [k, engine[k]]))
    } else {
      data = { ...metadata }
      delete data.title
    }
  }

  return QuestionVisualSchema.parse({ type: renderType, title, data })
}

export function normalizeVisualInput(input: unknown): QuestionVisual | null {
  if (input == null) return null
  if (!isRecord(input)) {
    throw new VisualNormalizationError('Unsupported visual format: expected an object')
  }

  assertVisualSizeLimits(input)

  const wrapper = LegacyVisualEngineWrapperSchema.safeParse(input)
  if (wrapper.success) {
    return convertLegacyEngine(wrapper.data.visual_engine as Record<string, unknown>)
  }

  const legacy = LegacyVisualEngineObjectSchema.safeParse(input)
  if (legacy.success) {
    return convertLegacyEngine(legacy.data as Record<string, unknown>)
  }

  const canonical = QuestionVisualSchema.safeParse(input)
  if (canonical.success) {
    const parsed = canonical.data
    return { ...parsed, title: parsed.title ?? null } as QuestionVisual
  }

  throw new VisualNormalizationError('Unsupported visual format or invalid visual data')
}

/** Canonical visual predicate — the ONE shared check for "this question has a
 *  valid canonical visual". Strictly requires a schema-valid QuestionVisual
 *  (canonical `{ type, title?, data }`); null/undefined, empty objects,
 *  malformed data, unsupported `type` values and legacy-disjoint shapes
 *  (e.g. a raw `{ visual_engine: ... }` wrapper) all return false. */
export function hasCanonicalVisual(visual: unknown): boolean {
  if (visual == null || typeof visual !== 'object' || Array.isArray(visual)) return false
  return QuestionVisualSchema.safeParse(visual).success
}

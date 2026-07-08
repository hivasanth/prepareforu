import { z } from 'zod'

export const SingleQuestionSchema = z.object({
  // ── Modern Bilingual Fields (Required) ────────────────────
  question_text_en: z.string().trim().min(1, "English question is required"),
  option_a_en: z.string().trim().min(1, "English Option A is required"),
  option_b_en: z.string().trim().min(1, "English Option B is required"),
  option_c_en: z.string().trim().min(1, "English Option C is required"),
  option_d_en: z.string().trim().min(1, "English Option D is required"),
  explanation_en: z.string().optional().default(''),

  correct_option: z.enum(['A', 'B', 'C', 'D'], { 
    message: "Correct option is required." 
  }),
  exam_id: z.string().min(1, "Exam context is required"),
  paper_id: z.string().min(1, "Paper is required"),
  subject_name: z.string().min(1, "Subject is required"),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  visual: z.any().nullable().optional(),

  // ── Telugu fields (fully optional) ────────────────────────────────────────
  topic_en: z.string().trim().optional().nullable().default(null),
  topic_te: z.string().trim().optional().nullable().default(null),
  question_text_te: z.string().trim().optional().nullable().default(null),
  option_a_te: z.string().trim().optional().nullable().default(null),
  option_b_te: z.string().trim().optional().nullable().default(null),
  option_c_te: z.string().trim().optional().nullable().default(null),
  option_d_te: z.string().trim().optional().nullable().default(null),
  explanation_te: z.string().optional().nullable().default(null),
})

// Normalize visual_engine / visual into the canonical { type, data, title? } format
function normalizeVisual(arg: any): any {
  // Priority 1: visual_engine field (user's alternate format)
  const raw = arg.visual_engine || arg.visual
  if (!raw || typeof raw !== 'object') return arg.visual ?? null

  // Already in canonical format: { type, data }
  if (raw.type && raw.data !== undefined) return raw

  // visual_engine format: { render_type, metadata } → { type, data }
  if (raw.render_type && raw.metadata !== undefined) {
    return {
      type: raw.render_type,
      title: raw.title || null,
      data: raw.metadata,
    }
  }

  // Unknown structure — pass through as-is (best effort)
  return raw
}

export const BulkQuestionSchema = z.pipe(z.transform((arg: any) => {
  // Normalize incoming fields (support both options array and discrete fields)
  const qText = (arg.question_text_en || arg.question_text || arg.question || '').trim()
  let optA = arg.option_a_en || arg.option_a
  let optB = arg.option_b_en || arg.option_b
  let optC = arg.option_c_en || arg.option_c
  let optD = arg.option_d_en || arg.option_d

  if (Array.isArray(arg.options) && arg.options.length === 4) {
    [optA, optB, optC, optD] = arg.options
  }

  return {
    ...arg,
    // Modern fields (source of truth)
    question_text_en: qText,
    option_a_en: optA?.toString().trim() || '',
    option_b_en: optB?.toString().trim() || '',
    option_c_en: optC?.toString().trim() || '',
    option_d_en: optD?.toString().trim() || '',
    explanation_en: (arg.explanation_en || arg.explanation || '').toString().trim(),

    correct_option: (arg.correct_option || arg.correct || '').toString().trim().toUpperCase(),
    difficulty: (arg.difficulty || 'medium').toLowerCase(),
    // Normalize visual / visual_engine into canonical format
    visual: normalizeVisual(arg),
    
    // Pass through Telugu & Topic fields
    topic_en: arg.topic_en || null,
    topic_te: arg.topic_te || null,
    question_text_te: arg.question_text_te || null,
    option_a_te: arg.option_a_te || null,
    option_b_te: arg.option_b_te || null,
    option_c_te: arg.option_c_te || null,
    option_d_te: arg.option_d_te || null,
    explanation_te: arg.explanation_te || null,
  }
}), z.object({
  question_text_en: z.string().min(1, "English question is required"),
  option_a_en: z.string().min(1, "English Option A is required"),
  option_b_en: z.string().min(1, "English Option B is required"),
  option_c_en: z.string().min(1, "English Option C is required"),
  option_d_en: z.string().min(1, "English Option D is required"),

  correct_option: z.enum(['A', 'B', 'C', 'D'], { 
    message: "Correct option is required." 
  }),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  explanation_en: z.string().optional(),
  visual: z.any().nullable().optional(),

  topic_en: z.string().optional().nullable(),
  topic_te: z.string().optional().nullable(),
  question_text_te: z.string().optional().nullable(),
  option_a_te: z.string().optional().nullable(),
  option_b_te: z.string().optional().nullable(),
  option_c_te: z.string().optional().nullable(),
  option_d_te: z.string().optional().nullable(),
  explanation_te: z.string().optional().nullable()
}))

import { z } from 'zod'
import { normalizeVisualInput } from '../services/questions/visualNormalizer'
import { QuestionVisualSchema } from './questionVisualSchemas'

export const SELECTED_OPTIONS = ['A', 'B', 'C', 'D'] as const

export const selectedOptionSchema = z.enum(SELECTED_OPTIONS)

export const questionEnFieldsSchema = z.object({
  question_text_en: z.string().trim().min(1, "English question is required"),
  option_a_en: z.string().trim().min(1, "English Option A is required"),
  option_b_en: z.string().trim().min(1, "English Option B is required"),
  option_c_en: z.string().trim().min(1, "English Option C is required"),
  option_d_en: z.string().trim().min(1, "English Option D is required"),
})

export const SingleQuestionSchema = questionEnFieldsSchema.extend({
  // ── Modern Bilingual Fields (Required, via questionEnFieldsSchema) ─────────
  explanation_en: z.string().optional().default(''),

  correct_option: z.enum(['A', 'B', 'C', 'D'], { 
    message: "Correct option is required." 
  }),
  exam_id: z.string().min(1, "Exam context is required"),
  paper_id: z.string().min(1, "Paper is required"),
  subject_name: z.string().min(1, "Subject is required"),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  negative_marks: z.number().finite().min(0).max(99.99).optional().default(0),
  visual: QuestionVisualSchema.nullable().optional(),

  // ── Telugu fields (fully optional) ────────────────────────────────────────
  // topic_en is enforced non-empty IF supplied (DB trigger validates the
  // value exists in exam_topics for the same exam/paper/subject).
  topic_en: z.string().trim().min(1, 'topic_en cannot be empty when provided').optional().nullable().default(null),
  topic_te: z.string().trim().optional().nullable().default(null),
  question_text_te: z.string().trim().optional().nullable().default(null),
  option_a_te: z.string().trim().optional().nullable().default(null),
  option_b_te: z.string().trim().optional().nullable().default(null),
  option_c_te: z.string().trim().optional().nullable().default(null),
  option_d_te: z.string().trim().optional().nullable().default(null),
  explanation_te: z.string().optional().nullable().default(null),
})

// Canonical visual normalization is owned by services/questions/visualNormalizer.ts

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
    // Single normalization authority (services/questions/visualNormalizer)
    visual: normalizeVisualInput(arg.visual ?? arg.visual_engine ?? null),
    negative_marks: arg.negative_marks ?? 0,
    
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
  // EN fields derive from the shared questionEnFieldsSchema (single rule owner)
  ...questionEnFieldsSchema.shape,

  correct_option: z.enum(['A', 'B', 'C', 'D'], { 
    message: "Correct option is required." 
  }),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  explanation_en: z.string().optional(),
  visual: QuestionVisualSchema.nullable().optional(),
  negative_marks: z.number().finite().min(0).max(99.99).optional(),

  topic_en: z.string().min(1, 'topic_en cannot be empty when provided').optional().nullable(),
  topic_te: z.string().optional().nullable(),
  question_text_te: z.string().optional().nullable(),
  option_a_te: z.string().optional().nullable(),
  option_b_te: z.string().optional().nullable(),
  option_c_te: z.string().optional().nullable(),
  option_d_te: z.string().optional().nullable(),
  explanation_te: z.string().optional().nullable()
}))

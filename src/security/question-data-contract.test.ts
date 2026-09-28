import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/* ─────────────────────────────────────────────────────────────────────────────
   QUESTION DATA CONTRACT + SECURITY REMEDIATION — architecture contracts

   Verifies (statically) that:
   - ONE visual normalization authority exists and every write path uses it
   - z.any() visual validation is gone
   - secure exam delivery: runtime fetches exclude answers/explanations,
     prepare-write fetches the locked question set with NO answers (F-01),
     review re-reads post-submit
   - runtime scoring RPCs no longer receive client-side correct_option
   - update path recomputes content_hash and maps duplicate conflicts
   - delete lifecycle falls back to soft-delete for velocity-referenced rows
   - dead code stays dead (fetchQuestionMeta)
   - renderer security: Mermaid strict mode + DOMPurify svg profile
   - LIVE remediation migration exists (grants + CHECK constraint)
   ────────────────────────────────────────────────────────────────────────── */

const read = (...p: string[]) => readFileSync(join(__dirname, ...p), 'utf8')

const normalizer = read('..', 'services', 'questions', 'visualNormalizer.ts')
const visualSchemas = read('..', 'validations', 'questionVisualSchemas.ts')
const questionSchema = read('..', 'validations', 'questionSchema.ts')
const singleModal = read('..', 'components', 'admin', 'questions', 'modals', 'SingleQuestionModal.tsx')
const bulkHook = read('..', 'components', 'admin', 'questions', 'useBulkUpload.ts')
const adminService = read('..', 'services', 'adminQuestionService.ts')
const questionRepo = read('..', 'lib', 'repositories', 'question.repository.ts')
const attemptRepo = read('..', 'lib', 'repositories', 'attempt.repository.ts')
const examService = read('..', 'services', 'examService.ts')
const subjectService = read('..', 'services', 'subjectTestService.ts')
const topicService = read('..', 'services', 'topicTestService.ts')
const prepareService = read('..', 'services', 'prepareWriteService.ts')
const useReview = read('..', 'components', 'exam', 'useReview.ts')
const reviewCard = read('..', 'components', 'exam', 'ReviewQuestionCard.tsx')
const visualizer = read('..', 'components', 'common', 'QuestionVisualizer.tsx')
const mermaid = read('..', 'components', 'visualizers', 'MermaidDiagram.tsx')
const examTypes = read('..', 'types', 'exam.types.ts')
const migrationPath = join(__dirname, '..', '..', 'supabase', 'migrations', '20260821120000_question_security_remediation.sql')

describe('visual normalization — single authority', () => {
  it('normalizer service exists at the canonical location', () => {
    expect(existsSync(join(__dirname, '..', 'services', 'questions', 'visualNormalizer.ts'))).toBe(true)
    expect(normalizer).toContain('export function normalizeVisualInput')
  })

  it('schema layer routes through the normalizer (no inline conversion left)', () => {
    expect(questionSchema).toContain('normalizeVisualInput')
    expect(questionSchema).not.toMatch(/render_type/)
  })

  it('manual modal uses the central normalizer (no inline legacy branch)', () => {
    expect(singleModal).toContain('normalizeVisualInput')
    expect(singleModal).not.toMatch(/render_type/)
  })

  it('renderer no longer duplicates legacy conversion', () => {
    expect(visualizer).not.toMatch(/render_type|normalizeVisualProp/)
    expect(visualizer).not.toMatch(/visual_engine/)
  })

  it('renderer type allowlist derives from one constant', () => {
    expect(examTypes).toContain('SUPPORTED_VISUAL_TYPES')
    expect(visualSchemas).toContain("supportedTypeSchema = z.enum(SUPPORTED_VISUAL_TYPES)")
  })
})

describe('strict visual validation', () => {
  it('z.any() is removed from question schemas', () => {
    expect(questionSchema).not.toMatch(/z\.any\(\)/)
    expect(questionSchema).toContain('QuestionVisualSchema.nullable().optional()')
  })

  it('discriminated union covers every supported type', () => {
    for (const t of ['table', 'mermaid', 'latex', 'svg', 'geometry', 'venn', 'chart', 'map_overlay']) {
      expect(visualSchemas).toContain(`z.literal('${t}')`)
    }
  })

  it('size limits are declared as application constants', () => {
    expect(visualSchemas).toContain('maxJsonBytes')
    expect(visualSchemas).toContain('maxTableRows')
    expect(visualSchemas).toContain('maxMermaidCodeLength')
    expect(visualSchemas).toContain('assertVisualSizeLimits')
  })

  it('bulk upload treats normalizer rejections as row errors', () => {
    expect(bulkHook).toMatch(/catch \(e\)[\s\S]*?BulkQuestionSchema|try\s*{[\s\S]*?BulkQuestionSchema\.safeParse/)
  })
})

describe('secure exam delivery', () => {
  it('full-exam fetch uses the secure field set (no answers pre-submission)', () => {
    expect(examService).toContain('EXAM_QUESTION_SECURE_FIELDS')
    const secureSet = questionRepo.match(/EXAM_QUESTION_SECURE_FIELDS = \[([\s\S]*?)\]/)?.[1] ?? ''
    expect(secureSet).not.toContain('correct_option')
    expect(secureSet).not.toContain('explanation_en')
    expect(secureSet).not.toContain('explanation_te')
  })

  it('subject-test fetch excludes answers/explanations', () => {
    const selectBlock = subjectService.match(/const selectFields = `([\s\S]*?)`/)?.[1] ?? ''
    expect(selectBlock).not.toContain('correct_option')
    expect(selectBlock).not.toContain('explanation')
  })

  it('topic-test fetch excludes answers/explanations', () => {
    const selectBlock = topicService.match(/const selectFields = `([\s\S]*?)`/)?.[1] ?? ''
    expect(selectBlock).not.toContain('correct_option')
    expect(selectBlock).not.toContain('explanation')
  })

  it('prepare-write locked flow never projects answers (F-01)', () => {
    // F-01/F-07 remediation: the answer-bearing get_practice_questions RPC is
    // DROPPED. Prepare & Write now reads only prepare_exam_questions /
    // start_prepared_exam, whose server-side projections exclude
    // correct_option + explanation_*. No REST select field list is used at all.
    expect(prepareService).not.toMatch(/'correct_option,'/)
    expect(prepareService).not.toMatch(/get_practice_questions/)
    expect(prepareService).toContain('prepareExamQuestionsRpc')
    expect(prepareService).toContain('startPreparedExamRpc')
    // The repository talks to the new server-authoritative RPCs only.
    expect(questionRepo).toContain("rpc('prepare_exam_questions'")
    expect(questionRepo).toContain("rpc('start_prepared_exam'")
    expect(questionRepo).not.toMatch(/get_practice_questions/)
  })

  it('runtime scoring RPCs no longer accept p_correct_option (server-only)', () => {
    const rpcSection = attemptRepo.slice(attemptRepo.indexOf('touchQuestionVisitRpc'))
    expect(rpcSection).not.toContain('p_correct_option')
    expect(examService).not.toMatch(/_correctOption/)
  })

  it('review re-reads authoritative definitions post-completion through RPCs', () => {
    // Content review: full definitions via get_content_review_questions;
    // per-question correctness via get_attempt_review_answers (both gated on
    // ownership + completed/auto_submitted).
    expect(useReview).toContain('fetchContentReviewQuestions')
    expect(examService).toContain('fetchContentReviewQuestionsRpc')
    expect(examService).toContain('fetchAttemptReviewAnswersRpc')
    expect(examService).not.toContain('REVIEW_QUESTION_FULL_FIELDS')
    expect(examTypes).not.toMatch(/AttemptAnswer[\s\S]*correct_option/)
    expect(reviewCard).not.toContain('answer?.correct_option')
  })

  it('active-attempt surfaces cannot reach answer-bearing columns via REST', () => {
    // attempt_answers is_correct/marks_awarded and questions
    // correct_option/explanation_* are revoked from REST; ONLY the RPCs
    // re-expose them under completion / role / entitlement gates.
    expect(questionRepo).not.toContain('REVIEW_QUESTION_FULL_FIELDS')
    expect(questionRepo).not.toContain('ADMIN_QUESTION_FIELDS')
    expect(questionRepo).not.toContain('fetchQuestionsForReview')
    expect(questionRepo).not.toContain('listQuestions')
    expect(attemptRepo).not.toContain('fetchAttemptAnswersByAttemptIds')
  })
})

describe('content hash remediation', () => {
  it('update path recomputes content_hash with the single hash authority', () => {
    const updateBlock = adminService.slice(adminService.indexOf('async updateQuestion'), adminService.indexOf('async deleteQuestion'))
    expect(updateBlock).toContain('generateQuestionHash')
    expect(adminService.match(/generateQuestionHash/g)?.length).toBeGreaterThanOrEqual(3)
  })

  it('duplicate update maps to an explicit error (no false success)', () => {
    const updateBlock = adminService.slice(adminService.indexOf('async updateQuestion'), adminService.indexOf('async deleteQuestion'))
    expect(updateBlock).toMatch(/23505|unique constraint/i)
    expect(updateBlock).toContain('duplicate detected')
  })
})

describe('delete lifecycle remediation', () => {
  it('velocity-referenced questions archive instead of hard-failing', () => {
    expect(questionRepo).toContain('findVelocityReferencedQuestionIds')
    expect(questionRepo).toContain('deactivateQuestion')
    const deleteBlock = adminService.slice(adminService.indexOf('async deleteQuestion'), adminService.indexOf('async bulkDeleteQuestions'))
    expect(deleteBlock).toContain('findVelocityReferencedQuestionIds')
    expect(deleteBlock).toContain('deactivateQuestion')
  })

  it('upload count aligns with active-only readers', () => {
    const start = questionRepo.indexOf('export async function countQuestionsByFilter')
    const block = questionRepo.slice(start, questionRepo.indexOf('}', questionRepo.indexOf(".eq('subject_name', params.subjectName)", start)))
    expect(block).toContain(".eq('is_active', true)")
  })

  // F-01 privilege lockdown: `authenticated` holds COLUMN-level (not table-level)
  // SELECT on questions, so the upload count query must target an explicitly
  // granted non-answer column. A select('*') requests the revoked answer columns
  // and PostgREST 403s the whole request (the admin-upload count error).
  it('upload count selects only an F-01 column-level-granted column (never *)', () => {
    const start = questionRepo.indexOf('export async function countQuestionsByFilter')
    const block = questionRepo.slice(start, questionRepo.indexOf('}', questionRepo.indexOf(".eq('subject_name', params.subjectName)", start)))
    expect(block).toMatch(/\.select\('id', \{ count: 'exact', head: true \}\)/)
    expect(block).not.toMatch(/\.select\('\*'/)
  })
})

describe('dead code removal + explicit DTOs', () => {
  it('fetchQuestionMeta is removed with zero references', () => {
    expect(questionRepo).not.toContain('fetchQuestionMeta')
    expect(adminService).not.toContain('fetchQuestionMeta')
  })

  it('admin list uses the role-gated RPC instead of a REST select(*)', () => {
    expect(questionRepo).toContain("rpc('admin_list_questions'")
    expect(questionRepo).not.toContain('ADMIN_QUESTION_FIELDS')
    expect(questionRepo).not.toMatch(/select\(ADMIN_QUESTION_FIELDS/)
  })
})

describe('renderer security', () => {
  it('mermaid runs in strict security mode', () => {
    expect(mermaid).toContain("securityLevel: 'strict'")
    expect(mermaid).not.toContain("'loose'")
  })

  it('svg passes through DOMPurify with the svg profile before injection', () => {
    expect(visualizer).toContain('DOMPurify.sanitize(svgContent')
    expect(visualizer).toContain('USE_PROFILES: { svg: true, svgFilters: true }')
  })
})

describe('live remediation migration', () => {
  it('grant revocations + negative_marks range exist in a new migration', () => {
    expect(existsSync(migrationPath)).toBe(true)
    if (existsSync(migrationPath)) {
      const sql = readFileSync(migrationPath, 'utf8')
      expect(sql).toContain('REVOKE SELECT ON public.questions FROM anon')
      expect(sql).toContain('REVOKE TRUNCATE ON public.questions FROM authenticated')
      expect(sql).toContain('chk_questions_negative_marks_range')
      expect(sql).toContain('check_exam_velocity() SET search_path')
    }
  })
})

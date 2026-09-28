import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/* ─────────────────────────────────────────────────────────────────────────────
   ADMIN UPLOAD QUESTIONS — architecture & security contract tests

   Verifies (statically) that:
   - removed marketing content is gone from active UI source
   - upload surfaces use AntigravityCard variant="default" (no raw clones)
   - manual entry reuses the canonical modal + form chain (no duplicates,
     no direct DB writes from components)
   - difficulty maps to the real DB enum via the reusable PremiumSelect
   - backend relationship validation / RLS / duplicate protection exist
   ────────────────────────────────────────────────────────────────────────── */

const read = (...p: string[]) => readFileSync(join(__dirname, ...p), 'utf8')

const methodView = read('..', 'components', 'admin', 'upload', 'MethodSelectionView.tsx')
const contextPanel = read('..', 'components', 'admin', 'upload', 'UploadContextPanel.tsx')
const uploadHook = read('..', 'components', 'admin', 'upload', 'useAdminUpload.ts')
const uploadPage = read('..', 'pages', 'admin', 'AdminUpload.tsx')
const questionForm = read('..', 'components', 'admin', 'questions', 'QuestionForm.tsx')
const singleModal = read('..', 'components', 'admin', 'questions', 'modals', 'SingleQuestionModal.tsx')
const adminService = read('..', 'services', 'adminQuestionService.ts')
const questionRepo = read('..', 'lib', 'repositories', 'question.repository.ts')

describe('upload page — removed unwanted content', () => {
  it('dead headings/subtitle/badge are gone from all upload sources', () => {
    const sources = [methodView, contextPanel, uploadPage, uploadHook]
    for (const src of sources) {
      expect(src).not.toMatch(/Upload Method/i)
      expect(src).not.toMatch(/How do you want to upload/i)
      expect(src).not.toMatch(/Choose a method to add questions/i)
      expect(src).not.toMatch(/AI Optimized/i)
    }
  })

  it('Sparkles badge import is gone', () => {
    expect(methodView).not.toContain('Sparkles')
  })
})

describe('upload cards — AntigravityCard variant="default"', () => {
  it('method cards use Card variant default with padding API (no raw p-8)', () => {
    expect(methodView).toContain('variant="default"')
    expect(methodView).toContain('padding={24}')
    expect(methodView).not.toMatch(/variant="elevated"/)
    expect(methodView).not.toMatch(/\bp-8\b/)
  })

  it('method cards keep one shared structure (mapped config, not per-card styling)', () => {
    expect(methodView).toContain('METHOD_OPTIONS')
    /* raw decorative shadows and watermark positioning must not return */
    expect(methodView).not.toMatch(/shadow-xl/)
    expect(methodView).not.toMatch(/absolute -bottom/)
    expect(methodView).not.toMatch(/opacity-\[0\.03\]/)
  })

  it('ready context card uses Card variant default (no elevated/subtle dialects)', () => {
    expect(contextPanel).toContain('variant="default"')
    expect(contextPanel).not.toMatch(/variant=\{isContextValid/)
    expect(contextPanel).not.toMatch(/border-2/)
    expect(contextPanel).not.toMatch(/bg-primary\/5/)
    expect(contextPanel).not.toMatch(/grayscale/)
  })

  it('ready card count comes from the live authoritative service', () => {
    expect(uploadHook).toContain('countQuestions')
    expect(uploadHook).toContain('refetchCount()')
    /* no optimistic fake increment */
    expect(uploadHook).not.toMatch(/prev\s*\+\s*1/)
  })

  it('loading count renders Skeleton primitive, never a fake 0', () => {
    expect(contextPanel).toContain('Skeleton')
    expect(contextPanel).toMatch(/countLoading/)
  })
})

describe('manual entry — canonical modal + ONE language-aware form', () => {
  it('page opens the existing SingleQuestionModal (no new modal system)', () => {
    expect(uploadPage).toContain('SingleQuestionModal')
  })

  it('form binds both languages through ONE toggle-driven renderer', () => {
    expect(questionForm).toContain('BilingualToggle')
    expect(questionForm).toContain('onDisplayLangChange')
    /* suffix-switched field access — one renderer set, two schema field families */
    expect(questionForm).toMatch(/'_te' as const|"_te" as const/)
    expect(questionForm).toMatch(/'_en' as const|"_en" as const/)
    /* no per-language duplicate sections */
    expect(questionForm).not.toContain('showTelugu')
    expect(questionForm).not.toMatch(/English Section \(Required\)/)
  })

  it('difficulty uses the reusable PremiumSelect mapped to the DB enum', () => {
    expect(questionForm).toContain('PremiumSelect')
    expect(questionForm).toContain("'easy'")
    expect(questionForm).toContain("'medium'")
    expect(questionForm).toContain("'hard'")
    /* segmented RadioGroup is no longer the difficulty control */
    expect(questionForm).not.toContain('RadioGroup')
  })

  it('visual metadata editor retained (canonical questions.visual jsonb schema field)', () => {
    expect(questionForm).toContain('Visual Diagram Metadata')
    expect(questionForm).toContain('QuestionVisualizer')
  })

  it('modal wires the language state into the form', () => {
    expect(singleModal).toContain('onDisplayLangChange={setDisplayLang}')
  })
})

describe('manual entry — QuestionCard visual parity (shared UI authority)', () => {
  const examCard = read('..', 'components', 'exam', 'QuestionCard.tsx')
  const examOptions = read('..', 'components', 'exam', 'QuestionOptions.tsx')
  const cardHeader = read('..', 'components', 'exam', 'QuestionCardHeader.tsx')
  const cardOption = read('..', 'components', 'exam', 'QuestionCardOption.tsx')

  it('header primitive is the single source consumed by display AND authoring', () => {
    expect(examCard).toContain('<QuestionCardHeader')
    expect(questionForm).toContain('<QuestionCardHeader')
    /* canonical header geometry lives in exactly one place */
    for (const src of [examCard, questionForm]) {
      expect(src).not.toMatch(/border-b border-border-subtle\/50 bg-hover-bg\/30/)
    }
    expect(cardHeader).toMatch(/NumberBadge value=\{index\} variant="question"/)
  })

  it('option row primitive is the single source; markers are never hand-built or absolute', () => {
    expect(examOptions).toContain('<QuestionCardOption')
    expect(questionForm).toContain('<QuestionCardOption')
    for (const src of [questionForm, examOptions]) {
      /* no second number badge / absolutely-positioned letter marker */
      expect(src).not.toMatch(/absolute top-3 left-3/)
      expect(src).not.toMatch(/w-7 h-7 flex items-center justify-center rounded-lg font-bold/)
    }
    expect(cardOption).toMatch(/variant="option"/)
    expect(cardOption).toMatch(/flex flex-col gap-3\.5|w-full flex items-center gap-3 p-3 md:p-3\.5 rounded-xl border-2/)
  })

  it('form renders ONE elevated QuestionCard-style wrapper (modal owns its own surface)', () => {
    expect(questionForm).toContain('variant="elevated"')
    expect(questionForm).toContain('padding={0}')
    expect(questionForm).toContain('relative overflow-hidden')
    expect(questionForm.match(/variant="elevated"/g)?.length).toBe(1)
  })

  it('correct-answer marking uses the canonical semantic success state', () => {
    /* no custom chip / custom green-red system */
    expect(questionForm).not.toContain('Correct?')
    expect(questionForm).not.toContain("bg-green-500")
    expect(questionForm).not.toContain('shadow-lg shadow-success')
  })

  it('options keep the canonical single-column geometry (no grid dialect)', () => {
    expect(questionForm).toMatch(/flex flex-col gap-3\.5/)
    expect(questionForm).not.toMatch(/grid-cols-2 gap-4">\{\(\['A', 'B', 'C', 'D'\]/)
  })

  it('no duplicate QuestionCard forks were created', async () => {
    const fs = await import('fs')
    const forbidden = ['AdminQuestionCard.tsx', 'EditableQuestionCard.tsx', 'QuestionFormCard.tsx']
    for (const name of forbidden) {
      const exists =
        fs.existsSync(join(__dirname, '..', 'components', 'admin', name)) ||
        fs.existsSync(join(__dirname, '..', 'components', 'admin', 'questions', name)) ||
        fs.existsSync(join(__dirname, '..', 'components', 'exam', name))
      expect(exists, `${name} must not exist`).toBe(false)
    }
  })
})

describe('save flow — component → service → repository → table (no shortcuts)', () => {
  it('no direct supabase writes from upload/question components', () => {
    for (const src of [methodView, contextPanel, uploadPage, questionForm, singleModal]) {
      expect(src).not.toMatch(/supabase\.from\(/)
    }
  })

  it('service delegates to the repository upsert with duplicate protection', () => {
    expect(adminService).toContain('upsertQuestion')
    // ROLE-AUDIT v1.0: admin question bank is ADMIN-only (sub-admins are
    // read-only; their exam questions live in teacher_exam_questions).
    expect(adminService).toContain("allowedRoles: ['admin']")
    expect(questionRepo).toContain("onConflict: 'content_hash'")
    expect(questionRepo).toContain('ignoreDuplicates: true')
  })

  it('repository validates payloads through SingleQuestionSchema before write', () => {
    expect(questionRepo).toContain('validateOrThrow(SingleQuestionSchema')
  })
})

describe('backend guarantees (migration sources)', () => {
  const migration = read('..', '..', 'supabase', 'migrations', '20260812000011_topic_exams_data_and_validation.sql')

  it('topic→exam/paper/subject relationship trigger exists and raises on violation', () => {
    expect(migration).toContain('validate_question_topic')
    expect(migration).toContain('RAISE EXCEPTION')
    expect(migration).toContain('FROM public.exam_topics')
  })

  it('trigger is wired BEFORE INSERT OR UPDATE on questions', () => {
    expect(migration).toMatch(/CREATE TRIGGER trg_validate_question_topic[\s\S]*BEFORE INSERT OR UPDATE[\s\S]*validate_question_topic/)
  })
})

describe('no duplicate components were created', () => {
  it('forbidden file names do not exist', async () => {
    const fs = await import('fs')
    const forbidden = [
      'ManualEntryCard.tsx',
      'UploadCard.tsx',
      'ManualUploadCard.tsx',
      'BulkUploadCard.tsx',
      'ReadyContextCard.tsx',
      'UploadReadyCard.tsx',
      'ManualQuestionCard.tsx',
      'AdminManualQuestionCard.tsx',
      'UploadQuestionCard.tsx',
      'TeluguQuestionCard.tsx',
      'DifficultyDropdown.tsx',
      'UploadModal.tsx',
      'UploadSkeletonV2.tsx',
    ]
    for (const name of forbidden) {
      const exists = fs.existsSync(join(__dirname, '..', 'components', 'admin', name)) ||
        fs.existsSync(join(__dirname, '..', 'components', 'admin', 'upload', name)) ||
        fs.existsSync(join(__dirname, '..', 'components', 'admin', 'questions', name))
      expect(exists, `${name} must not exist`).toBe(false)
    }
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
   BULK UPLOAD — TOPIC FLOW RESTRUCTURE

   Screen 2 (bulk selection page) is ONLY for selecting a topic; Screen 3
   (topic-specific page) hosts that topic's bulk-parser workflow. Verifies
   statically that:
   - Launch Bulk Parser is gone everywhere in the upload flow
   - Manual Entry and Bulk Upload share the ONE reusable topic-card component
   - bulk navigation identity is exam_topics.id, never a topic name
   - the topic page resolves its heading from LIVE exam_topics by id
   - prompt retrieval is scoped DB-side by topic_id with per-topic cache keys
   - the segmented workflow is defined once and reused by modal + page
   ────────────────────────────────────────────────────────────────────────── */

const topicsGrid = read('..', 'components', 'admin', 'upload', 'SubjectTopicsGrid.tsx')
const bulkHook = read('..', 'components', 'admin', 'questions', 'useBulkUpload.ts')
const bulkPanel = read('..', 'components', 'admin', 'questions', 'BulkUploadPanel.tsx')
const bulkModal = read('..', 'components', 'admin', 'questions', 'modals', 'BulkUploadModal.tsx')
const examRepo = read('..', 'lib', 'repositories', 'exam.repository.ts')
const adminServiceSrc = read('..', 'services', 'adminQuestionService.ts')
const topicService = read('..', 'services', 'topicTestService.ts')
const parserPage = read('..', 'pages', 'admin', 'AdminBulkParserTopic.tsx')
const appRoutes = read('..', 'App.tsx')

describe('bulk flow — Launch Bulk Parser removal', () => {
  it('button, handler and prop are gone from every upload-flow source', () => {
    for (const src of [contextPanel, uploadHook, uploadPage, topicsGrid]) {
      expect(src).not.toMatch(/Launch Bulk Parser/i)
      expect(src).not.toMatch(/onLaunch/)
      expect(src).not.toMatch(/handleLaunch/)
    }
  })

  it('the multi-topic BulkUploadModal no longer mounts on the upload page', () => {
    expect(uploadPage).not.toContain('BulkUploadModal')
  })
})

describe('bulk flow — ONE shared topic-card implementation', () => {
  it('bulk landing renders the same SubjectTopicsGrid used by manual entry', () => {
    const occurrences = uploadPage.match(/<SubjectTopicsGrid/g)?.length ?? 0
    expect(occurrences).toBe(2)
    expect(uploadPage).toContain('actionLabel="Bulk Upload"')
    expect(uploadPage).toContain('actionLabel="Upload Manually"')
  })

  it('cards keep the exact reference surface, toggle and info button', () => {
    expect(topicsGrid).toContain('variant="premium-dark-neutral"')
    expect(topicsGrid).toContain('<BilingualToggle')
    expect(topicsGrid).toContain('<TopicInfoButton')
    expect(topicsGrid).toContain('<GridSkeleton')
    expect(topicsGrid).toContain('<ErrorContainer')
    expect(topicsGrid).toContain('<EmptyState')
    /* exactly one language toggle for the whole grid — not per card */
    expect(topicsGrid.match(/<BilingualToggle/g)?.length).toBe(1)
  })

  it('bulk cards only open canonical LIVE topics (id present)', () => {
    expect(uploadPage).toMatch(/h\.topics\.filter\(t => !!t\.id\)/)
  })
})

describe('bulk flow — topic_id navigation + live heading', () => {
  it('topic route is registered under the admin upload segment using :topicId', () => {
    expect(appRoutes).toContain("upload/bulk-parser/topic/:topicId")
  })

  it('navigation builds the path from topic.id, never a topic name', () => {
    expect(uploadPage).toContain('/admin/upload/bulk-parser/topic/${topic.id}')
    expect(uploadPage).not.toMatch(/bulk-parser\/topic\/\$\{[^}]*name/i)
  })

  it('page resolves English/Telugu names from LIVE exam_topics via the record service', () => {
    expect(parserPage).toContain('fetchTopicRecord')
    expect(parserPage).toContain('liveTopic.topic_en')
    expect(parserPage).toContain('liveTopic.topic_te')
    expect(topicService).toContain('fetchTopicById')
    expect(examRepo).toMatch(/from\('exam_topics'\)[\s\S]*?\.eq\('id', topicId\)/)
  })

  it('nonexistent or cross-segment topic renders the canonical error state', () => {
    expect(parserPage).toContain('<ErrorContainer')
    expect(parserPage).toContain('This topic does not belong to the selected exam, paper and subject.')
    expect(parserPage).toContain('isExamAllowed')
  })
})

describe('bulk flow — prompts scoped by topic_id (server-side, cached per topic)', () => {
  it('repository filters prompt_templates by topic_id in the query itself', () => {
    expect(examRepo).toMatch(/if \(topicId\) query = query\.eq\('topic_id', topicId\)/)
  })

  it('service cache key isolates each topic collection', () => {
    expect(adminServiceSrc).toContain("`prompts:${examId}:${paperId}:${subjectName}:${topicId ?? 'all'}`")
  })

  it('hook threads topicId into listPrompts and preselects it on Create New', () => {
    expect(bulkHook).toContain('listPrompts(examId, paperId, subjectName, { user: authUser }, topicId)')
    expect(bulkHook).toContain('topic_id: topicId ?? \'\'')
    expect(bulkPanel).toContain('topicId?: string | null')
  })

  it('page passes the route topic id into the panel', () => {
    expect(parserPage).toContain('topicId={liveTopic.id}')
  })
})

describe('bulk flow — segmented workflow preserved once', () => {
  it('tab segments are declared exactly once and consumed by modal + page', () => {
    expect((bulkHook.match(/export const BULK_WORKFLOW_TABS/g) || []).length).toBe(1)
    expect(bulkModal).toContain('options={BULK_WORKFLOW_TABS}')
    expect(parserPage).toContain('options={BULK_WORKFLOW_TABS}')
  })

  it('INSTRUCTIONS is the default segment on the topic page', () => {
    expect(parserPage).toContain("useState<BulkTabType>('instructions')")
  })

  it('all four segments survive; page chrome actions follow the new workflow', () => {
    expect(bulkHook).toContain("'4. Preview & Sync'")
    /* removed page-level chrome buttons — navigation is segment-driven */
    expect(parserPage).not.toContain('Continue to Generate')
    expect(parserPage).not.toContain('Back to Instructions')
    /* generate keeps ONE bare forward action (no decorative wrapper) */
    expect(parserPage).toContain('Continue to Upload')
    expect(parserPage).toContain('<BulkUploadPanel')
  })

  it('preview & sync live inside PreviewTab behind an explicit validation gate', () => {
    const previewTab = read('..', 'components', 'admin', 'questions', 'PreviewTab.tsx')
    /* canonical guard message on the Alert surface — never window.alert */
    expect(previewTab).toContain(
      'Please enter valid JSON questions and click Validate Questions to continue to Preview & Sync.'
    )
    expect(previewTab).toContain('<Alert variant="warning"')
    expect(parserPage).not.toMatch(/alert\(/)
    /* sync action moved INTO the preview wrapper footer */
    expect(previewTab).toContain(`Sync ${'${itemsToSync.length}'} Questions`)
    expect(previewTab).toMatch(/canPreview: boolean/)
  })

  it('validation is an explicit state machine bound to the topic context', () => {
    expect(bulkHook).toContain("export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'")
    expect(bulkHook).toContain('setValidatedContext({ examId, paperId, subjectName, topicId })')
    /* user JSON edit invalidates; context change invalidates */
    expect(bulkHook).toMatch(/const handleJsonChange[\s\S]*?setValidationStatus\('idle'\)/)
    expect(bulkHook).toMatch(/\}, \[examId, paperId, subjectName, topicId, setParsedData\]\)/)
    /* stale validations can never unlock preview */
    expect(bulkHook).toMatch(/validatedContext\.topicId === \(topicId \?\? null\)/)
  })

  it('PromptEditorModal remains the single editor behind the panel', () => {
    expect(bulkPanel).toContain('<PromptEditorModal')
  })
})

describe('bulk flow — prompt container presentation (topic page)', () => {
  const instructionsTab = read('..', 'components', 'admin', 'questions', 'InstructionsTab.tsx')

  it('prompt wrapper is the reusable elevated AntigravityCard (no clone component)', () => {
    expect(instructionsTab).toContain("<Card variant=\"elevated\"")
    expect((instructionsTab.match(/Card variant/g) || []).length).toBe(1)
  })

  it('actions sit at the TOP via canonical action IconButtons above the scroll region', () => {
    expect(instructionsTab).toContain('variant="action"')
    expect(instructionsTab).toContain('intent="edit"')
    expect(instructionsTab).toContain('intent="delete"')
    expect(instructionsTab).toContain('aria-label="Edit prompt"')
    expect(instructionsTab).toContain('aria-label="Delete prompt"')
    expect(instructionsTab.indexOf('aria-label="Edit prompt"')).toBeLessThan(
      instructionsTab.indexOf('overflow-y-auto')
    )
    /* fixed-height, internally-scrollable prompt viewport */
    expect(instructionsTab).toMatch(/h-\[\d+px\] md:h-\[\d+px\] lg:h-\[\d+px\] overflow-y-auto/)
  })

  it('Create New is gone from this page; editor/modal/create path remain intact elsewhere', () => {
    expect(instructionsTab).not.toContain('Create New')
    expect(bulkPanel).not.toContain('onCreateNew=')
    expect(bulkPanel).toContain('<PromptEditorModal')
    expect(bulkHook).toContain('handleOpenPromptModal')
  })

  it('page drops Cancel and the old chrome buttons; generate keeps one bare forward action', () => {
    expect(parserPage).not.toMatch(/>Cancel</)
    expect(parserPage).not.toContain('Continue to Generate')
    expect(parserPage).not.toContain('Back to Instructions')
    expect(parserPage).toContain('Continue to Upload')
    /* the sync button is NOT a page-level action anymore */
    expect(parserPage).not.toMatch(/Sync \$\{itemsToSync\.length\} Questions/)
  })

  it('instructions segment carries a concise surface; prompt container stays elevated', () => {
    /* concise instruction copy — no AI Prompt Builder / template headings */
    expect(parserPage).toContain('Copy the prompt below and paste it into your preferred AI tool')
    expect(parserPage).not.toContain('AI Prompt Builder')
    expect(parserPage).not.toContain('Active Template')
    expect(parserPage).not.toContain('System Default')
  })
})

describe('bulk flow - STRICT REJECT ingestion authority (FINAL DATA ARCHITECTURE)', () => {
  const bulkBody = adminService.slice(adminService.indexOf('async bulkInsertQuestions'))

  it('bulkInsertQuestions never auto-registers topics — no catalog pollution path', () => {
    expect(bulkBody).not.toContain('registerTopicIfNeeded')
    expect(bulkBody).toContain('fetchTopicById')
  })

  it('bulkInsertQuestions requires the caller-selected topicId', () => {
    expect(bulkBody).toMatch(/ctx: \{ requestId\?: string, user\?: UserProfile \| null, topicId: string \}/)
    expect(bulkBody).toContain("'Select a topic before syncing questions.'")
  })

  it('rows are validated against the canonical record BEFORE any DB write', () => {
    const validatePos = bulkBody.indexOf('const validateRow')
    const insertPos = bulkBody.indexOf('upsertQuestionNoIgnore(q)')
    expect(validatePos).toBeGreaterThan(-1)
    expect(insertPos).toBeGreaterThan(-1)
    expect(validatePos).toBeLessThan(insertPos)
    // §42: null canonical Telugu accepts empty, rejects fabricated.
    expect(bulkBody).toContain('authority.topic_te == null')
    expect(bulkBody).toContain('!== authority.topic_te')
  })

  it('the hook passes the live topicId and fails fast without one', () => {
    expect(bulkHook).toContain("'Select a topic before syncing questions.'")
    expect(bulkHook).toContain('user: authUser, topicId })')
  })

  it('the prompt editor canonicalizes against the LIVE topic before saving', () => {
    const modal = read('..', 'components', 'admin', 'questions', 'PromptEditorModal.tsx')
    expect(modal).toContain('canonicalizePromptTopics(promptText, {')
    expect(modal).toContain('topic_en: selectedTopic.topic_en')
    expect(modal).toContain('topic_te: selectedTopic.topic_te ?? null')
  })

  it('a single shared surgical canonicalizer exists and is unit-tested', () => {
    const util = read('..', 'lib', 'utils', 'promptTopicCanonicalizer.ts')
    expect(util).toContain('export function canonicalizePromptTopics')
    expect(util).toContain('export function extractEmbeddedTopicNames')
    expect(() => expect(read('..', 'lib', 'utils', 'promptTopicCanonicalizer.test.ts').length).toBeGreaterThan(0)).not.toThrow()
  })

  it('the fallback generic prompt carries the verbatim echo rules (§32)', () => {
    expect(bulkHook).toContain('copy EXACTLY from the topic name given in this prompt')
    expect(bulkHook).toContain('never translate, transliterate, shorten or rephrase them')
  })
})

describe('user topic-exams flow - canonical topic identity (FINAL DATA ARCHITECTURE)', () => {
  const read = (...p: string[]) => readFileSync(join(__dirname, ...p), 'utf8')
  const hook = read('..', 'components', 'user', 'topic-exams', 'useTopicExams.ts')
  const portal = read('..', 'components', 'user', 'topic-exams', 'TopicPortalView.tsx')
  const service = read('..', 'services', 'topicTestService.ts')
  const repo = read('..', 'lib', 'repositories', 'question.repository.ts')

  it('the selection state stores the FULL TopicItem, never a bare name string', () => {
    expect(hook).toContain('useState<TopicItem | null>(null)')
    expect(hook).not.toMatch(/selectedTopic[\s\S]{0,80}useState<string \| null>/)
  })

  it('the card hands over the whole item - identity flows as an object, not a name', () => {
    expect(portal).toContain('onTopicClick: (topic: TopicItem) => void')
    expect(portal).toContain('onClick={() => onTopicClick(t)}')
    expect(portal).not.toContain('onTopicClick(t.topic_en)')
    // React keys prefer the canonical id.
    expect(portal).toContain('key={t.id ?? t.topic_en}')
  })

  it('launch sends the canonical topicId; legacy names only for id-less derived items', () => {
    expect(hook).toContain('topicId: selectedTopic?.id ?? null')
    expect(hook).toContain('legacyTopicName: selectedTopic?.id ? undefined : (selectedTopic?.topic_en || undefined)')
    expect(hook).not.toContain('topicName: selectedTopic ||')
  })

  it('the service resolves identity through the authoritative exam_topics record and fails closed', () => {
    expect(service).toMatch(/if \(params\.topicId\) \{[\s\S]*?fetchTopicRecord\(params\.topicId\)/)
    expect(service).toContain("throw new Error('Selected topic could not be verified. Please go back and choose the topic again.')")
    expect(service).toContain('authority.subject_name !== params.subjectName')
    expect(service).toContain('predicateName = authority.topic_en')
    expect(service).toContain("throw new Error('No topic selected for this test.')")
  })

  it('context changes reset the stale topic selection (cascading identity resets)', () => {
    for (const fn of ['handleExamChange', 'handlePaperChange', 'handleSubjectChange']) {
      const start = hook.indexOf(`const ${fn}`)
      const body = hook.slice(start, start + 600)
      expect(body).toContain('setSelectedTopic(null)')
    }
  })

  it('the name-based question filter remains a single documented predicate site (display data match)', () => {
    expect(repo.split(".eq('topic_en'").length - 1).toBe(1)
    expect(service).toContain('predicateName')
  })
})

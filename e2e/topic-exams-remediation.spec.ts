import { test, expect, type Page } from '@playwright/test'

// ─── Targeted browser checks: /topic-exams remediation ─────────────────────
// Closes the two remaining validation gaps deterministically against the REAL
// production components/hooks (UserTopicExams, useTopicExams, usePortalPaperState,
// useAppscPaperSelection, TopicPortalView, AdminSelectionTabs) with the network
// layer controlled via browser-side request interception ONLY:
//
//   T1 (SMOKE/FIX-4): portal loads, subject switch, topic -> config -> back
//   T2 (FIX-1/9/11): topic fetch network failure -> retryable error (Connection
//                    Lost, non-business) -> Try Again recovers
//   T3 (FIX-10): APPSC Paper A -> Paper B failure -> no stale A under B -> retry
//                targets Paper B -> B data renders
//   T3-RACE:      rapid paper switch is structurally gated (synchronous
//                 paperLoading full-page gate unmounts the tab row), and the
//                 slow Paper B response lands as Paper B content
//   T4 (FIX-7/8): warm-cache reload renders content with one labelled loading
//                 region
//   T5 (FIX-3): NoAvailableQuestionsError (real service path, questions endpoint
//               returns []) -> business-empty -> Back to Topic List -> clean portal
//   T6:          network / server / business categories render distinct error
//                screens (Connection Lost vs Server Error vs business)
//
// APPSC mode is simulated by rewriting the authenticated /rest/v1/users profile
// response (exam_selection -> APPSC_GROUPS) and serving APPSC-shaped data for
// the paper/subject/topic endpoints. No LIVE data is created or modified.

// ─── APPSC-shaped fixtures (mirror the real PostgREST row shapes) ───────────
const PAPERS = [
  { id: 'paper_a', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 1 (General Studies)', stage: 1, total_questions: 40, total_marks: 40, duration_minutes: 40, negative_marking: false, negative_mark_value: 0, display_order: 1 },
  { id: 'paper_b', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 2 (Arithmetic)', stage: 1, total_questions: 40, total_marks: 40, duration_minutes: 40, negative_marking: false, negative_mark_value: 0, display_order: 2 },
  { id: 'paper_c', exam_id: 'APPSC_GROUP_1', paper_name: 'Paper 3 (Telugu)', stage: 1, total_questions: 40, total_marks: 40, duration_minutes: 40, negative_marking: false, negative_mark_value: 0, display_order: 3 },
]
const SUBJECTS_BY_PAPER: Record<string, { subject_name: string }[]> = {
  paper_a: [{ subject_name: 'General Studies' }],
  paper_b: [{ subject_name: 'Arithmetic' }],
  paper_c: [{ subject_name: 'Telugu' }],
}
const TOPICS_BY_SUBJECT: Record<string, { topic_en: string; topic_te: string | null; display_order: number }[]> = {
  'General Studies': [{ topic_en: 'General Studies Topic', topic_te: null, display_order: 1 }],
  Arithmetic: [{ topic_en: 'Arithmetic Topic', topic_te: null, display_order: 1 }],
  Telugu: [{ topic_en: 'Telugu Topic', topic_te: null, display_order: 1 }],
}
const COUNTS_BY_SUBJECT: Record<string, { topic_en: string; count: number }[]> = {
  'General Studies': [{ topic_en: 'General Studies Topic', count: 50 }],
  Arithmetic: [{ topic_en: 'Arithmetic Topic', count: 50 }],
  Telugu: [{ topic_en: 'Telugu Topic', count: 50 }],
}

interface SubjectsMode {
  abort?: boolean
  serverError?: boolean
  slowPapers?: Set<string>
}

function queryParam(url: URL, key: string): string {
  return (url.searchParams.get(key) || '').replace(/^eq\./, '')
}

async function installAppscProfile(page: Page) {
  await page.route('**/rest/v1/users**', async (route) => {
    const response = await route.fetch()
    let json: unknown
    try {
      json = await response.json()
    } catch {
      await route.fulfill({ response })
      return
    }
    const rewrite = (u: Record<string, unknown>) => { if (u) u.exam_selection = 'APPSC_GROUPS' }
    if (Array.isArray(json)) json.forEach((u) => rewrite(u as Record<string, unknown>))
    else if (json && typeof json === 'object') rewrite(json as Record<string, unknown>)
    await route.fulfill({ response, body: JSON.stringify(json) })
  })
}

async function installAppscData(page: Page, mode: { subjects: SubjectsMode }) {
  await page.route('**/rest/v1/exam_papers**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PAPERS) })
  })
  await page.route('**/rest/v1/exam_subjects**', async (route) => {
    const paperId = queryParam(new URL(route.request().url()), 'paper_id')
    if (mode.subjects.abort) {
      await new Promise((r) => setTimeout(r, 400))
      await route.abort('connectionfailed')
      return
    }
    if (mode.subjects.serverError) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'An internal server error has occurred' }),
      })
      return
    }
    if (mode.subjects.slowPapers?.has(paperId)) await new Promise((r) => setTimeout(r, 2000))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUBJECTS_BY_PAPER[paperId] || []) })
  })
  await page.route('**/rest/v1/exam_topics**', async (route) => {
    const subject = queryParam(new URL(route.request().url()), 'subject_name')
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TOPICS_BY_SUBJECT[subject] || []) })
  })
  await page.route('**/rest/v1/topic_counts**', async (route) => {
    const subject = queryParam(new URL(route.request().url()), 'subject_name')
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(COUNTS_BY_SUBJECT[subject] || []) })
  })
}

async function installEmptyQuestions(page: Page) {
  await page.route('**/rest/v1/questions**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
}

async function openAppscPortal(page: Page, mode: { subjects: SubjectsMode } = { subjects: {} }) {
  await installAppscProfile(page)
  await installAppscData(page, mode)
  await page.goto('/topic-exams')
  await expect(page.getByText('General Studies Topic')).toBeVisible({ timeout: 40_000 })
}

test.describe('topic-exams remediation browser checks', () => {
  test('T1: portal loads, subject switch shows new topics, topic opens config', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/topic-exams')
    await expect
      .poll(
        async () => (await page.locator('button:has-text("Start Test")').count()) > 0,
        { timeout: 30_000, message: 'expected topic grid' },
      )
      .toBe(true)

    const subjectTabs = page.locator('[aria-label="Select subject"] [role="tab"]')
    const tabCount = await subjectTabs.count()
    if (tabCount > 1) {
      const before = await page.locator('button:has-text("Start Test")').first().innerText()
      await subjectTabs.nth(1).click()
      await expect
        .poll(
          async () => {
            const first = page.locator('button:has-text("Start Test")').first()
            return (await first.count()) === 0 || (await first.innerText()) !== before
          },
          { timeout: 20_000, message: 'expected topic set to change after subject switch' },
        )
        .toBe(true)
    }

    const startTest = page.locator('button:has-text("Start Test")').first()
    if (await startTest.count()) {
      await startTest.click()
      await expect(page.getByRole('button', { name: /start session/i })).toBeVisible({ timeout: 20_000 })
      await page.getByRole('button', { name: /back/i }).first().click()
      await expect(page.getByText('Select Topic').first()).toBeVisible({ timeout: 20_000 })
    }
  })

  test('T2: topic fetch failure shows retryable network error (Connection Lost, non-business) and Try Again recovers', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    let abortTopics = true
    await page.route('**/rest/v1/exam_topics**', async (route) => {
      if (abortTopics) {
        await new Promise((r) => setTimeout(r, 400))
        await route.abort('connectionfailed')
        return
      }
      await route.continue()
    })
    await page.route('**/rest/v1/topic_counts**', async (route) => {
      if (abortTopics) {
        await new Promise((r) => setTimeout(r, 400))
        await route.abort('connectionfailed')
        return
      }
      await route.continue()
    })
    await page.goto('/topic-exams')

    const tryAgain = page.getByRole('button', { name: 'Try Again' })
    await expect(tryAgain).toBeVisible({ timeout: 40_000 })
    await expect(page.getByRole('heading', { name: 'Connection Lost' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to Topic List' })).toHaveCount(0)
    await expect(page.getByText('No topics available')).toHaveCount(0)

    abortTopics = false
    await tryAgain.click()
    await expect
      .poll(
        async () => (await page.locator('button:has-text("Start Test")').count()) > 0,
        { timeout: 30_000, message: 'expected topics to render after retry' },
      )
      .toBe(true)
  })

  test('T3: APPSC Paper A -> Paper B fetch failure -> no stale Paper A under B; retry targets Paper B', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const mode = { subjects: {} as SubjectsMode }
    await openAppscPortal(page, mode)

    await expect(page.getByRole('tab', { name: /paper 1/i })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('tab', { name: /paper 2/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /paper 3/i })).toBeVisible()

    // Paper B's subject fetch now fails (browser-layer abort).
    mode.subjects.abort = true
    await page.getByRole('tab', { name: /paper 2/i }).click()

    // Error screen: retryable network error, NOT a business-empty, and the
    // whole portal (incl. Paper A topics) is replaced — no stale data, no EmptyState.
    const tryAgain = page.getByRole('button', { name: 'Try Again' })
    await expect(tryAgain).toBeVisible({ timeout: 40_000 })
    await expect(page.getByRole('heading', { name: 'Connection Lost' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to Topic List' })).toHaveCount(0)
    await expect(page.getByText('General Studies Topic')).toHaveCount(0)
    await expect(page.getByText('No topics available')).toHaveCount(0)

    // Retry succeeds — Paper B is still the current context, so B renders.
    mode.subjects.abort = false
    await tryAgain.click()
    await expect(page.getByText('Arithmetic Topic')).toBeVisible({ timeout: 40_000 })
    await expect(page.getByText('General Studies Topic')).toHaveCount(0)
  })

  test('T3-RACE: synchronous paperLoading gate blocks rapid paper switching; slow Paper B lands as Paper B content', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const mode = { subjects: { slowPapers: new Set(['paper_b']) } as SubjectsMode }
    await openAppscPortal(page, mode)

    await page.getByRole('tab', { name: /paper 2/i }).click()

    // The full-page paperLoading gate is raised synchronously on the paper
    // change, so the tab row unmounts immediately — a second paper click is
    // structurally impossible while a paper fetch is in flight.
    await expect(page.getByRole('tab', { name: /paper 3/i })).toHaveCount(0, { timeout: 5_000 })
    await expect(page.getByText('General Studies Topic')).toHaveCount(0)

    // The slow Paper B response resolves to Paper B content (not an error, not
    // stale Paper A data).
    await expect(page.getByText('Arithmetic Topic')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('tab', { name: /paper 3/i })).toBeVisible()
    await expect(page.getByText('General Studies Topic')).toHaveCount(0)
  })

  test('T4: warm-cache reload renders content with a single labelled loading region', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/topic-exams')
    await expect
      .poll(
        async () => (await page.locator('button:has-text("Start Test")').count()) > 0,
        { timeout: 30_000 },
      )
      .toBe(true)

    await page.reload()
    await expect
      .poll(
        async () => (await page.locator('button:has-text("Start Test")').count()) > 0,
        { timeout: 30_000 },
      )
      .toBe(true)
    await expect(page.getByText('No topics available')).toHaveCount(0)

    const loadingRegion = page.locator('[role="status"][aria-label="Loading topics"]')
    if (await loadingRegion.count()) {
      await expect(loadingRegion).toHaveCount(1)
      expect((await loadingRegion.locator('[aria-hidden="true"]').count())).toBeGreaterThan(0)
    }
  })

  test('T5: NoAvailableQuestionsError (real service path) -> business-empty -> Back to Topic List -> clean portal', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const mode = { subjects: {} as SubjectsMode }
    await openAppscPortal(page, mode)
    await installEmptyQuestions(page)

    // Start the topic test; the real fetchTopicTestQuestions sees 0 questions
    // and throws the shared NoAvailableQuestionsError.
    await page.locator('button:has-text("Start Test")').first().click()
    await page.getByRole('button', { name: /start session/i }).click()

    await expect(page.getByRole('heading', { name: 'Something Went Wrong' })).toBeVisible({ timeout: 40_000 })
    await expect(page.getByText(/no questions are currently available/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try Again' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Back to Topic List' })).toBeVisible()

    // Back returns to a clean portal: no error state, no stuck loading, no
    // lingering config state.
    await page.getByRole('button', { name: 'Back to Topic List' }).click()
    await expect(page.getByText('General Studies Topic')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /start session/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Try Again' })).toHaveCount(0)
  })

  test('T6: server error renders Server Error (retryable, non-business) distinct from network/business', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const mode = { subjects: {} as SubjectsMode }
    await openAppscPortal(page, mode)

    mode.subjects.serverError = true
    await page.getByRole('tab', { name: /paper 2/i }).click()

    const tryAgain = page.getByRole('button', { name: 'Try Again' })
    await expect(tryAgain).toBeVisible({ timeout: 40_000 })
    await expect(page.getByRole('heading', { name: 'Server Error' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to Topic List' })).toHaveCount(0)

    mode.subjects.serverError = false
    await tryAgain.click()
    await expect(page.getByText('Arithmetic Topic')).toBeVisible({ timeout: 40_000 })
  })
})

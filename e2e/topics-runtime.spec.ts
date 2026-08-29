import { test, expect, type Page } from '@playwright/test'

// ─── Targeted browser checks: /topics (Study Topics) remediation ───────────
// Drives the REAL UserTopics page + real hooks + real live backend (no request
// interception except the one deliberate error-injection scenario). Uses the
// live paper/subject that has published topics:
//   exam  = APPSC_GROUP_1 (allowed for the APPSC_GROUPS test user)
//   paper = 926c7d30-add2-4d03-a040-f011e9282562 (General Studies)
//   subject = History and Culture (13 published topics)
// No LIVE data is created or modified.

const EXAM = 'APPSC_GROUP_1'
const PAPER = '926c7d30-add2-4d03-a040-f011e9282562'
const SUBJECT = 'History and Culture'
const TOPIC_URL = (extra = '') =>
  `/topics?exam=${EXAM}&paper=${PAPER}&subject=${encodeURIComponent(SUBJECT)}${extra}`

const KNOWN_TOPIC = 'Satavahanas & Sangam Age'

const timeout = 45_000

test('R1 cold load: real backend topics render in the list (no error, no false empty)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto(TOPIC_URL())
  await expect(page.getByText(KNOWN_TOPIC)).toBeVisible({ timeout })
  await expect(page.getByText(/No topics found/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /try again/i })).toHaveCount(0)
  expect(errors).toEqual([])
})

test('R2 warm-cache reload: same context renders again without error', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto(TOPIC_URL())
  await expect(page.getByText(KNOWN_TOPIC)).toBeVisible({ timeout })
  await page.reload()
  await expect(page.getByText(KNOWN_TOPIC)).toBeVisible({ timeout })
  expect(errors).toEqual([])
})

test('R3 legitimate business-empty: a real subject with no topics shows the EmptyState, not an error', async ({ page }) => {
  await page.goto(
    `/topics?exam=${EXAM}&paper=${PAPER}&subject=${encodeURIComponent('Geography')}`,
  )
  await expect(page.getByText(/No topics found for this subject yet/i)).toBeVisible({ timeout })
  await expect(page.getByRole('button', { name: /try again/i })).toHaveCount(0)
})

test('R4 error → retry: aborted study_topics request surfaces retryable error; Try Again recovers with real data', async ({ page }) => {
  await page.route('**/rest/v1/study_topics**', (route) => route.abort('failed'))

  await page.goto(TOPIC_URL())
  await expect(page.getByRole('button', { name: /try again/i })).toBeVisible({ timeout })
  expect(await page.getByText(KNOWN_TOPIC).count()).toBe(0)

  await page.unroute('**/rest/v1/study_topics**')
  await page.getByRole('button', { name: /try again/i }).click()

  await expect(page.getByText(KNOWN_TOPIC)).toBeVisible({ timeout })
  await expect(page.getByRole('button', { name: /try again/i })).toHaveCount(0)
})

test('R5 reader navigation: open topic → reader in URL; browser Back closes; Forward restores; reload restores', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto(TOPIC_URL())
  await page.getByText(KNOWN_TOPIC).first().click()

  await expect(page.getByRole('button', { name: /back to all topics/i })).toBeVisible({ timeout })
  expect(page.url()).toContain('topic=')

  // Browser Back closes the reader to the list.
  await page.goBack()
  await expect(page.getByRole('button', { name: /back to all topics/i })).toHaveCount(0)
  await expect(page.getByText(KNOWN_TOPIC).first()).toBeVisible({ timeout })

  // Browser Forward reopens the reader.
  await page.goForward()
  await expect(page.getByRole('button', { name: /back to all topics/i })).toBeVisible({ timeout })

  // Refresh restores the reader from the URL.
  await page.reload()
  await expect(page.getByRole('button', { name: /back to all topics/i })).toBeVisible({ timeout })
  expect(errors).toEqual([])
})

test('R6 invalid topic id: unknown ?topic= falls back to the list safely', async ({ page }) => {
  await page.goto(TOPIC_URL('&topic=does-not-exist-0000'))
  await expect(page.getByText(KNOWN_TOPIC).first()).toBeVisible({ timeout })
  await expect(page.getByRole('button', { name: /back to all topics/i })).toHaveCount(0)
  expect(page.url()).not.toContain('topic=')
})

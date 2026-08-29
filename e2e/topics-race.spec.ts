import { test, expect, type Page } from '@playwright/test'

// ─── Targeted browser checks: /topics A→B→A race-condition remediation ──────
// Real page, real hooks, real backend. Only the DELIBERATELY-controlled
// study_topics responses for the B/C (empty-topic) contexts are intercepted to
// make the race deterministic. A's cold load in every test runs against the
// real backend (13 published topics) and is never intercepted.
//
//   A = APPSC_GROUP_1 / General Studies / History and Culture (13 topics)
//   B = APPSC_GROUP_2 (all papers/subjects have 0 published topics)
//   C = APPSC_GROUP_3 (all papers/subjects have 0 published topics)
//
// The regression this guards: while B's topics request is still in flight,
// returning to A restores A from cache — but B's late empty response used to
// overwrite A → "No topics found". Reload fixed it because the fresh page had
// no in-flight request. After the fix, the late B response must be discarded.
// No LIVE data is created or modified.

const EXAM_A = 'APPSC_GROUP_1'
const PAPER_A = '926c7d30-add2-4d03-a040-f011e9282562'
const SUBJECT_A = 'History and Culture'
const A_DEEP_LINK = `/topics?exam=${EXAM_A}&paper=${PAPER_A}&subject=${encodeURIComponent(SUBJECT_A)}`

const KNOWN_TOPIC_REAL = 'Satavahanas & Sangam Age'

const timeout = 60_000

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function coldLoadA(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(A_DEEP_LINK)
  await expect(page.getByText(KNOWN_TOPIC_REAL).first()).toBeVisible({ timeout })
  return errors
}

async function returnToA(page: Page) {
  await page.getByRole('tab', { name: /group 1/i }).click()
  await expect(page.getByText(KNOWN_TOPIC_REAL).first()).toBeVisible({ timeout })
}

async function assertAIntact(page: Page) {
  await expect(page.getByText(KNOWN_TOPIC_REAL).first()).toBeVisible({ timeout })
  await expect(page.getByText(/No topics found for this subject yet/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /try again/i })).toHaveCount(0)
}

test('R1 A→B→A: B response DELAYED (returns []) → A topics remain after it lands', async ({ page }) => {
  await coldLoadA(page)

  let bIssued = false
  await page.route('**/rest/v1/study_topics**', async (route) => {
    const url = route.request().url()
    if (url.includes('eq.APPSC_GROUP_2')) {
      bIssued = true
      await sleep(3000)
    }
    await route.continue()
  })

  await page.getByRole('tab', { name: /group 2/i }).click()
  await expect(async () => expect(bIssued).toBe(true)).toPass({ timeout })
  // B's topics fetch is now deliberately in flight (delayed 3s).

  await returnToA(page)
  await sleep(3500) // B's delayed [] response must have landed by now.
  await assertAIntact(page)
})

test('R2 A→B→A: B response fulfilled as [] → A topics remain', async ({ page }) => {
  await coldLoadA(page)

  let bIssued = false
  await page.route('**/rest/v1/study_topics**', async (route) => {
    const url = route.request().url()
    if (url.includes('eq.APPSC_GROUP_2')) {
      bIssued = true
      await sleep(2000)
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }
    await route.continue()
  })

  await page.getByRole('tab', { name: /group 2/i }).click()
  await expect(async () => expect(bIssued).toBe(true)).toPass({ timeout })

  await returnToA(page)
  await sleep(2500)
  await assertAIntact(page)
})

test('R3 A→B→A: B request FAILS after return → A topics remain, no error surfaces', async ({ page }) => {
  await coldLoadA(page)

  let bIssued = false
  await page.route('**/rest/v1/study_topics**', async (route) => {
    const url = route.request().url()
    if (url.includes('eq.APPSC_GROUP_2')) {
      bIssued = true
      await sleep(2000)
      await route.abort('failed')
      return
    }
    await route.continue()
  })

  await page.getByRole('tab', { name: /group 2/i }).click()
  await expect(async () => expect(bIssued).toBe(true)).toPass({ timeout })

  await returnToA(page)
  await sleep(2500)
  await assertAIntact(page)
})

test('R4 A→B→C→A: overlapping B and C responses → only A mutates the final UI', async ({ page }) => {
  await coldLoadA(page)

  let bIssued = false
  let cIssued = false
  await page.route('**/rest/v1/study_topics**', async (route) => {
    const url = route.request().url()
    if (url.includes('eq.APPSC_GROUP_2')) {
      bIssued = true
      await sleep(2500)
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }
    if (url.includes('eq.APPSC_GROUP_3')) {
      cIssued = true
      await sleep(3500)
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }
    await route.continue()
  })

  await page.getByRole('tab', { name: /group 2/i }).click()
  await expect(async () => expect(bIssued).toBe(true)).toPass({ timeout })
  await page.getByRole('tab', { name: /group 3/i }).click()
  await expect(async () => expect(cIssued).toBe(true)).toPass({ timeout })

  await returnToA(page)
  await sleep(4000) // both B (2.5s) and C (3.5s) responses land by now.
  await assertAIntact(page)
})

test('R5 reload comparison: full reload of A behaves identically (cache restore, topics render)', async ({ page }) => {
  const errors = await coldLoadA(page)
  await page.reload()
  await expect(page.getByText(KNOWN_TOPIC_REAL).first()).toBeVisible({ timeout })
  await expect(page.getByText(/No topics found for this subject yet/i)).toHaveCount(0)
  expect(errors).toEqual([])
})

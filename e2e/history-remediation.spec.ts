import { test, expect, type Page } from '@playwright/test'

// ─── Targeted browser checks: /history remediation ─────────────────────────
// Verifies BUG-1 (retry while offline stays ErrorContainer), BUG-2 (no empty
// flash during retry — skeleton instead), BUG-3 (reviewed card is inert and
// labelled "Already Reviewed"), BUG-4 (exam selection filter), BUG-5 (filter
// vs true-empty copy), the shared AttemptCardBase on the dashboard, and the
// shared usePageError contract on a non-history consumer (leaderboard).
//
// Network failure is simulated by aborting the specific Supabase REST
// endpoints the pages consume (auth/profile calls to /rest/v1/users are left
// untouched so the session boot succeeds). A short delay on the aborted
// requests makes loading/skeleton transitions deterministically observable.

const ABORT_PATTERNS = [
  '**/rest/v1/attempts**',
  '**/rest/v1/exam_configs**',
  '**/rest/v1/exam_papers**',
  '**/rest/v1/exam_subjects**',
  '**/rest/v1/rpc/**',
]

async function installAbort(page: Page) {
  for (const pattern of ABORT_PATTERNS) {
    await page.route(pattern, async (route) => {
      await new Promise((r) => setTimeout(r, 500))
      await route.abort('connectionfailed')
    })
  }
}

// The /history attempts wrapper is a div with aria-live + a dynamic
// aria-label ("Showing N exam attempts") — it carries no role="region", so
// getByRole cannot see it; anchor on the attribute instead.
function attemptsRegion(page: Page) {
  return page.locator('[aria-label^="Showing "][aria-label$=" exam attempts"]')
}

async function cardExamNames(page: Page): Promise<string[]> {
  const cards = page.locator(
    '[aria-label$="View full review."], [aria-label$="Review already completed."]',
  )
  const count = await cards.count()
  const names: string[] = []
  for (let i = 0; i < count; i++) {
    const label = await cards.nth(i).getAttribute('aria-label')
    if (label) names.push(label.split(' — ')[0].trim())
  }
  return names
}

test.describe('history remediation browser checks', () => {
  test('C1: initial network failure -> Retry while still offline stays ErrorContainer', async ({
    page,
  }) => {
    await installAbort(page)
    await page.goto('/history')

    const alert = page.getByRole('alert').first()
    await expect(alert).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()

    // Retry while the failure persists: skeleton during retry, then the same
    // ErrorContainer — never an empty state or content.
    await page.getByRole('button', { name: 'Try Again' }).click()
    await expect(page.getByRole('status', { name: 'Loading history' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(alert).toBeVisible({ timeout: 45_000 })

    await expect(page.getByText('No official exam attempts yet')).toHaveCount(0)
    await expect(page.getByText('No attempts in this selection')).toHaveCount(0)
    await expect(attemptsRegion(page)).toHaveCount(0)
  })

  test('C2: Retry after restoring network shows content', async ({ page }) => {
    await installAbort(page)
    await page.goto('/history')

    const alert = page.getByRole('alert').first()
    await expect(alert).toBeVisible({ timeout: 60_000 })

    await page.unrouteAll({ behavior: 'wait' })
    await page.getByRole('button', { name: 'Try Again' }).click()

    await expect(attemptsRegion(page)).toBeVisible({ timeout: 60_000 })
    await expect(alert).toHaveCount(0)
  })

  test('C3: exam selection A -> B shows correct filtered history', async ({ page }) => {
    await page.goto('/history')

    const region = attemptsRegion(page)
    await expect(region).toBeVisible({ timeout: 60_000 })

    const tablist = page.getByRole('tablist', { name: 'Select exam' })
    await expect(tablist.first()).toBeVisible({ timeout: 30_000 })
    const tabs = tablist.first().getByRole('tab')
    const count = await tabs.count()
    test.skip(count < 2, 'Account has fewer than two exam tabs — selection check not applicable')

    const tabA = tabs.nth(0)
    const tabB = tabs.nth(1)
    const nameB = (await tabB.textContent())?.trim() ?? ''
    expect(nameB.length).toBeGreaterThan(0)

    const cardsA = await cardExamNames(page)
    expect(cardsA.length).toBeGreaterThan(0)

    await tabB.click()
    await expect(tabB).toHaveAttribute('aria-selected', 'true')

    // B has attempts: the grid must show only B's exam (no A cards remain).
    // B has none: the BUG-5 filter-empty state must appear. Either is correct.
    const emptyState = page.getByText('No attempts in this selection')
    if ((await emptyState.count()) > 0) {
      await expect(emptyState).toBeVisible()
      await expect(attemptsRegion(page)).toHaveCount(0)
    } else {
      await expect(region).not.toContainText(cardsA[0], { timeout: 30_000 })
      const cardsB = await cardExamNames(page)
      expect(cardsB.length).toBeGreaterThan(0)
      for (const name of cardsB) {
        expect(name).not.toBe(cardsA[0])
        expect(name).toBe(cardsB[0])
      }
    }
  })

  test('C4: already-reviewed card shows "Already Reviewed" and has no dead Review nav', async ({
    page,
  }) => {
    // Data note: this account has 160 attempts, all `review_accessed=false`
    // (verified read-only), so no real already-reviewed card exists. To
    // exercise the reviewed rendering path end-to-end without touching real
    // data, the /history attempts GET response is rewritten in the test
    // harness to mark every attempt reviewed. Non-GET requests to `attempts`
    // are never forwarded (write-safety; C4 never visits the review page, but
    // the guard makes accidental mutations impossible).
    await page.route('**/rest/v1/attempts**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        return
      }
      const res = await route.fetch()
      const body = await res.json()
      if (Array.isArray(body) && body.length > 0) {
        body.forEach((row: { review_accessed?: boolean }) => {
          row.review_accessed = true
        })
        await route.fulfill({ response: res, json: body })
      } else {
        await route.continue()
      }
    })

    await page.goto('/history')
    await expect(attemptsRegion(page)).toBeVisible({ timeout: 60_000 })

    const reviewed = page.locator('[aria-label$="Review already completed."]')
    await expect(reviewed.first()).toBeVisible({ timeout: 30_000 })

    const card = reviewed.first()
    await expect(card).toContainText('Already Reviewed')
    await expect(card).not.toContainText('Full Review')
    await expect(card).not.toHaveAttribute('role', 'button')
    expect(await card.getAttribute('tabindex')).toBeNull()

    const url = page.url()
    await card.click()
    await expect(page).toHaveURL(url)
  })

  test('C5: dashboard Recent Activity shared AttemptCardBase is intact', async ({ page }) => {
    // Write-safety: the one-time review gate (useReview -> markReviewAccessed)
    // PATCHes `attempts` when a review page loads. This check only verifies
    // that clicking a fresh card navigates to /review/:id; the PATCH is
    // fulfilled in the harness and never forwarded, so no live row is mutated.
    let gateWriteAttempted = false
    await page.route('**/rest/v1/attempts**', async (route) => {
      if (route.request().method() !== 'GET') {
        gateWriteAttempted = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        return
      }
      await route.continue()
    })

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible({
      timeout: 60_000,
    })
    await expect(page.getByRole('alert')).toHaveCount(0)

    const cards = page.locator(
      '[aria-label$="View full review."], [aria-label$="Review already completed."]',
    )
    await expect(cards.first()).toBeVisible({ timeout: 30_000 })

    const reviewed = page.locator('[aria-label$="Review already completed."]')
    if ((await reviewed.count()) > 0) {
      await expect(reviewed.first()).toContainText('Already Reviewed')
      await expect(reviewed.first()).not.toHaveAttribute('role', 'button')
    }

    const fresh = page.locator('[aria-label$="View full review."]')
    if ((await fresh.count()) > 0) {
      await fresh.first().click()
      await page.waitForURL(/\/review\/.+/, { timeout: 20_000 })

      // The review gate must attempt its write during navigation and be
      // blocked by the harness above — proof no mutation reached the server.
      await expect.poll(() => gateWriteAttempted, { timeout: 15_000 }).toBe(true)
    }
  })

  test('C6: non-history consumer (leaderboard) keeps the shared retry contract', async ({
    page,
  }) => {
    await installAbort(page)
    await page.goto('/leaderboard')

    const alert = page.getByRole('alert').first()
    await expect(alert).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()

    // Retry while the failure persists: error must come back, no content.
    await page.getByRole('button', { name: 'Try Again' }).click()
    await expect(alert).toBeHidden({ timeout: 15_000 })
    await expect(alert).toBeVisible({ timeout: 45_000 })
    await expect(page.getByRole('region', { name: 'Leaderboard rankings' })).toHaveCount(0)

    // Restore network, retry -> the error is gone and the leaderboard renders
    // real UI: either ranking rows or its own "No data found" empty state
    // (both are correct non-error outcomes for this account's data).
    await page.unrouteAll({ behavior: 'wait' })
    await page.getByRole('button', { name: 'Try Again' }).click()

    await expect(page.getByRole('tablist', { name: 'Leaderboard period' })).toBeVisible({
      timeout: 60_000,
    })
    await expect(alert).toHaveCount(0)
    const rankings = page.getByRole('region', { name: 'Leaderboard rankings' })
    const empty = page.getByText('No data found')
    await expect(rankings.or(empty)).toBeVisible({ timeout: 60_000 })
  })
})

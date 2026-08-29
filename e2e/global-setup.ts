import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const BASE_URL = 'http://localhost:5173'
const CREDS_PATH = 'C:/Users/Vasanth/AppData/Local/Temp/opencode/pfu_test_creds.json'
const STATE_PATH = 'C:/Users/Vasanth/AppData/Local/Temp/opencode/pfu_state.json'

export default async function globalSetup() {
  const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf8'))

  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/login`)
  // Let the Cloudflare Turnstile widget load before submitting — the security
  // gateway requires a captcha token (test key auto-passes). Fall back to a
  // short delay if the widget renders without an iframe.
  await page
    .waitForSelector('iframe[src*="challenges.cloudflare.com"]', {
      state: 'attached',
      timeout: 30_000,
    })
    .catch(() => page.waitForTimeout(4000))

  await page.fill('#login-email', creds.email)
  await page.fill('#login-password', creds.password)
  await page.getByRole('button', { name: 'Sign In' }).click()

  // Turnstile uses the Cloudflare test key (always passes). Wait for the
  // post-login redirect away from /login (role-based redirect).
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60_000 })

  // Persist the authenticated session for all tests.
  await context.storageState({ path: STATE_PATH })
  await browser.close()
}

import { defineConfig } from '@playwright/test'

// Targeted browser checks for the /history remediation. Drives the locally
// installed Microsoft Edge (no browser download). A global setup signs in once
// against the live backend and persists the session for every test.
//
// The dev server is started automatically if it is not already running
// (`reuseExistingServer: true`). Credentials are read from a local file
// outside the repository — see e2e/global-setup.ts.

const STATE_PATH = 'C:/Users/Vasanth/AppData/Local/Temp/opencode/pfu_state.json'

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 900 },
    storageState: STATE_PATH,
    trace: 'retain-on-failure',
  },
})

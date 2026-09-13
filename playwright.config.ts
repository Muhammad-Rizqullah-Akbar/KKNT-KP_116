import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test-suites/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'test-suites/results/playwright-report', open: 'never' }]],
  outputDir: 'test-suites/results/playwright-artifacts',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  // webServer: auto-start Next.js dev + Firebase emulator sebelum test
  webServer: [
    {
      command: 'firebase emulators:start --only firestore,auth --project desa-sehat-2026',
      url: 'http://localhost:8090',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        FIRESTORE_EMULATOR_HOST: 'localhost:8090',
        FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
        NEXT_PUBLIC_USE_EMULATOR: 'true',
      },
    },
  ],
})

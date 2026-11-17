import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'always' }]
  ],
  use: {
  baseURL: process.env.BASE_URL || 'https://www.saucedemo.com',
  trace: 'on',
  screenshot: 'on',
  video: 'on-first-retry',
  actionTimeout: 15_000,
  navigationTimeout: 60_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]

  


});

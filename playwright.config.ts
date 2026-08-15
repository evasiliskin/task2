import { defineConfig, devices } from '@playwright/test';

const DEV_SERVER_PORT = 4200;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const DEV_SERVER_START_TIMEOUT_MS = 120_000;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line']] : [['list']],
  use: {
    baseURL: DEV_SERVER_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /\.mobile\.spec\.ts$/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /\.mobile\.spec\.ts$/,
    },
  ],
  webServer: {
    command: 'pnpm run start',
    url: DEV_SERVER_URL,
    reuseExistingServer: !process.env.CI,
    timeout: DEV_SERVER_START_TIMEOUT_MS,
  },
});

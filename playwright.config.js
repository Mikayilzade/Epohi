const { defineConfig } = require('@playwright/test');

const mobileUse = {
  baseURL: 'http://127.0.0.1:4173',
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure'
};

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  use: mobileUse,
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        ...mobileUse,
        browserName: 'chromium'
      }
    },
    {
      name: 'webkit-mobile',
      use: {
        ...mobileUse,
        browserName: 'webkit'
      }
    }
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});

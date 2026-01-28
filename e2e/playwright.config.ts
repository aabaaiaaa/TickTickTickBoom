import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true, // Enable parallel execution
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 4 : 4, // Use multiple workers (4 for local dev too)
    reporter: 'html',
    timeout: 60000, // 60 second timeout

    use: {
        baseURL: 'http://localhost:5175',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: [
        {
            command: 'cmd /c "npx tsx watch src/index.ts"',
            cwd: '../server',
            url: 'http://localhost:3001/health',
            reuseExistingServer: true, // Always reuse existing server
            timeout: 30000,
        },
        {
            command: 'cmd /c "npx vite"',
            cwd: '../client',
            url: 'http://localhost:5175',
            reuseExistingServer: true, // Always reuse existing server
            timeout: 30000,
        },
    ],
});

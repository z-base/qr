import { spawnSync } from 'node:child_process'

const args = ['playwright', 'test', '--config', 'playwright.config.ts']

const result = spawnSync('npx', args, {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)

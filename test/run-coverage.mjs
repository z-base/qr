import { spawnSync } from 'node:child_process'
import fg from 'fast-glob'

const files = await fg(
  ['test/unit/**/*.test.js', 'test/integration/**/*.test.js'],
  {
    onlyFiles: true,
  }
)

if (files.length === 0) {
  console.error('No unit/integration test files found.')
  process.exit(1)
}

const args = [
  'c8',
  '--all',
  '--include',
  'dist/**/*.js',
  '--exclude',
  'dist/**/*.d.ts',
  '--exclude',
  'test/**',
  '--exclude',
  'benchmark/**',
  '--exclude',
  'playwright.config.ts',
  '--reporter',
  'text',
  '--reporter',
  'lcov',
  '--check-coverage',
  '--lines',
  '100',
  '--branches',
  '100',
  '--functions',
  '100',
  '--statements',
  '100',
  'node',
  '--loader',
  './test/loaders/mock-deps-loader.mjs',
  '--test',
  ...files.sort(),
]

const result = spawnSync('npx', args, {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)

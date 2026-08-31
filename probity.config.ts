import { defineConfig, enforceTdd, forbidCommandPattern } from '@nizos/probity'

export default defineConfig({
  rules: [
    {
      files: ['src/**', 'test/**', 'tests/**'],
      rules: [enforceTdd()],
    },
    {
      files: ['**'],
      rules: [
        forbidCommandPattern({
          pattern: /git\s+push\s+.*--force(?!-with-lease)/,
          message: 'Use --force-with-lease only when a force push is genuinely required.',
        }),
      ],
    },
  ],
})

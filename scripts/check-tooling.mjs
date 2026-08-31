import fs from 'node:fs'

const required = [
  'AGENTS.md',
  'CLAUDE.md',
  '.claude/settings.json',
  '.mcp.json',
  '.superdesign/design-system.md',
  'design-md/stripe/DESIGN.md',
  'probity.config.ts',
]

const missing = required.filter((file) => !fs.existsSync(file))
if (missing.length) {
  console.error('Missing required tooling files:', missing.join(', '))
  process.exit(1)
}

for (const file of ['.claude/settings.json', '.mcp.json', 'package.json']) {
  JSON.parse(fs.readFileSync(file, 'utf8'))
}

console.log('Tooling configuration check: PASS')

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

const mcp = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'))
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const playwrightMcp = mcp?.mcpServers?.playwright

if (!playwrightMcp || playwrightMcp.command !== 'npx' || !Array.isArray(playwrightMcp.args) || !playwrightMcp.args.some((arg) => String(arg).includes('@playwright/mcp'))) {
  console.error('Playwright MCP is not registered correctly in .mcp.json')
  process.exit(1)
}

if (!pkg?.devDependencies?.['@playwright/test'] || pkg?.scripts?.e2e !== 'playwright test') {
  console.error('Playwright test runner is not registered correctly in package.json')
  process.exit(1)
}

console.log('Tooling configuration check: PASS (Playwright MCP + test runner registered)')

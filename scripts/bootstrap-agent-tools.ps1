param(
  [switch]$DryRun,
  [switch]$InstallOptionalLabs
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

function Run([string]$Label, [scriptblock]$Action) {
  Write-Host "==> $Label"
  if ($DryRun) { return }
  try { & $Action } catch { Write-Warning "$Label failed: $($_.Exception.Message). Continuing." }
}

function Clone-Or-Update([string]$Repo, [string]$Dest) {
  if (Test-Path (Join-Path $Dest ".git")) {
    git -C $Dest pull --ff-only
  } elseif (-not (Test-Path $Dest)) {
    git clone --depth 1 $Repo $Dest
  } else {
    Write-Warning "$Dest exists but is not a git checkout; skipped."
  }
}

New-Item -ItemType Directory -Force -Path ".tools/external", ".claude/skills" | Out-Null

Run "npm dev tooling (Repomix + Probity)" {
  npm install
}

Run "ECC (safe guided project install/update)" {
  if (Get-Command claude -ErrorAction SilentlyContinue) {
    npx --yes ecc-universal@latest install --guided --harness claude --claude-scope project --claude-hooks standard --profile core --yes
  } else {
    Write-Warning "Claude Code not found on PATH; .claude/settings.json already declares ecc@ecc."
  }
}

Run "Impeccable project skill" {
  if (-not (Test-Path ".claude/skills/impeccable/SKILL.md")) {
    npx --yes impeccable@latest install
  } else {
    Write-Host "already installed"
  }
}

Run "SuperDesign project skill" {
  if (-not (Test-Path ".claude/skills/superdesign/SKILL.md")) {
    npx --yes skills add superdesigndev/superdesign-skill
  } else {
    Write-Host "already installed"
  }
}

Run "book-to-skill" {
  Clone-Or-Update "https://github.com/virgiliojr94/book-to-skill.git" ".claude/skills/book-to-skill"
}

Run "Karpathy upstream source" {
  Clone-Or-Update "https://github.com/multica-ai/andrej-karpathy-skills.git" ".tools/external/andrej-karpathy-skills"
}

Run "Awesome Claude Code reference library" {
  Clone-Or-Update "https://github.com/hesreallyhim/awesome-claude-code.git" ".tools/external/awesome-claude-code"
}

Run "Ant Design reference checkout (not product runtime dependency)" {
  Clone-Or-Update "https://github.com/ant-design/ant-design.git" ".tools/external/ant-design"
}

Run "screenshot-to-code on-demand checkout" {
  Clone-Or-Update "https://github.com/abi/screenshot-to-code.git" ".tools/external/screenshot-to-code"
}

Run "Dify isolated checkout" {
  Clone-Or-Update "https://github.com/langgenius/dify.git" ".tools/external/dify"
}

Run "OpenClaw CLI" {
  if (-not (Get-Command openclaw -ErrorAction SilentlyContinue)) {
    npm install -g openclaw@latest --allow-scripts=openclaw
  } else {
    Write-Host "already installed"
  }
}

Run "Claude Squad source" {
  Clone-Or-Update "https://github.com/smtg-ai/claude-squad.git" ".tools/external/claude-squad"
}

if ($InstallOptionalLabs) {
  Run "Python agent frameworks in isolated tooling venv" {
    if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
      Write-Warning "uv not installed; skipped LangGraph/DSPy/PydanticAI/CrewAI."
    } else {
      $Venv = ".tools/agent-lab/.venv"
      New-Item -ItemType Directory -Force -Path ".tools/agent-lab" | Out-Null
      if (-not (Test-Path $Venv)) { uv venv $Venv }
      $Py = Join-Path $Venv "Scripts/python.exe"
      uv pip install --python $Py --upgrade langgraph dspy pydantic-ai crewai
    }
  }
}

Write-Host ""
Write-Host "Configured in-repo already:"
Write-Host "- ECC + Superpowers declarations"
Write-Host "- wshobson/agents + Claude Subconscious marketplaces"
Write-Host "- Playwright MCP"
Write-Host "- Probity + Repomix"
Write-Host "- DRx/SuperDesign/Stripe design references"
Write-Host ""
Write-Host "Claude Subconscious still needs LETTA_API_KEY before activation."
Write-Host "Dify is cloned only; start its Docker stack explicitly when needed."
Write-Host "The ambiguous item named 'agent' is intentionally not installed without a verified repo."

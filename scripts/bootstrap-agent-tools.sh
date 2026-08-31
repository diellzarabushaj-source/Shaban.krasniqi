#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p .tools/external .claude/skills

run() {
  local label="$1"; shift
  echo "==> $label"
  "$@" || echo "WARN: $label failed; continuing" >&2
}

clone_or_update() {
  local repo="$1" dest="$2"
  if [ -d "$dest/.git" ]; then
    git -C "$dest" pull --ff-only
  elif [ ! -e "$dest" ]; then
    git clone --depth 1 "$repo" "$dest"
  else
    echo "WARN: $dest exists but is not a git checkout; skipped" >&2
  fi
}

run "npm dev tooling (Repomix + Probity)" npm install

if command -v claude >/dev/null 2>&1; then
  run "ECC safe guided install/update" npx --yes ecc-universal@latest install --guided --harness claude --claude-scope project --claude-hooks standard --profile core --yes
else
  echo "WARN: Claude Code not on PATH; declarative settings are already committed."
fi

[ -f .claude/skills/impeccable/SKILL.md ] || run "Impeccable" npx --yes impeccable@latest install
[ -f .claude/skills/superdesign/SKILL.md ] || run "SuperDesign" npx --yes skills add superdesigndev/superdesign-skill

clone_or_update https://github.com/virgiliojr94/book-to-skill.git .claude/skills/book-to-skill
clone_or_update https://github.com/multica-ai/andrej-karpathy-skills.git .tools/external/andrej-karpathy-skills
clone_or_update https://github.com/hesreallyhim/awesome-claude-code.git .tools/external/awesome-claude-code
clone_or_update https://github.com/ant-design/ant-design.git .tools/external/ant-design
clone_or_update https://github.com/abi/screenshot-to-code.git .tools/external/screenshot-to-code
clone_or_update https://github.com/langgenius/dify.git .tools/external/dify
clone_or_update https://github.com/smtg-ai/claude-squad.git .tools/external/claude-squad

if ! command -v openclaw >/dev/null 2>&1; then
  run "OpenClaw CLI" npm install -g openclaw@latest --allow-scripts=openclaw
fi

echo "Done. Claude Subconscious still needs LETTA_API_KEY before activation."
echo "Dify is cloned only; start Docker explicitly when needed."
echo "The ambiguous item named 'agent' was not installed without a verified repo."

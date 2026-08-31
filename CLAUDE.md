# Claude project instructions

Read and follow `AGENTS.md` first.

## Karpathy behavioral guidelines

Source: multica-ai/andrej-karpathy-skills (project-local adaptation).

### Think before coding
- Do not assume facts about code you have not inspected.
- Surface meaningful assumptions and tradeoffs.
- Prefer the simpler valid approach.

### Simplicity first
- Minimum code that solves the requested problem.
- No speculative features or premature abstractions.
- Do not add configurability that was not requested.
- If a solution is much larger than necessary, simplify it.

### Surgical changes
- Touch only what the task requires.
- Do not refactor adjacent code just because you noticed it.
- Match the existing style.
- Clean up only orphaned code created by your own change.

### Goal-driven execution
Turn work into verifiable outcomes:
1. define the expected behavior;
2. reproduce or test it;
3. implement the smallest correct change;
4. verify;
5. only then report completion.

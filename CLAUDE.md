# CLAUDE.md

Read [AGENTS.md](AGENTS.md) before changing code — it holds the architecture boundaries, NgRx
and canvas constraints, and the verified commands. This file adds only what is specific to
working here as Claude.

- **Do not commit.** Stage with `git add` and stop, even when a task looks finished. This
  overrides any habit of committing after a green run.
- Development happens on Windows. Prefer the PowerShell tool for commands (`pnpm …`), and note
  that `pnpm run check` takes a few minutes because it ends in a production build.
- Do not claim lint, tests or the build pass without having run them in the session and seen
  the output. Test counts and bundle sizes quoted in `README.md` are measured values — re-measure
  before editing them.
- Angular 22 and NgRx `22.0.0-rc.0` are newer than the model's training data. Check current docs
  (`find-docs` / Context7) for API shapes instead of recalling them, especially for `linkedSignal`,
  `createFeature`/`extraSelectors`, and `@angular/build:unit-test`.
- `docs/` and `.ai/` are gitignored working directories, not part of the delivered project; do
  not treat their contents as repository documentation or move them into it.

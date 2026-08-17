# CLAUDE.md

Read [AGENTS.md](AGENTS.md) before changing code — it holds the architecture boundaries, NgRx and
canvas constraints, and the verified commands. This file adds only what is specific to working
here as Claude.

- **Do not commit.** Stage with `git add` and stop, even when a task looks finished. The user
  reviews and commits.
- Development happens on Windows. Prefer the PowerShell tool for `pnpm …`, and expect
  `pnpm run check` to take a few minutes because it ends in a production build.
- Do not claim lint, tests or the build pass without having run them in this session and seen the
  output. Bundle sizes quoted in `README.md` are measured values — re-measure before editing them.
- Angular 22 and NgRx `22.0.0-rc.0` are newer than the model's training data. Check current docs
  (`find-docs` / Context7) for API shapes rather than recalling them, especially `linkedSignal`,
  `createFeature`/`extraSelectors`, and `@angular/build:unit-test`.
- Project-specific engineering guidance lives in `.ai/skills/` (architecture, NgRx, RxJS, canvas,
  performance, accessibility, testing, code review). It is gitignored but authoritative for how
  work here is done — consult the relevant skill before a change in that area.

# Frontend Screening Assignment

An Angular workspace built for a Frontend Team Lead screening assignment. This
repository currently contains the **project foundation only** — architecture,
tooling, and a Hello World page. The assignment features themselves (search,
history, canvas polygon editor, etc.) are implemented in a later phase; see
[Planned architecture](#planned-architecture-not-yet-implemented) below.

## Technology stack

- Angular 22 — standalone components, no NgModules
- TypeScript, strict mode
- RxJS
- NgRx Store, Effects, Entity, Store DevTools
- Angular CDK
- NG-ZORRO (Ant Design for Angular)
- Vitest (via `@angular/build:unit-test`)
- Angular ESLint (flat config)
- Prettier

## Architecture

Feature-oriented structure under `src/app`:

```
src/app/
  core/            cross-cutting singletons (config, http, interceptors) — created on demand
  shared/          reusable, feature-agnostic building blocks (ui, directives, pipes) — created on demand
  features/
    home/          Hello World landing page
  app.component.ts
  app.config.ts
  app.routes.ts
```

`core/` and `shared/` subfolders are created only when a real file needs to live
there, not pre-scaffolded as empty directories. Each feature under `features/`
owns its own components, models, state, and data-access.

See [AGENTS.md](AGENTS.md) for the full architectural contract, and
[.ai/skills/](.ai/skills/) for topic-specific rules (Angular, NgRx, RxJS,
testing, performance, canvas, accessibility, code review) that AI agents (and
contributors) should follow when working in this repository.

## Development

Node version is pinned in [.nvmrc](.nvmrc). Angular CLI 22 requires Node
`^22.22.3`, `^24.15.0`, or `>=26.0.0` — if your active Node version is older,
switch with `nvm use` before running the commands below.

```bash
pnpm install
pnpm start
```

The app serves at `http://localhost:4200`.

## Quality checks

```bash
pnpm run lint          # Angular ESLint
pnpm run format:check  # Prettier check
pnpm run test:ci       # Vitest, single run
pnpm run build         # production build
```

Run everything at once:

```bash
pnpm run check
```

Other scripts: `pnpm run format` (write formatting fixes), `pnpm test` (watch
mode locally).

`pnpm run check` also runs automatically on `git push` via a Husky pre-push
hook.

## Planned architecture (not yet implemented)

The following are architectural goals for the next development phase, not
current functionality:

- typeahead search against a public text-search API, with debounce, request
  cancellation, and result caching
- virtual scrolling and batch-based pagination over search results
- search history and query suggestions, backed by NgRx + NgRx Entity
- image preview dialog
- Canvas-based polygon editor: drawing, drag/drop, rotation, resizing, with
  geometry kept in pure, testable functions independent of canvas dimensions

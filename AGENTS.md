# AGENTS.md

## Project

This repository is an Angular frontend application created for a Frontend Team Lead screening assignment.

The goal of the project is not only to implement functionality but also to demonstrate:

- frontend architecture
- maintainability
- scalability
- clean code
- testability
- performance awareness
- accessibility
- state management
- AI-assisted development discipline

The application must remain production-like even though it is a screening assignment.

---

## Technology Stack

- Angular 22 (standalone APIs, Vitest test runner via `@angular/build:unit-test`)
- TypeScript 6, full `strict` mode
- RxJS 7
- NgRx Store / Effects / Entity / Store DevTools 22 (release candidate — no stable 22.x
  release existed at scaffold time; RC was chosen over downgrading to Angular 21 or
  force-installing a mismatched stable release against peer dependencies. Re-pin to
  stable once `@ngrx/store@22.x` ships.)
- Angular CDK 22
- NG-ZORRO / Ant Design 22 (stable)
- Vitest
- Angular ESLint (flat config, `eslint.config.mjs`, ESM)
- Prettier

Use standalone Angular APIs.

Do not introduce NgModules unless a third-party library explicitly requires them.

Node version is pinned in `.nvmrc` (26.5.0, mirrored in `package.json` `engines`)
and satisfies Angular CLI 22's minimum (^22.22.3, ^24.15.0, or >=26.0.0). Run
`nvm use` before `ng`/pnpm scripts if your shell is on a different Node version.

---

## Architecture

Use feature-oriented architecture.

Prefer:

src/app/features/<feature>

over:

src/app/components
src/app/services
src/app/models

Do not create generic folders such as:

- utils
- helpers
- common
- misc

unless there is a clear architectural reason.

The skeleton ships with `core/` and `shared/` intentionally empty of subfolders.
Create `core/config`, `core/http`, `core/interceptors`, `shared/ui`,
`shared/directives`, or `shared/pipes` only when a real file needs to live there —
do not pre-create empty directories or placeholder files.

Keep closely related code together.

One primary concept per file.

Keep UI components focused on presentation.

Business logic belongs in services, facades, reducers, selectors, effects or pure functions depending on responsibility.

---

## Angular

Follow the official Angular Style Guide.

Prefer:

- standalone components
- inject()
- strict TypeScript
- OnPush-compatible architecture
- signals for local UI state when appropriate
- computed() for derived local state
- modern Angular control flow
- typed inputs and outputs
- protected template members

Avoid:

- unnecessary lifecycle hooks
- complex template expressions
- business logic inside templates
- manual subscriptions inside components
- deeply nested components with excessive responsibilities
- global mutable state

---

## State Management

NgRx Store is the application state manager.

Use NgRx when state:

- is shared between multiple components
- survives component/dialog lifecycle
- represents server data
- needs caching
- needs derived selectors
- requires effects
- represents user history
- must be persisted or restored

Use local component state for purely presentational state.

Do not put every UI flag into NgRx.

Use:

- actions
- reducers
- selectors
- effects
- NgRx Entity

for appropriate feature state.

Keep reducers pure.

Effects handle side effects.

Selectors contain derived state logic.

Do not perform HTTP calls from components.

---

## NgRx Entity

Use @ngrx/entity for collections.

Do not store server result arrays as duplicated collections when entity normalization is appropriate.

Prefer entity IDs and entity maps.

Avoid storing derived state if it can be calculated by selectors.

---

## RxJS

Prefer declarative RxJS pipelines.

For typeahead:

- debounce user input
- normalize queries
- ignore meaningless queries
- avoid duplicate requests
- cancel obsolete requests
- cache appropriate requests

Use switchMap for cancellable typeahead requests.

Do not manually subscribe when an observable can be consumed declaratively.

Every subscription must have a clear lifecycle.

---

## HTTP

All HTTP communication belongs to dedicated data-access services.

Components must not call HttpClient directly.

Interceptors should be used for cross-cutting HTTP concerns such as:

- correlation/request identifiers
- error normalization
- authentication if required
- logging/diagnostics where appropriate

Do not put business logic in interceptors.

---

## UI

Use NG-ZORRO components whenever an equivalent component exists.

Do not manually recreate:

- buttons
- dialogs
- inputs
- lists
- notifications
- loading indicators
- pagination controls
- common layout components

Custom CSS should be limited to application-specific presentation.

---

## Performance

Performance is part of the assignment.

Consider:

- debouncing
- request cancellation
- HTTP caching
- result caching
- virtual scrolling
- pagination
- DOM minimization
- OnPush-compatible components
- stable tracking keys
- memoized selectors
- avoiding unnecessary state updates
- image sizing/loading
- canvas rendering efficiency

Do not optimize blindly.

Performance decisions should be documented when they are non-obvious.

The initial bundle already carries NgRx, Angular CDK, and NG-ZORRO before any
feature code, so the production build sits close to the default 500 kB warning
budget. Lazy-load feature routes (`loadComponent`/`loadChildren`) as
`features/` grows, and import NG-ZORRO component styles individually (see
`angular.json` `styles`) rather than the full `ng-zorro-antd.min.css` bundle.

---

## Testing

Every non-trivial piece of business logic should be testable.

Prioritize:

1. pure functions
2. reducers
3. selectors
4. effects
5. services
6. important component behavior

Do not test implementation details unnecessarily.

Prefer behavior-oriented tests.

Tests must be deterministic.

Do not use real external APIs in unit tests.

Mock HTTP requests using Angular testing utilities.

---

## Canvas

Canvas drawing logic must be isolated from Angular presentation logic.

Do not put polygon geometry calculations directly inside a page component.

Prefer dedicated classes/services/pure functions for:

- coordinate transformation
- polygon manipulation
- rotation
- resizing
- hit testing
- drag calculations

Keep coordinate systems explicit.

The polygon model should be independent from rendered canvas dimensions.

---

## Error Handling

Do not silently swallow errors.

User-facing errors should be represented by application state where appropriate.

Technical errors should remain diagnosable.

Avoid logging sensitive information.

---

## Accessibility

Use semantic HTML.

Use accessible labels.

Keyboard interaction must be considered for interactive controls.

Do not rely exclusively on color.

Dialogs and interactive controls must have accessible names.

---

## Naming

Use descriptive names.

Prefer:

loadSearchResults

over:

loadData

Prefer:

searchResultsFeature

over:

dataFeature

Use Angular naming conventions.

Files use kebab-case.

---

## AI Development Rules

AI must not implement large changes without first understanding the architecture.

Before changing code:

1. inspect this file (AGENTS.md)
2. inspect the relevant skill(s) in `.ai/skills/`
3. inspect the existing architecture
4. identify the feature boundary
5. identify state ownership
6. identify existing reusable abstractions
7. propose a plan for significant changes

After implementation:

1. run tests (`pnpm run test:ci`)
2. run lint (`pnpm run lint`)
3. run format check (`pnpm run format:check`)
4. run the production build (`pnpm run build`)
5. review the resulting diff
6. verify compliance with this file

Never introduce a new dependency without explaining why it is needed.

Never duplicate an existing abstraction.

Never bypass lint or tests.

Never disable TypeScript strictness to make code compile.

Never modify configuration simply to hide a problem.

Never implement a large feature without first understanding the existing
architecture and stating a plan.

Never commit changes in this repository, even if asked to or if it seems like
the natural next step after finishing a task. Never run `git commit` for any
reason — not after a task, a task review, a phase, or a fix — regardless of
what earlier commits in the branch's history look like. Stage changes with
`git add` and stop there. The user reviews the diff and commits manually.

---

## Definition of Done

A change is complete only when:

- TypeScript compiles
- tests pass
- lint passes
- formatting passes
- production build succeeds
- no unnecessary dependencies were introduced
- architecture remains feature-oriented
- public APIs are typed
- error states are considered
- accessibility is considered
- performance impact is understood

## Documentation lookups

Use Context7 (or whichever MCP/CLI documentation tool is available) whenever you need current documentation for Angular, Angular Material, NG-ZORRO (Ant Design for Angular), Vitest, TypeScript, RxJS, or any other library, framework, API, or tool used in this project.

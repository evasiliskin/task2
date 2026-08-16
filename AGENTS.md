# AGENTS.md

Conventions for AI coding agents working in this repository. Read [README.md](README.md) first
for what the app does and how the architecture fits together — this file only covers what you
must respect while changing it.

## Ground rules

- Never disable TypeScript strictness, lint rules or tests to make something pass, and never
  raise a budget or relax a config to hide a problem.
- Never add a dependency without stating why an existing one cannot do the job.
- Fetch current docs before relying on API details for Angular, NgRx, NG-ZORRO, RxJS, Vitest or
  Playwright — this project runs Angular 22 and pre-release NgRx `22.0.0-rc.0`, where training
  data is often wrong.
- `docs/` and `.ai/` are gitignored working directories (plans and reusable engineering
  guidance), not part of the delivered project. Do not treat them as repository documentation or
  move them into it.

## Repository map

| Path                  | Holds                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| `src/app/core/`       | app-wide infrastructure: API config token, HTTP interceptor, `CLOCK`        |
| `src/app/shared/`     | reusable framework-free rules (currently query normalization)               |
| `src/app/features/*/` | self-contained features: `domain/`, `data-access/`, `state/`, `ui/`, facade |
| `src/app/shell/`      | composition: the page component and cross-feature effects                   |
| `e2e/`                | Playwright specs; `*.mobile.spec.ts` runs on the phone project only         |

Create `core/`, `shared/` or feature subfolders only when a real file needs them. Do not add
`utils/`, `helpers/` or `common/` buckets.

## Boundaries (enforced, not advisory)

- A feature must not import another feature — not through `@search` / `@query-history` /
  `@image-editor`, not through a relative path. `eslint.config.mjs` blocks it and
  `src/app/features/feature-boundaries.spec.ts` fails the test suite on it. Compose in
  `src/app/shell/` instead, preferably by reacting to an action shape rather than importing a
  facade.
- Cross-boundary imports use path aliases (`@core/*`, `@shared/*`, feature barrels), never
  `../../../`.
- Everything a feature exposes goes through its `index.ts` barrel. If code outside the feature
  needs something new, export it there rather than deep-importing.
- Components reach the store only through the feature facade, and never inject `HttpClient`. HTTP
  lives in `data-access/`; the interceptor normalizes failures and must stay free of business
  logic.

## Component responsibilities

- All components are `ChangeDetectionStrategy.OnPush`, use `input()`/`output()`/signals, and keep
  template expressions trivial.
- Components under `features/*/ui/` are presentational: they render inputs and emit events.
  `SearchShell` is the only orchestrating component; facades own dispatch and selection.
- Local component state is for genuinely transient UI (draw mode, in-progress vertices, the active
  gesture draft, last visible scroll range). Do not promote these to NgRx.
- No manual `subscribe()` in components. The existing exceptions — the facade's app-lifetime query
  pipeline and the canvas pointer-gesture streams — are bound to `takeUntilDestroyed`.

## NgRx conventions

- One `createFeature` slice per feature; actions via `createActionGroup`. Sources are split by
  origin (`[Search Page]`, `[Search]`, `[Search API]`); put a new action in the group matching who
  dispatches it, and name it as an event, not a command.
- Selectors live in the feature's reducer file (`extraSelectors`), not a separate file. Prefer
  extending the existing view-model selector over adding another subscription in a component.
- `@ngrx/entity` for every collection; never keep a parallel array of the same data.
- Reducers are the guard against stale async: search's success/failure handlers drop results whose
  `query` no longer matches `activeQuery`. Preserve that check if you touch them.
- Cancellation operators are load-bearing: `switchMap` for the query effect (cancel stale),
  `exhaustMap` plus the `status`/`page` guard for pagination (drop duplicates). Swapping either
  for `mergeMap` reintroduces duplicate or out-of-order pages.
- Injectable seams keep effects and reducers deterministic: `CLOCK` for timestamps, `POLYGON_ID`
  for ids, `OPENVERSE_API_CONFIG` for the base URL. Do not call `Date.now()`,
  `crypto.randomUUID()` or hardcode the URL directly.

## Canvas and polygon constraints

Easy to break with a refactor that looks harmless:

- Stored polygon geometry is **normalized (0..1) local-space points plus `position`,
  `rotationRadians` and `scale`** — never pixels, never absolute vertices. Anything that rewrites
  vertices in place reintroduces drift and breaks proportional resizing.
- Normalized ↔ pixel conversion happens only in `to-pixel-point.ts` / `to-normalized-point.ts`.
  Do not inline `× width` anywhere else.
- Rotation must go through the aspect-corrected helpers in `point-math.ts`. A plain rotation
  matrix on normalized coordinates shears the shape on non-square images.
- Handle geometry (`get-handle-points.ts`) is intentionally computed in pixel space and clamped
  into the canvas box. Moving it to normalized space puts handles off-canvas near edges.
- The pivot is the vertex mean (`compute-centroid.ts`), asserted by its spec — changing it to an
  area centroid is a deliberate decision, not a cleanup.
- Never dispatch on `pointermove`. Gestures update a local draft signal and commit once on
  `pointerup`; teardown must keep handling `pointercancel`, `lostpointercapture` and window `blur`.
- Canvas paints go through `CanvasRenderScheduler` (one paint per animation frame, DPR-aware). Do
  not call the renderer directly from the component.
- Geometry belongs in `image-editor/domain/geometry/` as pure functions. `rendering/` and
  `interaction/` translate; they do not invent coordinate math.

## Performance-sensitive behaviour

Keep these intact unless changing them is the point: the 300 ms typeahead debounce and canonical
`distinctUntilChanged`; request cancellation and the pagination guard; the LRU result cache in
`SearchRepository`; CDK virtual scrolling with a stable `trackBy` on result `id`; `loading="lazy"`
thumbnails; the lazy `import()` of the preview dialog; and the animation-frame render coalescing.

## Accessibility

The UI is keyboard-operable and screen-reader-labelled by design: the suggestion list is a
hand-rolled ARIA combobox, the canvas exposes a dynamic `aria-label` and announces polygon actions
through the CDK `LiveAnnouncer`, and the preview dialog labels itself and restores focus on close.
`angular.configs.templateAccessibility` is part of the lint config. Do not remove these when
reworking the markup.

## Testing expectations

- Colocate `*.spec.ts` with the code. Behaviour changes come with test changes in the same diff;
  new geometry or query rules come with table-driven unit tests.
- No real network in unit tests: mock at `OpenverseApi`/`SearchRepository` or use Angular HTTP
  testing. Use fake timers for debounce and retry behaviour.
- Playwright specs mock Openverse through `e2e/openverse-mock.ts`. Add one only for flows that
  genuinely need a browser (canvas gestures, virtual scrolling, layout).

## Commands

```bash
pnpm run check
```

Runs lint → format check → unit tests → production build. It is also the pre-push hook and the
definition of done for a change. Individually: `pnpm run lint`, `pnpm run format`,
`pnpm run test:ci`, `pnpm run build`. `pnpm run e2e` is separate (needs a dev server and
`npx playwright install chromium`).

Use pnpm, never npm or yarn. Keep new scripts wrapped in `cross-env` like the existing ones.
Commit subjects follow `TS-2: <imperative summary>`.

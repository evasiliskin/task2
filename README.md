# Frontend Screening Assignment

An Angular typeahead image search application backed by [Openverse](https://openverse.org),
with an NgRx-backed search history, and a Canvas-based polygon editor for
annotating the selected image.

## Technology stack

- Angular 22 — standalone components, no NgModules
- TypeScript, strict mode
- RxJS
- NgRx Store, Effects, Entity, Store DevTools (22 RC — see [AGENTS.md](AGENTS.md))
- Angular CDK (virtual scrolling)
- NG-ZORRO (Ant Design for Angular)
- Vitest (via `@angular/build:unit-test`)
- Angular ESLint (flat config)
- Prettier

## Dependency decisions

NgRx is pinned to `22.0.0-rc.0`. As of 2026-08-14 `@ngrx/store`'s `latest` tag
is `21.1.1` and `22.0.0-rc.0` is `next`, so a stable NgRx 22 does not exist
yet; re-pin once it ships. `@angular/cdk` is forced to a single version
through a pnpm override because `ng-zorro-antd@22.0.1` depends on `22.1.1`
while this project requires `^22.1.2` — without the override two copies of
the CDK are installed and both reach the bundle.

`lodash` was removed from the project entirely — it is not a dependency and
there is nothing CommonJS in the app, so `angular.json` has no
`allowedCommonJsDependencies` entry. The search-results cache key used to be
prefixed with `lodash.kebabCase`; it's now a small local `toKebabCase`
helper (`src/app/features/search/data-access/to-kebab-case.ts`) instead. See
Performance & bundle below for how the key is actually built.

## Public API

Search is powered by the [Openverse API](https://api.openverse.org/v1/images/) —
free, openly-licensed image search with no API key required for anonymous
access, CORS-enabled, and real `page`/`page_size` pagination
(`result_count`/`page_count` in the response). Alternatives considered:
Unsplash (signup-gated API key, 50 req/hour demo limit) and the iTunes Search
API (no key, but a media domain rather than images, and only limit/offset
pagination).

## Architecture

Feature-oriented structure under `src/app`:

```
src/app/
  core/
    api/openverse/          Openverse base URL + page-size config (InjectionToken)
    http/                   HTTP error-normalizing interceptor
  features/
    search/
      domain/                SearchResult model, normalizeSearchQuery(), isMeaningfulQuery()
      data-access/            OpenverseApi, mapOpenverseSearchResponse (DTO -> domain), SearchResultsCache
      state/                  actions, entity-adapted reducer, effects, selectors
      ui/                     search-input, search-results-list (CDK virtual scroll),
                               search-result-item, search-empty-state, search-error-state
      search.facade.ts        the only surface UI components talk to
    query-history/
      domain/                 QueryHistoryEntry model, suggestionsFor() word-matching rule
      state/                  actions, entity-adapted reducer + selectors (no effects here —
                               the recording effect lives in shell/, see below)
      query-history.facade.ts
    image-editor/
      domain/geometry/        pure, Angular/Canvas-free: points, rotation, scale, centroid,
                               bounding box, hit-test, coordinate mapping
      state/                  polygon actions/reducer/selectors, entity keyed by polygon.id
                               (imageId is a grouping key, not the identity)
      rendering/               PolygonCanvasRenderer — draws the polygon overlay only
      interaction/             PolygonInteractionController — pointer/keyboard -> geometry translation
      ui/                      image-preview-dialog, polygon-canvas
      image-editor.facade.ts
  shell/
    search-shell.component.ts               SearchShell — the search page component; opens the
                                             image preview dialog when a result is selected
    query-history-recording.effects.ts      the query-history recording effect (see below)
  app.component.ts / app.config.ts / app.routes.ts
```

`core/` and `shared/` subfolders are created only when a real file needs to
live there. Each feature under `features/` owns its own domain, data-access,
state, and UI.

See [AGENTS.md](AGENTS.md) for the full architectural contract. Topic-specific
rules (Angular, NgRx, RxJS, testing, performance, canvas, accessibility, code
review) live under `.ai/skills/`, a gitignored local directory not part of
this repository.

### Cross-feature contracts

- `query-history` reacts to `search`'s `[Search API] Load Results Success`
  action via `src/app/shell/query-history-recording.effects.ts` (only records
  a query when it's page 1 and `resultCount > 0`) — a one-directional
  dependency on an action _shape_, not a facade import. The recording effect
  lives in `shell/` rather than in either feature, which is what makes the
  dependency one-directional.
- `SearchShell` (in `src/app/shell/`) calls `ImagePreviewDialogService.open(target)` to launch the
  dialog after a result is selected — dialog presentation lives in that
  service, not in `image-editor.facade.ts`. The dialog receives only a plain
  `ImagePreviewTarget` input (`{ imageId, imageUrl, title, width, height }`)
  — it has no knowledge of Openverse, HTTP, or NgRx search state.

## Search & pagination

- Every keystroke updates a local signal (typing never waits on the store) and is
  pushed into `SearchFacade`. The facade holds one app-lifetime RxJS pipeline —
  `debounceTime(300) → map(normalizeSearchQuery) → distinctUntilChanged` — which
  dispatches either `searchRequested` or `queryCleared` depending on
  `isMeaningfulQuery`. Keystrokes therefore never reach the store, and DevTools
  shows one action per settled query rather than one per character. The HTTP call
  lives in `performSearch$`, which reacts to `searchRequested` via `switchMap`.
- The CDK virtual-scroll list's near-end trigger dispatches
  `[Search Page] Next Page Requested`. Its effect uses `exhaustMap`
  (not `switchMap`/`concatMap`), guarded by a `withLatestFrom` check against
  the current `page`/`status`, so a second trigger while a page is already
  in flight is dropped.
- Results are `@ngrx/entity`-adapted (`upsertMany`, keyed by Openverse's
  stable `id`), which also makes duplicate IDs across pages self-healing.
- `SearchResultsCache` is an in-memory LRU cache (`Map<"query|page", MappedSearchPage>`,
  capped at 30 entries, 5-minute TTL) consulted inside `SearchRepository`, which
  the effect calls, before hitting the network — session-scoped, no
  `localStorage`/IndexedDB layer; see Limitations below.
- Empty/meaningless queries dispatch a `queryCleared` action that resets
  results and status to `idle` without calling the API or recording history.
- The HTTP error interceptor retries `429`/`5xx`/network-error responses
  (up to 2 attempts, exponential backoff) before giving up. A request that
  still fails dispatches a normalized, user-safe error message; `status`
  becomes `'error'` and renders via a dedicated error-state component with a
  retry action. Failed requests are not cached.

## Query history & suggestions

Only _meaningful_ queries that actually returned results are recorded
(page 1, `resultCount > 0`), keyed by normalized query text via
`@ngrx/entity`'s `upsertOne` — re-recording an existing canonical query
updates that entry instead of duplicating it. `suggestionsFor()` breaks both the
typed input and each history entry into words and matches when every typed
word is a prefix of some word in the historical entry — so "mountain lake"
suggests a past "lake mountain view" query, not just exact substring matches.
Suggestions are shown via an NG-ZORRO autocomplete dropdown on the search
input.

## Polygon editor

### Domain model

Following the assignment's own example shape
(`{ id, points, rotation, position, imageId }`), each `Polygon` is stored as
**local-space points + a world-space transform**. An image can now hold
_multiple_ polygons: `id` is the polygon's own identity (an opaque token from
`polygon-id.token.ts`, no longer `=== imageId`), and `imageId` is only the
grouping key used to look up "the polygons for this image". The NgRx entity
adapter is keyed by `polygon.id`; `selectedPolygonId: string | null` in
`ImageEditorState` tracks which one is currently active.

```ts
interface NormalizedPoint {
  readonly x: number; // 0..1 of the original image's width
  readonly y: number; // 0..1 of the original image's height
}

interface Polygon {
  readonly id: string; // real identity, unique per polygon
  readonly imageId: string; // grouping key — which image this polygon belongs to
  readonly points: readonly NormalizedPoint[]; // vertices in LOCAL space, centroid at (0,0)
  readonly position: NormalizedPoint; // world-space centroid
  readonly rotationRadians: number; // rotation around that same centroid
  readonly scale: number; // uniform scale factor, default 1
}
```

Rotating around the center is a single field update (`rotationRadians` — the
center _is_ `position`, so there's no separate centroid recomputation).
Dragging is a single field update to `position`. Scaling is a single field
update to `scale`, clamped to `[MIN_POLYGON_SCALE, MAX_POLYGON_SCALE]` = `[0.1,
5]` (`domain/geometry/clamp-polygon-scale.ts`). Repeated edits don't
accumulate floating-point drift the way mutating absolute vertex coordinates
repeatedly would. One function composes the renderable/hit-testable shape:

`getWorldPoints(polygon, aspectRatio) = polygon.points.map(p =>
addPoints(rotatePointAspectCorrected(p × polygon.scale, polygon.rotationRadians, aspectRatio), polygon.position))`

— i.e. `world(p) = rotateAspectCorrected(p × scale, θ, AR) + position`: scale
first (around the local-space origin), then the aspect-corrected rotation,
then translate by `position`.

The aspect correction is what keeps rotation rigid. Substituting `px = x·W`,
`py = y·H` and `aspectRatio = W/H` into `rotatePointAspectCorrected` reduces it
to `px' = px·cos − py·sin`, `py' = px·sin + py·cos` — an exact rotation in pixel
space. Without it, rotating a shape stored in normalized coordinates would shear
it on any non-square image.

### Coordinate systems

Two coordinate systems stay explicit and are never mixed silently:

- **Normalized image space** (0..1) — what's stored in NgRx, resolution-independent.
- **Canvas pixel space** — normalized × the currently rendered `<img>` box
  size. Conversion happens only in `domain/geometry/to-pixel-point.ts` and
  `to-normalized-point.ts`, and their call sites in `rendering/`/`interaction/`.

The canvas is a transparent overlay absolutely positioned over the `<img>`,
resized via `ResizeObserver` (not `window.resize`, which misses
container-driven resizes like a dialog reflow) — so the polygon keeps its
proportions relative to the image at any viewport size. The image renders as
a native `<img>`; the canvas only draws the polygon and its rotate handle.

### Interaction

- **Drawing** — an explicit "Draw polygon" button (disabled until the image
  finishes loading) enters draw mode; there's no implicit "empty canvas"
  trigger, since an image can already have other polygons on it. In draw
  mode, clicks append vertices (live preview polyline), committed (minimum 3
  points) via double-click, clicking near the first vertex, or the "Finish
  polygon" button.
- **Multiple polygons per image** — Previous/Next buttons cycle
  `selectedPolygonId` through the polygons for the current image, and a
  Delete-polygon button removes the selected one. In idle mode, pointer
  hit-testing checks scale handles first, then the rotation handle, then the
  topmost polygon body — so handles on a small selected polygon still win
  over a larger polygon underneath it.
- **Drag / rotate / scale** — pointer-drag on the polygon body moves it;
  pointer-drag on its rotate handle rotates it around the center;
  pointer-drag on a corner scale handle changes its `scale`. The in-progress
  shape lives in a local component signal during an active gesture — it is
  _not_ dispatched to the store on every `pointermove`; only `pointerup`
  commits the final `Polygon` via the facade. Rotation and scale handle
  positions are computed in **pixel space** (`get-handle-points.ts`) and
  clamped inside the canvas box — computing them in normalized space could
  place the rotation handle off-canvas for a polygon near the top edge.
- **Keyboard** — once a polygon is selected, the canvas is focusable and
  keyboard-operable: arrow keys nudge `position` by a fixed normalized step,
  `+`/`-` scale it, `[`/`]` rotate by 15°, `Delete` removes it, `Escape`
  deselects. A visually-hidden `aria-live="polite"` region announces the
  result of each action (e.g. "Polygon rotated 15° clockwise."). Free-hand
  vertex placement itself has no keyboard equivalent (see Limitations).
- **Restore on reopen** — reopening the dialog for an image with saved
  polygons renders them immediately from the store; no redraw is needed.
  `selectedPolygonId` lives in root NgRx state rather than the dialog
  component, so selection survives closing and reopening the _same_ image's
  dialog. It's a single global field rather than per-image, though: opening
  a different image's dialog in between will clear it, so the previous
  selection is only restored if no other image's dialog was visited first.
- **Focus** — opening the dialog captures `document.activeElement`; closing
  it (via NG-ZORRO's modal, which traps focus while open) restores focus to
  that element.

**Rotation pivot — vertex mean, not area centroid.** `computeCentroid` returns the arithmetic
mean of the vertices. Both it and the area centroid are legitimate "centers" for the assignment's
"rotate the polygon around its center", and the vertex mean is preferred here because it is
O(n) with no signed-area special cases and stays well-defined for the self-intersecting polygons
that free-hand drawing can produce — the area centroid divides by a signed area that is zero for
degenerate shapes a user can genuinely draw. `compute-centroid.spec.ts` asserts this definition
explicitly so a future change is deliberate.

## Persistence

Session-only, in-memory NgRx state — no `localStorage`/IndexedDB sync layer.
Search history and drawn polygons persist across dialog opens/closes and
navigation within a session, but reset on a full page reload.

## Development process

This project was built with AI-assisted development under written, reviewed plans. The plans
live in `docs/superpowers/plans/` and the reusable engineering guidance in `.ai/skills/`; both
are gitignored, so a clone contains only the application. Every architectural decision recorded
in this README — the coordinate model, the cancellation strategy, the pagination guards, the
ARIA combobox rewrite — was reviewed and is defended on its merits, not adopted by default.

## Known limitations / trade-offs

- No `localStorage` persistence — history and polygons reset on page reload
  (explicit scope decision).
- Free-hand polygon drawing has no full keyboard-only equivalent; editing an
  already-drawn polygon (move/rotate/delete) does.
- Openverse's anonymous rate limit is not published as a hard number; the
  HTTP error interceptor retries `429`/`5xx` responses with exponential
  backoff before normalizing a still-failing request into the existing
  error-state UI.
- Query history is capped at 50 entries; recording a 51st evicts the
  least-recently-used entry.

## SEO & accessibility

Single-route client app. Decisions and reasoning:

- **Metadata is static**, in `src/index.html` (title, description, robots,
  canonical, Open Graph, Twitter card, one `WebApplication` JSON-LD block) —
  no `Meta`/`Title` service was introduced, since nothing here varies
  per-view. That would become justified if the app grew real per-route
  content.
- `https://image-search.example.com/` in `index.html` is a
  placeholder (RFC 2606 `.example` domain) for canonical/OG/sitemap URLs —
  replace it with the real deployed origin before shipping.
- **Prerendered** (`ng add @angular/ssr`, `RenderMode.Prerender` for `/`,
  `outputMode: "static"`) so crawlers see real HTML instead of an empty
  `<app-root>`. Deploys as plain static files — no Node server required.
  This only prerenders the idle shell; search results are per-user,
  client-only NgRx state and were never going to be indexable regardless of
  rendering strategy.
- `public/robots.txt` / `public/sitemap.xml` cover the app's one real URL.
- Two targeted accessibility gaps were closed: an accessible name for the
  polygon canvas while drawing (previously only present once a polygon
  existed), and `aria-modal`/`aria-labelledby` wiring on the image preview
  dialog. Everything else audited (alt text, focus trap, keyboard support,
  live regions, labeled input) was already correct and was left untouched.

## Performance & bundle

`ng-zorro-antd/modal/style/index.min.css` stays in the eager `angular.json`
`styles` array even though `ImagePreviewDialog` is dynamically imported. Ant
Design's modal styles are global and cannot be scoped to a component without
`ViewEncapsulation.None`, which would push the stylesheet past the 8 kB
`anyComponentStyle` production budget. Raising that budget to hide the
problem is not an option, so the eager load is a deliberate trade-off:
roughly one stylesheet's worth of initial CSS in exchange for a correct,
budget-clean build.

The initial-bundle budget is `900kB` (raw), not the framework default of
`500kB`. The measured floor after deduplicating `@angular/cdk`, removing
`lodash`, and replacing `nz-autocomplete` with a first-party suggestions
combobox is `797.39kB` raw (down from `868.01kB` before that combobox
rewrite) — mostly eagerly-loaded NG-ZORRO modules and Angular CDK.
Two honest trims were tried and both failed: removing the eager
`NzModalModule` provider import breaks `NzModalService` injection
(`NG0201`), and pruning the eager modal stylesheet only saves ~5kB while
leaving the dialog unstyled (see the paragraph above). Raising the budget to
hide a real problem is not acceptable, but a budget that never reflects an
honestly-reduced floor is equally useless as a signal — `900kB` gives
headroom over the measured `797.39kB` so the warning fires only on a genuine
regression, not on the current baseline.

Replacing `nz-autocomplete` with a first-party suggestions combobox (required for a valid
ARIA 1.2 combobox — `nz-auto-option` hard-codes `role="menuitem"`, which a combobox may not own)
also removed `ng-zorro-antd/auto-complete/style/index.min.css` from the eager `styles` array.

The search-results cache key is built as
`` `${toKebabCase(canonicalQuery)}::${encodeURIComponent(canonicalQuery)}::${page}` ``,
where `canonicalQuery` is `toCanonicalQuery(query)` (trim + collapse
whitespace + lowercase) and `toKebabCase` is a small local helper
(`data-access/to-kebab-case.ts`) — see Dependency decisions above for why
that's local instead of a `lodash` import. Canonicalization means `Cats` and
`cats` share one cache entry, but the key isn't collapsed further than that:
the paired `encodeURIComponent(canonicalQuery)` segment keeps
punctuation-distinct queries (e.g. `cat dog` vs `cat-dog`) in separate
entries.

## Testing strategy

64 test files / 394 tests, all passing (`pnpm run test:ci`). Prioritized per
the local (gitignored) `.ai/skills/testing/SKILL.md`:

1. Geometry pure functions — table-driven tests for rotation, translation,
   centroid, bounding box, coordinate normalization, hit-testing. No
   Angular/DOM/Canvas required.
2. Reducers — state transitions (search, query-history, image-editor).
3. Selectors — derived state (e.g. `hasMore`, filtered suggestions).
4. Effects — input action + mocked dependency (HTTP, cache) → resulting
   action, including debounce/cancellation/pagination-guard behavior via
   Vitest fake timers.
5. Domain rules — `normalizeSearchQuery`, `isMeaningfulQuery`, `suggestionsFor`.
6. Critical component interactions — e.g. virtual-scroll near-end trigger
   dispatches next-page, dialog restores a saved polygon, keyboard editing.

There's also a Playwright end-to-end suite across four spec files, sharing
mock setup from `e2e/openverse-mock.ts`: `search-pagination-polygon.spec.ts`
(search → pagination → dialog → polygon draw/drag → reopen/restoration, at
three viewport heights), `polygon-multi-and-scale.spec.ts` (drawing two
polygons on one image, scaling one via keyboard, and restoring both on
reopen), `polygon-resize-ratio.spec.ts` (a rotated, scaled polygon's ink
bounds stay proportional to the canvas box across a viewport resize), and
`search-suggestions.spec.ts` (a past query is suggested and re-run on
selection) — 6 tests total, all passing. Run it with `pnpm run e2e`
(requires `npx playwright install chromium` once, beforehand). It is
deliberately **not** part of `pnpm run check` or the pre-push hook, since it
needs a running dev server and an installed browser rather than just Node.

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

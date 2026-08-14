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
      ui/                     search-page, search-input, search-results-list (CDK virtual scroll),
                               search-result-item, search-empty-state, search-error-state
      search.facade.ts        the only surface UI components talk to
    query-history/
      domain/                 QueryHistoryEntry model, suggestionsFor() word-matching rule
      state/                  actions, entity-adapted reducer, effects, selectors
      query-history.facade.ts
    image-editor/
      domain/geometry/        pure, Angular/Canvas-free: points, rotation, centroid, bounding box,
                               hit-test, coordinate mapping
      state/                  polygon actions/reducer/selectors, entity keyed by imageId
      rendering/               PolygonCanvasRenderer — draws the polygon overlay only
      interaction/             PolygonInteractionController — pointer/keyboard -> geometry translation
      ui/                      image-preview-dialog, polygon-canvas
      image-editor.facade.ts
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
  action via its own effect (only records a query when it's page 1 and
  `resultCount > 0`) — a one-directional dependency on an action _shape_, not
  a facade import.
- `search-page` calls `ImagePreviewDialogService.open(target)` to launch the
  dialog after a result is selected — dialog presentation lives in that
  service, not in `image-editor.facade.ts`. The dialog receives only a plain
  `ImagePreviewTarget` input (`{ imageId, imageUrl, title, width, height }`)
  — it has no knowledge of Openverse, HTTP, or NgRx search state.

## Search & pagination

- Every keystroke updates a local signal (typing never waits on the store)
  and dispatches `[Search Page] Query Typed`. An effect pipes
  `debounceTime → map(normalizeSearchQuery) → distinctUntilChanged`, then maps
  the result to either a `searchRequested` or a `queryCleared` action
  depending on `isMeaningfulQuery`. The HTTP call itself lives in a separate
  `performSearch$` effect that reacts to `searchRequested` via `switchMap`,
  which cancels obsolete in-flight requests when a newer meaningful query
  arrives.
- The CDK virtual-scroll list's near-end trigger dispatches
  `[Search Page] Next Page Requested`. Its effect uses `exhaustMap`
  (not `switchMap`/`concatMap`), guarded by a `withLatestFrom` check against
  the current `page`/`status`, so a second trigger while a page is already
  in flight is dropped.
- Results are `@ngrx/entity`-adapted (`upsertMany`, keyed by Openverse's
  stable `id`), which also makes duplicate IDs across pages self-healing.
- `SearchResultsCache` is an in-memory LRU cache (`Map<"query|page", MappedSearchPage>`,
  capped at 30 entries, 5-minute TTL) consulted inside the effect before
  hitting the network — session-scoped, no `localStorage`/IndexedDB layer;
  see Limitations below.
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
**local-space points + a world-space transform**, one polygon per image
(keyed by `imageId` in the entity store):

```ts
interface NormalizedPoint {
  readonly x: number; // 0..1 of the original image's width
  readonly y: number; // 0..1 of the original image's height
}

interface Polygon {
  readonly id: string; // === imageId
  readonly imageId: string;
  readonly points: readonly NormalizedPoint[]; // vertices in LOCAL space, centroid at (0,0)
  readonly position: NormalizedPoint; // world-space centroid
  readonly rotationRadians: number; // rotation around that same centroid
}
```

Rotating around the center is a single field update (`rotationRadians` — the
center _is_ `position`, so there's no separate centroid recomputation).
Dragging is a single field update to `position`. Repeated edits don't
accumulate floating-point drift the way mutating absolute vertex coordinates
repeatedly would. One function composes the renderable/hit-testable shape:

`getWorldPoints(polygon, aspectRatio) = polygon.points.map(p =>
addPoints(rotatePointAspectCorrected(p, polygon.rotationRadians, aspectRatio), polygon.position))`

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

- **Drawing** — when a dialog opens for an image with no saved polygon, the
  canvas starts in draw mode: clicks append vertices (live preview polyline),
  committed (minimum 3 points) via double-click, clicking near the first
  vertex, or the "Finish polygon" button.
- **Drag / rotate** — pointer-drag on the polygon body moves it; pointer-drag
  on its rotate handle rotates it around the center. The in-progress shape
  lives in a local component signal during an active gesture — it is _not_
  dispatched to the store on every `pointermove`; only `pointerup` commits
  the final `Polygon` via the facade.
- **Keyboard** — once a polygon exists, the canvas is focusable and
  keyboard-operable: arrow keys nudge `position` by a fixed normalized step,
  `[`/`]` rotate by 15°, `Delete`/`Backspace` clears it. A visually-hidden
  `aria-live="polite"` region announces the result of each action (e.g.
  "Polygon rotated 15° clockwise."). Free-hand vertex placement itself has no
  keyboard equivalent (see Limitations).
- **Restore on reopen** — reopening the dialog for an image with a saved
  polygon renders it immediately from the store; no redraw is needed.
- **Focus** — opening the dialog captures `document.activeElement`; closing
  it (via NG-ZORRO's modal, which traps focus while open) restores focus to
  that element.

## Persistence

Session-only, in-memory NgRx state — no `localStorage`/IndexedDB sync layer.
Search history and drawn polygons persist across dialog opens/closes and
navigation within a session, but reset on a full page reload.

## Known limitations / trade-offs

- No `localStorage` persistence — history and polygons reset on page reload
  (explicit scope decision).
- One polygon per image, not multiple — a deliberate, current limitation (the
  assignment consistently says "the polygon" / "a polygon", singular).
- Free-hand polygon drawing has no full keyboard-only equivalent; editing an
  already-drawn polygon (move/rotate/delete) does.
- Openverse's anonymous rate limit is not published as a hard number; the
  HTTP error interceptor retries `429`/`5xx` responses with exponential
  backoff before normalizing a still-failing request into the existing
  error-state UI.
- Query history is capped at 50 entries; recording a 51st evicts the
  least-recently-used entry.

## SEO & accessibility

Single-route client app — see
`docs/superpowers/specs/2026-08-14-seo-a11y-improvements-design.md` for the
full reasoning behind these decisions. Summary:

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

`lodash`'s `kebabCase` is used to build the search-results cache key, added at
explicit user request.

## Testing strategy

Prioritized per the local (gitignored) `.ai/skills/testing/SKILL.md`:

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

There's also a Playwright end-to-end suite
(`e2e/search-pagination-polygon.spec.ts`) covering the full flow — search →
pagination → dialog → polygon draw/drag → reopen/restoration — at three
viewport heights. Run it with `pnpm run e2e` (requires `npx playwright
install chromium` once, beforehand). It is deliberately **not** part of
`pnpm run check` or the pre-push hook, since it needs a running dev server
and an installed browser rather than just Node.

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

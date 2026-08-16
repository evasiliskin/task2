# Image Search & Polygon Annotator

An Angular single-page app for searching openly-licensed images on
[Openverse](https://openverse.org) and annotating any result with polygons drawn on a canvas
overlay.

What a user can do:

- Type in the search field — results load without a search button and keep loading as the list
  is scrolled.
- Re-run an earlier search: the field suggests past queries that actually returned results.
- Open any result in a dialog showing the full-size image.
- Draw one or more polygons over that image and drag, rotate, scale or delete them with the
  pointer or the keyboard. Polygons and query history live in the store for the session, so they
  survive closing and reopening the dialog — but not a page reload.

## Demo

The following video demonstrates the implemented functionality and the main user flows.

[Watch the demo](./docs/demo.mp4)

## Stack

| Area      | Choice                                                               |
| --------- | -------------------------------------------------------------------- |
| Framework | Angular 22, standalone APIs only (no NgModules of our own)           |
| Language  | TypeScript 6, `strict` + `noPropertyAccessFromIndexSignature` et al. |
| State     | NgRx Store / Effects / Entity / Store DevTools `22.0.0-rc.0`         |
| Async     | RxJS 7 + Angular signals (`toSignal`, `linkedSignal`)                |
| UI kit    | NG-ZORRO (Ant Design) 22, Angular CDK 22 (virtual scroll, a11y)      |
| Rendering | Native `<canvas>` 2D context, no drawing library                     |
| Tests     | Vitest via `@angular/build:unit-test` (jsdom), Playwright for e2e    |
| Tooling   | pnpm, Angular ESLint (flat config), Prettier, Husky                  |

NgRx is pinned to `22.0.0-rc.0` because no stable NgRx 22 exists yet. `@angular/cdk` is forced
to `22.1.2` by a pnpm override in `pnpm-workspace.yaml` — `ng-zorro-antd@22.0.1` asks for a
different patch, and without the override two CDK copies reach the bundle.

**API:** the anonymous [Openverse image API](https://api.openverse.org/v1/images/) — no key,
CORS-enabled, real `page`/`page_size` pagination with `result_count`/`page_count` in the
response.

## Prerequisites

- Node — `.nvmrc` pins `26.5.0`; `package.json` `engines` accepts
  `^22.22.3 || ^24.15.0 || >=26.0.0`.
- pnpm `11.21.0` (declared as `packageManager`; the Angular CLI is configured for pnpm).

## Install and run

```bash
pnpm install
```

```bash
pnpm start
```

Serves at `http://localhost:4200`.

```bash
pnpm run build
```

Production build with prerendering. Output is plain static files in `dist/frontend-screening/`
— no Node server needed. There is no Docker or CI configuration in the repository.

## Configuration

There are no `.env` files and no `environments/` directory; nothing about the app is build-time
configurable. The one piece of runtime configuration is the Openverse base URL, supplied by the
`OPENVERSE_API_CONFIG` injection token
([openverse-api.config.ts](src/app/core/api/openverse/openverse-api.config.ts), default
`https://api.openverse.org/v1`); override it by providing the token. `SEARCH_RESULTS_PAGE_SIZE`
(20) lives next to it.

`https://image-search.example.com/` in [index.html](src/index.html), `public/robots.txt` and
`public/sitemap.xml` is a placeholder origin — replace it with the real one before deploying.

## Testing and quality gate

```bash
pnpm run check
```

Runs `lint` → `format:check` → `test:ci` → `build`, and is what the Husky `pre-push` hook
executes. Individually: `pnpm run lint`, `pnpm run format`, `pnpm run test:ci` (single run),
`pnpm test` (watch).

Unit tests are colocated as `*.spec.ts` next to the code they cover and run in jsdom. Weight
sits on pure geometry/query functions, reducers, selectors and effects (fake timers for
debounce, cancellation and pagination), plus targeted component tests. Two `*.integration.spec.ts`
files wire a real store, reducer and effects together.
[feature-boundaries.spec.ts](src/app/features/feature-boundaries.spec.ts) is a structural test:
it fails the suite if one feature imports another.

```bash
pnpm run e2e
```

Playwright drives the dev server against a mocked Openverse endpoint
([openverse-mock.ts](e2e/openverse-mock.ts)) and covers search → pagination → dialog → polygon
draw/drag → reopen (at three viewport heights), multi-polygon drawing and scaling, proportional
resize of a rotated polygon, and suggestion re-run, plus three `*.mobile.spec.ts` specs on a
phone viewport. It needs a browser (`npx playwright install chromium`, once) and a dev server,
so it is deliberately **not** part of `pnpm run check`.

## Architecture

Feature-oriented, standalone-component app with a single route (`''` → `SearchShell`).

```
src/app/
  core/          app-wide infrastructure with no feature knowledge
    api/openverse/   Openverse base URL + page size (injection token)
    http/            error-normalizing interceptor + HttpFailure/timeout models
    time/            CLOCK token (injectable Date.now, keeps tests deterministic)
  shared/
    search-query/    query normalization / canonicalization / meaningfulness rules
  features/
    search/          typeahead search, pagination, results UI
    query-history/   recorded queries + suggestion matching
    image-editor/    polygon domain, canvas rendering, interaction, preview dialog
  shell/           composition layer: SearchShell page + cross-feature effect
```

Each feature is layered the same way — `domain/` (pure, framework-free rules and models),
`data-access/` (HTTP, mapping, cache — search only), `state/` (actions, `createFeature` reducer,
effects), `ui/` (presentational components), and one facade at the root which is the only thing
code outside the feature touches. Every feature exposes a barrel (`index.ts`) reached through a
path alias: `@search`, `@query-history`, `@image-editor`, plus `@core/*` and `@shared/*`.

**Features never import each other.** This is enforced twice: a `no-restricted-imports` rule in
[eslint.config.mjs](eslint.config.mjs) and the boundary spec above. Anything that needs two
features is composed in `shell/`:

- `QueryHistoryRecordingEffects` listens for search's `[Search API] Load Results Success` and
  dispatches `[Query History] Query Recorded`. The dependency is on an action shape, one way, and
  lives outside both features.
- `SearchShell` calls `ImagePreviewDialogService.open()` with a plain `ImagePreviewTarget`
  (`{ imageId, imageUrl, title, width, height }`). The image editor knows nothing about
  Openverse, HTTP or search state.

## State management

Three root feature slices, all registered eagerly in [app.config.ts](src/app/app.config.ts) and
all in memory only.

| Slice          | `@ngrx/entity` adapter keyed by | Also holds                                            |
| -------------- | ------------------------------- | ----------------------------------------------------- |
| `search`       | Openverse result `id`           | `activeQuery`, `status`, `error`, `page`, `pageCount` |
| `queryHistory` | `canonicalQuery`                | —                                                     |
| `imageEditor`  | `polygon.id`                    | `selectedPolygonId`                                   |

- Server data lives in the store; transient UI state does not. Draw mode, the in-progress vertex
  list, the in-flight gesture draft and the last visible scroll range are component signals.
- `status` is a single union (`idle | loading | loadingMore | success | error | loadingMoreError`)
  rather than a set of booleans, so impossible combinations cannot be represented.
- Components read one memoized view-model selector (`selectSearchViewModel`) as a signal through
  the facade, instead of subscribing to several selectors.
- Late responses are dropped in the reducer: success/failure are ignored when their `query` no
  longer matches `activeQuery`.
- Query history is capped at 50 entries (least-recently-used evicted); polygons are capped at 200
  (oldest `createdAt` evicted, and the UI warns before it happens).

## Search flow

```
keystroke → SearchInput (signal) → SearchShell → SearchFacade
  → debounce 300ms ─┐
                    ├→ normalize → distinctUntilChanged(canonical) → isMeaningfulQuery?
  suggestion pick ──┘        ├─ yes → searchRequested → effect → SearchRepository → cache | HTTP
                             └─ no  → queryCleared (clears results, no request)
  → entity setAll/upsertMany → selectSearchViewModel → virtual-scrolled list
```

- **Keystrokes never reach the store.** The debounced pipeline lives in `SearchFacade` for the
  app's lifetime; DevTools shows one action per settled query.
- **Picking a suggestion bypasses the debounce** — a separate subject merged into the same
  pipeline — so a chosen query dispatches immediately.
- **Normalization** trims and collapses whitespace; **canonicalization** additionally lowercases
  and is what `distinctUntilChanged`, the cache key and history identity use, so `Cats` and `cats`
  are one query. A query is _meaningful_ at ≥ 2 characters, or 1 character if it is non-ASCII (a
  single CJK character is a real query).
- **Cancellation:** the query effect uses `switchMap`, so a newer query aborts the in-flight
  request.
- **Pagination** is a separate action path: the CDK virtual-scroll viewport reports its visible
  range, `shouldLoadNextPage()` decides (8 rows of look-ahead), and the effect uses `exhaustMap`
  behind a `status`/`page` guard, so a second trigger during an in-flight page is dropped rather
  than queued. It is cancelled if the query changes mid-flight. Page 1 replaces the collection
  (`setAll`); later pages `upsertMany`, which makes duplicate ids across pages self-healing.
- **Caching:** `SearchResultsCache` is an in-memory LRU keyed by
  `` `${encodeURIComponent(canonicalQuery)}::${page}` ``, 30 entries, 5-minute TTL, consulted by
  `SearchRepository` before the network. Session-scoped; failures are never cached.
- **Errors:** the HTTP interceptor times out at 15 s, retries idempotent (`GET`/`HEAD`) requests
  on `0`/`429`/`5xx` twice with exponential backoff, then wraps the failure in a typed
  `HttpFailure`. The effect maps it to a `SearchErrorKind`, the UI turns that into a message plus
  a retry action, and retry resumes whichever failed — the query or the next page.
- **History** is recorded by the shell effect only when page 1 came back with at least one
  _renderable_ result, so a page of malformed entries does not pollute suggestions.
  `suggestionsFor()` matches word-prefix-wise in both directions: typing `mountain lake` suggests
  a past `lake mountain view`.

## Image preview and polygon editor

`SearchShell` → `ImagePreviewDialogService` (lazy `import()` of the dialog component, NG-ZORRO
modal, restores focus to the trigger on close) → `ImagePreviewDialog` → `PolygonCanvas`. The
image is a native `<img>`; the canvas is a transparent overlay positioned over it that draws only
the polygons and their handles.

### Coordinate model — the central invariant

```ts
interface Polygon {
  id: string; // own identity (opaque token, not the image id)
  imageId: string; // grouping key: which image it belongs to
  points: readonly NormalizedPoint[]; // vertices in LOCAL space, centroid at (0,0)
  position: NormalizedPoint; // world-space centroid, 0..1 of the image box
  rotationRadians: number; // rotation about that centroid
  scale: number; // uniform, clamped to [0.1, 5]
  createdAt: number; // for deterministic capacity eviction
}
```

Two coordinate systems, never mixed silently:

- **Normalized image space** (`0..1`) — everything stored in NgRx. Resolution-independent, so a
  polygon keeps its proportions when the image box resizes.
- **Canvas pixel space** — normalized × the currently rendered `<img>` box size, tracked with a
  `ResizeObserver` (not `window.resize`, which misses dialog reflow). Conversion happens only in
  `to-pixel-point.ts` / `to-normalized-point.ts`.

Storing local points plus a transform makes drag, rotate and scale each a single-field update, so
repeated edits accumulate no floating-point drift. The renderable and hit-testable shape is
composed by one function:

```
world(p) = rotateAspectCorrected(p × scale, θ, aspectRatio) + position
```

The aspect correction is what keeps rotation rigid: normalized axes scale independently, so a
plain rotation matrix would shear the polygon on any non-square image. Handle positions
(`get-handle-points.ts`) are the deliberate exception — they are computed in **pixel space** and
clamped into the canvas box, because a fixed 28 px offset only means anything in pixels and a
normalized-space handle would fall off-canvas near an edge.

The rotation pivot is the **arithmetic mean of the vertices**, not the area centroid: it is O(n),
has no signed-area special cases, and stays defined for the self-intersecting shapes free-hand
drawing can produce. `compute-centroid.spec.ts` asserts this, so changing it is deliberate.

### Interaction

- Drawing starts from an explicit "Draw polygon" button (disabled until the image loads — an
  image can already carry polygons, so an "empty canvas" trigger would be ambiguous). Clicks
  append vertices; the shape commits (min. 3 points) on double-click, on clicking near the first
  vertex, or via "Finish polygon".
- Several polygons per image: Previous/Next cycle `selectedPolygonId`, Delete removes.
  Hit-testing order is scale handles → rotation handle → topmost body, so handles on a small
  selected polygon still beat a larger polygon underneath.
- During a pointer gesture the draft polygon lives in a **component signal** — nothing is
  dispatched on `pointermove`; only `pointerup` commits through the facade. Teardown also listens
  for `pointercancel`, `lostpointercapture` and window `blur`, so a lost pointer cannot strand the
  canvas mid-gesture.
- Keyboard: with a polygon selected the focused canvas accepts arrows (nudge), `[`/`]` (rotate
  15°), `+`/`-` (scale), `Delete`/`Backspace` (remove) and `Escape` (deselect); each action is
  announced through the CDK live announcer. Free-hand vertex placement has no keyboard equivalent.
- Rendering is coalesced to one paint per animation frame by `CanvasRenderScheduler`, which also
  owns device-pixel-ratio backing-store sizing.

## Trade-offs and limitations

- **No persistence layer.** History and polygons are in-memory NgRx state and reset on reload.
- **Prerendered shell only.** `RenderMode.Prerender` on `/` with `outputMode: "static"` gives
  crawlers real HTML; search results are per-user client state and were never indexable. Metadata
  is static in `index.html` — no `Meta`/`Title` service, since nothing varies per view.
- **Eager modal CSS.** `ng-zorro-antd/modal/style/index.min.css` stays in the eager `styles` array
  although the dialog is lazily imported: Ant Design modal styles are global, and scoping them to
  the component would need `ViewEncapsulation.None` and blow the 8 kB `anyComponentStyle` budget.
- **Bundle budget is 900 kB, not the default 500 kB.** The current production build measures
  ~798 kB raw / ~191 kB transferred initial, mostly eager NG-ZORRO and CDK; the budget is set to
  warn on a real regression rather than on the existing baseline.
- The suggestion list is a first-party ARIA combobox rather than `nz-autocomplete`, whose
  `nz-auto-option` hard-codes `role="menuitem"` — not valid inside an ARIA 1.2 combobox.
- Openverse's anonymous rate limit is not published as a number; `429` is retried with backoff and
  then surfaced as a user-facing error.
- `selectedPolygonId` is a single global field, so opening a different image's dialog clears the
  previous selection.

See [AGENTS.md](AGENTS.md) for the conventions that apply when changing this repository.

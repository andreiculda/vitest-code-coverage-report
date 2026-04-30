# vitest-code-coverage-report

## 1.2.7

### Patch Changes

- Add a dedicated VitePress documentation site under `docs/` with a custom logo, hero illustration, landing page, getting-started, CLI reference, configuration, features and changelog pages.
- Add Vercel deployment config (`vercel.json`, `.vercelignore`) and a hosting guide so the docs site can be deployed with zero extra setup.
- Update package `homepage` to point to the new documentation site.

## 1.2.6

### Patch Changes

- Improve source-viewer Istanbul parity by refining inline coverage overlays for Vue template branches, IF/ELSE path markers, and branch-token range anchoring.
- Add explicit "Function not covered" rendering with tighter function range extraction and better distinction from statement-level row highlighting.
- Fix multiple edge cases in highlighted span mapping (quoted literals, binding expressions with nested quotes, and multi-candidate function expressions) for more consistent cross-file behavior.

## 1.2.3

### Patch Changes

- Add a richer insights workflow with a collapsible left insights panel, new file-level analytics cards (coverage risk, quick wins, flaky zone candidates), and hover previews that show per-file coverage donuts.
- Improve dashboard ergonomics with right-side settings drawer (theme, thresholds, keyboard shortcuts), persistent insights panel visibility, and cleaner top-bar actions.
- Enhance navigation by making insights entries open the related file coverage view directly while keeping folder context synced.

## 1.2.0

### Minor Changes

- **Breaking behavior (CLI):** `code-coverage-report` no longer runs Vitest by default. It only starts the viewer and reads existing coverage JSON. Use `--run-vitest` to run `vitest run --coverage` once first, or `--watch` for watch mode. `--no-vitest` remains valid and is now the default.

## 1.1.1

### Patch Changes

- Try port 5179 by default; if in use, bind to the next free port and log the chosen port. Add `publish:npm` script for local npm publish.

## 1.1.0

### Minor Changes

- Run Vitest coverage automatically when starting the CLI and allow forwarding optional test file/filter arguments with `-- <args...>`.

  Add `--no-vitest` to start only the viewer server, while keeping `--watch` support for continuous coverage updates.

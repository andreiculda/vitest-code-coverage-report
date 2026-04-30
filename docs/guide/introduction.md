# What is `vitest-code-coverage-report`?

`vitest-code-coverage-report` is a **modern, self-hosted viewer** for the
JSON coverage output produced by [Vitest](https://vitest.dev),
[Istanbul](https://istanbul.js.org/) or V8.

Instead of digging through static HTML reports or paying for a cloud service,
you can spin up a polished local dashboard with one command and explore your
coverage with donuts, folder trees, file lists and a fully-featured source
viewer.

## Why?

The default `html` reporter is functional but dated. CI dashboards are great
for trends but slow to navigate during a TDD loop. This package fills the
gap with:

- **Speed** — runs as a tiny local Node server and a Vite-built SPA
- **Clarity** — Istanbul-parity per-line and per-branch overlays
- **Focus** — insights surface files that need attention first
- **Privacy** — your coverage data never leaves your machine

## What you get

- Summary donuts for statements / branches / functions / lines
- Collapsible folder tree with aggregated metrics
- Sortable file list with filters
- Source drill-down with per-line hit/miss counts and branch markers
- Insights panel: coverage risk, quick wins, flaky-zone candidates
- Dark / light theme, persistent settings, keyboard shortcuts

## How it works

1. Vitest (or any Istanbul/V8 instrumented runner) emits
   `coverage/coverage-final.json`.
2. `code-coverage-report` starts a local server that reads that JSON and
   serves the UI on `http://127.0.0.1:5179`.
3. The UI lazy-loads source files from disk so per-line overlays match your
   real source.

> Coverage data never leaves your machine — everything runs locally.

Ready to try it? Head to [Getting Started](./getting-started).

# Features

A tour of what the viewer puts at your fingertips.

## Summary donuts

The dashboard opens with four animated donuts — **statements**, **branches**,
**functions**, **lines** — each color-coded against your configurable
thresholds so problem areas pop visually.

## Folder tree with aggregated metrics

A collapsible folder tree on the left shows every directory in your project
along with **aggregated coverage metrics**, so you can see how a package or
feature is doing without expanding every file.

## Sortable, filterable file list

The file list lets you sort by any metric, filter by name and instantly
zero in on the lowest-covered or largest files.

## Source drill-down

Click any file to open a syntax-highlighted source viewer with:

- per-line **hit counts** and **miss markers**
- branch markers for `if` / `else` / ternary / logical operators
- explicit **"Function not covered"** rendering for uncovered functions
- Vue template branch overlays with Istanbul parity

## Insights panel

The collapsible left **insights panel** summarizes your repo at a glance:

- **Coverage risk** — files most likely to have undetected regressions
- **Quick wins** — files where small additional tests yield big coverage gains
- **Flaky zone candidates** — areas with inconsistent or partial coverage

Hover any insight entry to preview a per-file donut, click to jump straight
into the source view.

## Settings drawer

A right-side **settings drawer** keeps your preferences persistent:

- Theme (light / dark)
- Custom thresholds for the donuts
- Keyboard shortcuts cheat sheet

## Keyboard friendly

The dashboard is fully keyboard navigable — open files, expand folders,
toggle the insights panel and the settings drawer all without leaving the
keyboard.

## Lightweight & local

Everything runs as a tiny local Node server with a Vite-built SPA. No cloud
upload, no telemetry, no account — your coverage data stays on your machine.

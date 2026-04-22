# Vitest Code Coverage Report

Modern self-hosted coverage viewer for Vitest/Istanbul JSON output
(`coverage/coverage-final.json`).

It provides:

- summary donuts for statements/branches/functions/lines
- collapsible folder tree with aggregated metrics
- sortable file list
- source drill-down with per-line hit/miss counts
- dark/light theme and keyboard shortcuts

## Install

```bash
npm i -D vitest-code-coverage-report
```

## Use in any Vitest project

1. Make sure Vitest emits JSON coverage:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        coverage: {
            reporter: ['json', 'html'],
        },
    },
})
```

2. Generate coverage:

```bash
npx vitest --coverage
```

3. Start the viewer:

```bash
npx code-coverage-report
```

The viewer runs at `http://127.0.0.1:5179`.

## CLI options

```bash
code-coverage-report --root ./my-app --port 5180 --no-open
```

- `--root, -r <path>`: target project root (default: current directory)
- `--coverage-file, -c <path>`: explicit coverage JSON path
- `--port, -p <number>`: server port (default: `5179`)
- `--watch, -w`: also run `vitest run --watch --coverage --coverage.reporter=json`
- `--open` / `--no-open`: control browser auto-open
- `-- <args...>`: pass filters/options through to Vitest when `--watch` is enabled
- `--help, -h`: print usage help

### Watch mode examples

Run viewer + Vitest watch together:

```bash
npx code-coverage-report --watch
```

Filter to one spec while still watching dependency changes:

```bash
npx code-coverage-report --watch -- App.spec.ts
```

## NPM script example

```json
{
    "scripts": {
        "coverage:report": "code-coverage-report --watch"
    }
}
```

Then run:

```bash
npm run coverage:report -- App.spec.ts
```

## Development

```bash
npm install
npm run build
npm run start
```

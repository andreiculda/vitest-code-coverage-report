# Configuration

`vitest-code-coverage-report` is designed to work with **zero config**, but a
few environment variables and CLI flags let you adapt it to monorepos and
custom setups.

## Vitest side

The viewer reads `coverage/coverage-final.json`. Make sure Vitest emits it
with the `json` reporter:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8', // or 'istanbul'
            reporter: ['json', 'html'], // 'json' is required
            include: ['src/**'],
        },
    },
})
```

Both `v8` and `istanbul` providers are supported — they emit the same
`coverage-final.json` schema the viewer consumes.

## Viewer side

### CLI flags

The most common knobs are CLI flags. See the full list in
[CLI Reference](./cli):

```bash
code-coverage-report --root ./apps/web --port 5180 --no-open
```

### Environment variables (development)

When developing the viewer itself (or pinning it to a different project's
coverage during local hacking), you can use a `.env.local` file:

```bash
# .env.local
COVERAGE_ROOT="D:/projects/my-vite-app"
COVERAGE_FILE="D:/projects/my-vite-app/coverage/coverage-final.json"
VITE_APP_ROOT_FOLDER="src"
```

| Variable               | Purpose                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `COVERAGE_ROOT`        | Project root the dev server uses to resolve sources.                                             |
| `COVERAGE_FILE`        | Absolute path to the coverage JSON file to serve during dev.                                     |
| `VITE_APP_ROOT_FOLDER` | Initial folder the viewer opens to when no `?folder=...` is present in the URL (e.g. `src`).     |

### Initial folder via URL

The viewer respects a `?folder=...` query parameter — handy for bookmarks or
tooling that wants to deep-link to a specific subtree:

```
http://127.0.0.1:5179/?folder=src/components
```

## Monorepo tips

For monorepos, run the viewer once per package by passing `--root`:

```bash
code-coverage-report --root packages/web
code-coverage-report --root packages/api --port 5180
```

Or run all your tests at the repo root with a merged report and let the
viewer load the aggregated JSON:

```bash
code-coverage-report --coverage-file coverage/merged/coverage-final.json
```

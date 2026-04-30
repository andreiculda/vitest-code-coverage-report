# Getting Started

This guide walks you through installing the viewer and opening your first
coverage report in under a minute.

## Prerequisites

- **Node.js** 18.18+ (or 20+ recommended)
- A project that runs **Vitest** (or any Istanbul/V8 instrumented test runner)

## Install

```bash
npm i -D vitest-code-coverage-report
```

::: tip
You can also install globally (`npm i -g vitest-code-coverage-report`) and use
`code-coverage-report` from any project, but a dev dependency is recommended
so the version is pinned per project.
:::

## Configure Vitest to emit JSON coverage

The viewer reads `coverage/coverage-final.json`. Make sure Vitest emits it:

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

Then run tests with coverage at least once:

```bash
npx vitest run --coverage
```

## Open the viewer

```bash
npx code-coverage-report
```

The CLI starts a local server on `http://127.0.0.1:5179` and opens it in your
default browser. If port `5179` is busy, the next free port is picked
automatically and logged.

## One-shot: run tests + open viewer

If you'd rather have the CLI run Vitest for you and then open the dashboard:

```bash
npx code-coverage-report --run-vitest
```

For continuous coverage while you code:

```bash
npx code-coverage-report --watch
```

You can also pass through Vitest filters:

```bash
npx code-coverage-report --watch -- App.spec.ts
```

## Add it to your scripts

```json
{
    "scripts": {
        "coverage:report": "code-coverage-report",
        "coverage:run-and-report": "code-coverage-report --run-vitest",
        "coverage:watch-report": "code-coverage-report --watch"
    }
}
```

## Next steps

- See every flag in the [CLI Reference](./cli)
- Customize the viewer in [Configuration](./configuration)
- Learn about the dashboard in [Features](./features)

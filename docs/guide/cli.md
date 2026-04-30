# CLI Reference

The `code-coverage-report` binary boots a local server that serves the
coverage viewer.

## Synopsis

```bash
code-coverage-report [options] [-- <vitest-args...>]
```

## Options

| Flag                       | Default                          | Description                                                                                                |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--root, -r <path>`        | current working directory        | Project root used to discover the coverage file and serve sources from.                                    |
| `--coverage-file, -c <path>` | `<root>/coverage/coverage-final.json` | Explicit path to the Istanbul/V8 JSON coverage report.                                                |
| `--port, -p <number>`      | `5179`                           | First port to try. If busy, the next free port is used and logged.                                         |
| `--watch, -w`              | off                              | Run `vitest run --watch --coverage --coverage.reporter=json` and keep the viewer open.                     |
| `--run-vitest`             | off                              | Run `vitest run --coverage --coverage.reporter=json` once, then start the viewer.                          |
| `--no-vitest`              | **on**                           | Do **not** run Vitest. Just serve the existing coverage JSON. This is the default.                         |
| `--open` / `--no-open`     | `--open`                         | Control whether the browser auto-opens once the server is ready.                                           |
| `-- <args...>`             | —                                | Everything after `--` is forwarded to Vitest (file filters, options, etc.).                                |
| `--help, -h`               | —                                | Print usage help.                                                                                          |

::: warning Behavior change in v1.2.0
Since `1.2.0`, `code-coverage-report` **does not run Vitest by default**.
It only starts the viewer and reads existing coverage JSON. Use
`--run-vitest` to run tests once, or `--watch` to run Vitest in watch mode.
:::

## Examples

### Open the viewer for an existing report

```bash
npx code-coverage-report
```

### Run Vitest once, then open the viewer

```bash
npx code-coverage-report --run-vitest
```

### Watch mode (Vitest + viewer together)

```bash
npx code-coverage-report --watch
```

### Filter to a single spec while watching

```bash
npx code-coverage-report --watch -- App.spec.ts
```

### Point at a different project

```bash
code-coverage-report --root ./apps/web
```

### Use a custom coverage file path

```bash
code-coverage-report --coverage-file ./artifacts/coverage/coverage-final.json
```

### Pin to a specific port and skip auto-open

```bash
code-coverage-report --port 5180 --no-open
```

## How coverage is discovered

By default the CLI uses the current working directory as the project root
and reads `<root>/coverage/coverage-final.json`. Both can be overridden with
`--root` and `--coverage-file`.

The viewer also lazy-loads source files from disk, so per-line and per-branch
overlays match your real source — keep `--root` pointing at the project that
produced the coverage JSON.

# vitest-code-coverage-report

## 1.1.1

### Patch Changes

- Try port 5179 by default; if in use, bind to the next free port and log the chosen port. Add `publish:npm` script for local npm publish.

## 1.1.0

### Minor Changes

- Run Vitest coverage automatically when starting the CLI and allow forwarding optional test file/filter arguments with `-- <args...>`.

  Add `--no-vitest` to start only the viewer server, while keeping `--watch` support for continuous coverage updates.

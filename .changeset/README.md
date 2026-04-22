# Changesets Guide

This project uses Changesets to manage package versioning and npm releases.

## Create a changeset

Run:

```bash
npm run changeset
```

Select the package (`vitest-code-coverage-report`), choose the bump type (`patch`, `minor`, or `major`), and write a short summary.

## Apply version updates

Run:

```bash
npm run version-packages
```

This updates `package.json` version and changelog files based on pending changesets.

## Publish

Run:

```bash
npm run release
```

This builds the package and publishes to npm.

## CI release flow

The workflow at `.github/workflows/release.yml` will open/update a release PR on `main` when changesets exist, then publish automatically after merge.

# Deploying the Docs Site

The documentation site lives in `docs/` and is built with
[VitePress](https://vitepress.dev). It produces a fully static site that can
be hosted anywhere — this guide covers Vercel because it's the configuration
shipped in the repo.

## What's in the box

The repo already contains everything you need to deploy:

- `vercel.json` at the root — tells Vercel how to build and serve the docs
- `.vercelignore` — keeps the deploy upload small
- `npm run docs:build` script — produces the static site under
  `docs/.vitepress/dist`

```json
// vercel.json (excerpt)
{
    "framework": null,
    "buildCommand": "npm run docs:build",
    "installCommand": "npm install",
    "outputDirectory": "docs/.vitepress/dist",
    "cleanUrls": true,
    "trailingSlash": false
}
```

`framework: null` disables Vercel's auto-detection so it doesn't try to
build the Vue SPA in `src/` instead of the docs.

## Deploy from the dashboard (recommended)

1. Push the repo to GitHub / GitLab / Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. On the **Configure Project** screen, leave everything as the defaults —
   `vercel.json` already sets:
    - **Build Command**: `npm run docs:build`
    - **Output Directory**: `docs/.vitepress/dist`
    - **Install Command**: `npm install`
4. Click **Deploy**.

Every push to the default branch triggers a production deploy; every other
push or PR gets its own preview URL.

## Deploy from the CLI

If you prefer the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel

vercel login
vercel link        # link the local repo to a Vercel project
vercel             # preview deploy
vercel --prod      # production deploy
```

The CLI reads the same `vercel.json`, so the build/output settings stay
consistent with dashboard deploys.

## Local production preview

To check exactly what Vercel will serve, build the docs and use VitePress'
preview server:

```bash
npm run docs:build
npm run docs:preview
```

This serves `docs/.vitepress/dist` on `http://localhost:4173`.

## Custom domain

Once the project is deployed:

1. Open the project in the Vercel dashboard.
2. Go to **Settings → Domains**.
3. Add your domain and follow the DNS instructions.

If you use a non-root domain (e.g. `docs.example.com`), no extra changes are
needed. If you ever serve the docs from a subpath like
`example.com/coverage/`, set the matching `base` option in the VitePress
config:

```ts
// docs/.vitepress/config.ts
export default defineConfig({
    base: '/coverage/',
})
```

## How clean URLs work

The site is built with `cleanUrls: true` in both VitePress and `vercel.json`,
so URLs like `/guide/getting-started` are served from
`docs/.vitepress/dist/guide/getting-started.html`. No extra rewrites are
needed.

## Environment & Node version

VitePress 1.x and Vite 7 require **Node 18.18+** (Node 20 LTS recommended).
Vercel's default Node version is current; pin it explicitly via
**Project Settings → General → Node.js Version** if you need a specific one.

No environment variables are required for the docs site — the dashboard
runs entirely client-side.

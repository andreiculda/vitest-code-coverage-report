import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const PROJECT_ROOT = path.resolve(HERE, '..', '..')
const COVERAGE_FILE = path.resolve(PROJECT_ROOT, 'coverage', 'coverage-final.json')

function sendJson(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
}

function isSafePath(absPath: string): boolean {
    const normalized = path.resolve(absPath)
    return normalized.startsWith(PROJECT_ROOT + path.sep) || normalized === PROJECT_ROOT
}


function coverageServerPlugin() {
    return {
        name: 'coverage-viewer-server',
        configureServer(server: { middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void } }) {
            server.middlewares.use('/__cov/data', (_req, res) => {
                if (!fs.existsSync(COVERAGE_FILE)) {
                    return sendJson(res, 404, { error: `coverage-final.json not found at ${COVERAGE_FILE}` })
                }
                const stat = fs.statSync(COVERAGE_FILE)
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.setHeader('Content-Length', String(stat.size))
                res.setHeader('Cache-Control', 'no-cache')
                fs.createReadStream(COVERAGE_FILE).pipe(res)
            })

            server.middlewares.use('/__cov/source', (req, res) => {
                try {
                    const url = new URL(req.url || '', 'http://local')
                    const relParam = url.searchParams.get('path')
                    if (!relParam) return sendJson(res, 400, { error: 'missing path' })

                    let absPath: string
                    if (path.isAbsolute(relParam)) {
                        absPath = path.resolve(relParam)
                    } else {
                        absPath = path.resolve(PROJECT_ROOT, relParam)
                    }

                    if (!isSafePath(absPath)) {
                        return sendJson(res, 403, { error: 'path outside project root' })
                    }
                    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
                        return sendJson(res, 404, { error: 'file not found', path: absPath })
                    }

                    const content = fs.readFileSync(absPath, 'utf-8')
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
                    res.setHeader('Cache-Control', 'no-cache')
                    res.end(content)
                } catch (err) {
                    return sendJson(res, 500, { error: String(err) })
                }
            })

            server.middlewares.use('/__cov/meta', (_req, res) => {
                const coverageExists = fs.existsSync(COVERAGE_FILE)
                const coverageMtimeMs = coverageExists ? fs.statSync(COVERAGE_FILE).mtimeMs : null
                return sendJson(res, 200, {
                    projectRoot: PROJECT_ROOT,
                    coverageFile: COVERAGE_FILE,
                    coverageExists,
                    coverageMtimeMs,
                })
            })
        },
    }
}

export default defineConfig({
    plugins: [vue(), coverageServerPlugin()],
    resolve: {
        alias: {
            '@': path.resolve(HERE, 'src'),
        },
    },
    server: {
        port: 5179,
        strictPort: false,
        open: false,
    },
    build: {
        target: 'es2022',
        outDir: 'dist',
    },
})

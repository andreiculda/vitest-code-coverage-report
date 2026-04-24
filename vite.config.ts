import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const WORKSPACE_ROOT = path.resolve(HERE)

function sendJson(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
}

function isSafePath(absPath: string, projectRoot: string): boolean {
    const normalized = path.resolve(absPath)
    return normalized.startsWith(projectRoot + path.sep) || normalized === projectRoot
}


function coverageServerPlugin(projectRoot: string, coverageFile: string) {
    return {
        name: 'coverage-viewer-server',
        configureServer(server: { middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void } }) {
            server.middlewares.use('/__cov/data', (_req, res) => {
                if (!fs.existsSync(coverageFile)) {
                    return sendJson(res, 404, { error: `coverage-final.json not found at ${coverageFile}` })
                }
                const stat = fs.statSync(coverageFile)
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.setHeader('Content-Length', String(stat.size))
                res.setHeader('Cache-Control', 'no-cache')
                fs.createReadStream(coverageFile).pipe(res)
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
                        absPath = path.resolve(projectRoot, relParam)
                    }

                    if (!isSafePath(absPath, projectRoot)) {
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
                const coverageExists = fs.existsSync(coverageFile)
                const coverageMtimeMs = coverageExists ? fs.statSync(coverageFile).mtimeMs : null
                return sendJson(res, 200, {
                    projectRoot,
                    coverageFile,
                    coverageExists,
                    coverageMtimeMs,
                })
            })
        },
    }
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, HERE, '')
    const coverageRoot = path.resolve(env.COVERAGE_ROOT || process.env.COVERAGE_ROOT || WORKSPACE_ROOT)
    const coverageFile = path.resolve(
        env.COVERAGE_FILE || process.env.COVERAGE_FILE || path.resolve(coverageRoot, 'coverage', 'coverage-final.json'),
    )

    return {
        plugins: [vue(), coverageServerPlugin(coverageRoot, coverageFile)],
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
    }
})

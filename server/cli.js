import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { URL } from 'node:url'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
}

function parseArgs(argv) {
    const options = {
        root: process.cwd(),
        coverageFile: null,
        port: 5179,
        open: true,
        runVitest: true,
        watch: false,
        vitestArgs: [],
    }

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i]
        if (arg === '--') {
            options.vitestArgs = argv.slice(i + 1)
            break
        }
        if (arg === '--help' || arg === '-h') {
            options.help = true
        } else if (arg === '--root' || arg === '-r') {
            options.root = path.resolve(argv[i + 1] || '')
            i += 1
        } else if (arg === '--coverage-file' || arg === '-c') {
            options.coverageFile = path.resolve(argv[i + 1] || '')
            i += 1
        } else if (arg === '--port' || arg === '-p') {
            options.port = Number(argv[i + 1])
            i += 1
        } else if (arg === '--no-open') {
            options.open = false
        } else if (arg === '--open') {
            options.open = true
        } else if (arg === '--no-vitest') {
            options.runVitest = false
        } else if (arg === '--run-vitest') {
            options.runVitest = true
        } else if (arg === '--watch' || arg === '-w') {
            options.watch = true
        }
    }

    return options
}

function printHelp() {
    console.log(`code-coverage-report

Usage:
  code-coverage-report [options]

Options:
  -r, --root <path>             Project root that contains coverage and source files
  -c, --coverage-file <path>    Coverage JSON path (defaults to <root>/coverage/coverage-final.json)
  -p, --port <number>           Port to run server on (default: 5179)
  -w, --watch                   Run Vitest in watch mode with coverage
      --run-vitest              Run Vitest before starting viewer (default)
      --no-vitest               Start viewer without running Vitest
      --open                    Open browser on start (default)
      --no-open                 Do not open browser on start
      -- <args...>              Forward args to Vitest (files, filters, flags)
  -h, --help                    Show help
`)
}

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
}

function toSafeFilePath(base, filePath) {
    const absolute = path.resolve(base, filePath)
    if (absolute === base || absolute.startsWith(base + path.sep)) {
        return absolute
    }
    return null
}

function openBrowser(url) {
    const platform = process.platform
    if (platform === 'win32') {
        spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref()
        return
    }
    if (platform === 'darwin') {
        spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
        return
    }
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
}

function resolveVitestCli(root) {
    return path.resolve(root, 'node_modules', 'vitest', 'vitest.mjs')
}

function stopChild(child) {
    if (child && !child.killed) {
        child.kill('SIGTERM')
    }
}

function createServer({ root, coverageFile, distDir }) {
    return http.createServer((req, res) => {
        const requestUrl = new URL(req.url || '/', 'http://127.0.0.1')
        const pathname = requestUrl.pathname

        if (pathname === '/__cov/meta') {
            const exists = fs.existsSync(coverageFile)
            const coverageMtimeMs = exists ? fs.statSync(coverageFile).mtimeMs : null
            return sendJson(res, 200, {
                projectRoot: root,
                coverageFile,
                coverageExists: exists,
                coverageMtimeMs,
            })
        }

        if (pathname === '/__cov/data') {
            if (!fs.existsSync(coverageFile)) {
                return sendJson(res, 404, { error: `coverage file not found at ${coverageFile}` })
            }
            const stat = fs.statSync(coverageFile)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Content-Length', String(stat.size))
            res.setHeader('Cache-Control', 'no-cache')
            fs.createReadStream(coverageFile).pipe(res)
            return
        }

        if (pathname === '/__cov/source') {
            const sourcePath = requestUrl.searchParams.get('path')
            if (!sourcePath) {
                return sendJson(res, 400, { error: 'missing path query parameter' })
            }
            const resolved = path.isAbsolute(sourcePath)
                ? path.resolve(sourcePath)
                : path.resolve(root, sourcePath)
            const safePath = toSafeFilePath(root, resolved)
            if (!safePath) {
                return sendJson(res, 403, { error: 'path outside project root' })
            }
            if (!fs.existsSync(safePath) || !fs.statSync(safePath).isFile()) {
                return sendJson(res, 404, { error: 'file not found', path: safePath })
            }
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(fs.readFileSync(safePath, 'utf-8'))
            return
        }

        const requestedPath = pathname === '/' ? '/index.html' : pathname
        const safeAssetPath = toSafeFilePath(distDir, requestedPath.slice(1))
        const filePath = safeAssetPath && fs.existsSync(safeAssetPath) && fs.statSync(safeAssetPath).isFile()
            ? safeAssetPath
            : path.resolve(distDir, 'index.html')

        const extension = path.extname(filePath)
        res.statusCode = 200
        res.setHeader('Content-Type', MIME_TYPES[extension] || 'application/octet-stream')
        res.end(fs.readFileSync(filePath))
    })
}

export async function runCli(argv = process.argv.slice(2)) {
    const options = parseArgs(argv)
    if (options.help) {
        printHelp()
        return
    }

    if (!Number.isFinite(options.port) || options.port <= 0) {
        throw new Error(`Invalid --port value: ${String(options.port)}`)
    }

    const root = path.resolve(options.root)
    const coverageFile = options.coverageFile
        ? path.resolve(options.coverageFile)
        : path.resolve(root, 'coverage', 'coverage-final.json')
    const here = path.dirname(fileURLToPath(import.meta.url))
    const distDir = path.resolve(here, '..', 'dist')

    if (!fs.existsSync(distDir)) {
        throw new Error(`Missing dist folder at ${distDir}. Run npm run build before publishing.`)
    }

    let vitestProcess = null
    if (options.runVitest) {
        const vitestCli = resolveVitestCli(root)
        if (!fs.existsSync(vitestCli)) {
            throw new Error(`Vitest CLI not found at ${vitestCli}. Install vitest in the target project first.`)
        }

        const vitestCommand = [
            vitestCli,
            'run',
            ...(options.watch ? ['--watch'] : []),
            '--coverage',
            '--coverage.reporter=json',
            ...options.vitestArgs,
        ]

        if (options.watch) {
            vitestProcess = spawn(process.execPath, vitestCommand, { cwd: root, stdio: 'inherit' })
        } else {
            await new Promise((resolve, reject) => {
                const child = spawn(process.execPath, vitestCommand, { cwd: root, stdio: 'inherit' })
                child.once('error', reject)
                child.once('exit', (code) => {
                    if (code === 0) {
                        resolve()
                        return
                    }
                    reject(new Error(`Vitest run failed with exit code ${String(code)}`))
                })
            })
        }
    }

    const server = createServer({ root, coverageFile, distDir })
    await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(options.port, '127.0.0.1', () => resolve())
    })

    const url = `http://127.0.0.1:${options.port}`
    console.log(`Coverage viewer running at ${url}`)
    console.log(`Project root: ${root}`)
    console.log(`Coverage file: ${coverageFile}`)
    if (!fs.existsSync(coverageFile)) {
        console.log('Coverage file not found yet. Run vitest with --coverage, then refresh.')
    }
    if (options.open) {
        openBrowser(url)
    }

    if (!options.watch) {
        return
    }

    let isShuttingDown = false
    const shutdown = () => {
        if (isShuttingDown) {
            return
        }
        isShuttingDown = true
        stopChild(vitestProcess)
        server.close()
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    if (vitestProcess) {
        vitestProcess.on('exit', shutdown)
    }
}

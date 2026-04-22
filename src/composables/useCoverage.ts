import type {
    CoverageMap,
    FileStats,
    IstanbulFileCoverage,
    MetricTotals,
    TreeNode,
} from '@/types'
import { computed, ref, shallowRef } from 'vue'

const EMPTY_METRIC: MetricTotals = { total: 0, covered: 0, coveragePercentage: 100 }

function pctOf(covered: number, total: number): number {
    if (total === 0) return 100
    return (covered / total) * 100
}

function toMetric(covered: number, total: number): MetricTotals {
    return { covered, total, coveragePercentage: pctOf(covered, total) }
}

function addMetric(a: MetricTotals, b: MetricTotals): MetricTotals {
    const total = a.total + b.total
    const covered = a.covered + b.covered
    return { covered, total, coveragePercentage: pctOf(covered, total) }
}

function computeFileStats(absPath: string, file: IstanbulFileCoverage, projectRoot: string): FileStats {
    const statementIds = Object.keys(file.s)
    const stmtTotal = statementIds.length
    let stmtCovered = 0
    for (const id of statementIds) if ((file.s[id] ?? 0) > 0) stmtCovered++

    const fnIds = Object.keys(file.f)
    const fnTotal = fnIds.length
    let fnCovered = 0
    for (const id of fnIds) if ((file.f[id] ?? 0) > 0) fnCovered++

    let branchTotal = 0
    let branchCovered = 0
    for (const id of Object.keys(file.b)) {
        const arr = file.b[id] ?? []
        for (const hit of arr) {
            branchTotal++
            if (hit > 0) branchCovered++
        }
    }

    const lineHits = new Map<number, number>()
    for (const id of statementIds) {
        const range = file.statementMap[id]
        if (!range) continue
        const ln = range.start.line
        if (!ln) continue
        const prev = lineHits.get(ln)
        const hits = file.s[id] ?? 0
        if (prev === undefined || hits > prev) lineHits.set(ln, hits)
    }
    let linesTotal = 0
    let linesCovered = 0
    for (const hit of lineHits.values()) {
        linesTotal++
        if (hit > 0) linesCovered++
    }

    const uncoveredBranchRangesByLine = new Map<number, Array<{ start: number; end: number }>>()
    const uncoveredBranchMarkersByLine = new Map<number, Array<{ column: number; label: string }>>()
    for (const id of Object.keys(file.b)) {
        const branchHits = file.b[id] ?? []
        const branchMeta = file.branchMap[id]
        if (!branchMeta) continue
        const fallbackLine = branchMeta.line ?? branchMeta.loc?.start.line
        const fallbackColumn = Math.max(0, branchMeta.loc?.start.column ?? 0)
        const locations = branchMeta.locations ?? []
        const maxIndex = Math.min(branchHits.length, locations.length)
        for (let i = 0; i < maxIndex; i++) {
            if ((branchHits[i] ?? 0) > 0) continue
            const loc = locations[i]
            const startLine = loc?.start?.line ?? fallbackLine
            const endLine = loc?.end?.line ?? startLine
            if (!startLine || !endLine) continue

            const startCol = Math.max(0, loc?.start?.column ?? fallbackColumn)
            const endColRaw = loc?.end?.column
            const endCol = Math.max(
                startCol + 1,
                endColRaw == null ? startCol + 1 : endColRaw,
            )

            // Keep markers Istanbul-like: only show uncovered IF / ELSE paths.
            if (branchMeta.type === 'if') {
                const markerLabel = i === 0 ? 'I' : 'E'
                const markerLine = startLine
                const markerColumn = startCol
                const existingMarkers = uncoveredBranchMarkersByLine.get(markerLine) ?? []
                const hasSameLabel = existingMarkers.some((marker) => marker.label === markerLabel)
                if (!hasSameLabel) {
                    existingMarkers.push({ column: markerColumn, label: markerLabel })
                    uncoveredBranchMarkersByLine.set(markerLine, existingMarkers)
                }
            }

            for (let line = startLine; line <= endLine; line++) {
                const rangeStart = line === startLine ? startCol : 0
                const rangeEnd = line === endLine ? endCol : Number.MAX_SAFE_INTEGER
                const current = uncoveredBranchRangesByLine.get(line) ?? []
                current.push({ start: rangeStart, end: rangeEnd })
                uncoveredBranchRangesByLine.set(line, current)
            }
        }
    }

    const normalizedProjectRoot = projectRoot.replace(/\\/g, '/')
    const normalizedAbs = absPath.replace(/\\/g, '/')
    let rel = normalizedAbs
    if (normalizedAbs.toLowerCase().startsWith(normalizedProjectRoot.toLowerCase() + '/')) {
        rel = normalizedAbs.slice(normalizedProjectRoot.length + 1)
    }

    return {
        absPath: normalizedAbs,
        relPath: rel,
        statements: toMetric(stmtCovered, stmtTotal),
        functions: toMetric(fnCovered, fnTotal),
        branches: toMetric(branchCovered, branchTotal),
        lines: toMetric(linesCovered, linesTotal),
        lineHits,
        uncoveredBranchRangesByLine,
        uncoveredBranchMarkersByLine,
    }
}

function buildTree(files: FileStats[]): TreeNode {
    const root: TreeNode = {
        name: '',
        fullPath: '',
        isFile: false,
        children: [],
        stats: null,
        aggregated: {
            statements: { ...EMPTY_METRIC },
            functions: { ...EMPTY_METRIC },
            branches: { ...EMPTY_METRIC },
            lines: { ...EMPTY_METRIC },
        },
    }

    for (const file of files) {
        const parts = file.relPath.split('/').filter(Boolean)
        let cursor = root
        const pathAccum: string[] = []
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            pathAccum.push(part)
            const isLeaf = i === parts.length - 1
            let next = cursor.children.find((c) => c.name === part)
            if (!next) {
                next = {
                    name: part,
                    fullPath: pathAccum.join('/'),
                    isFile: isLeaf,
                    children: [],
                    stats: isLeaf ? file : null,
                    aggregated: {
                        statements: { total: 0, covered: 0, coveragePercentage: 0 },
                        functions: { total: 0, covered: 0, coveragePercentage: 0 },
                        branches: { total: 0, covered: 0, coveragePercentage: 0 },
                        lines: { total: 0, covered: 0, coveragePercentage: 0 },
                    },
                }
                cursor.children.push(next)
            }
            cursor = next
        }
    }

    function aggregate(node: TreeNode): void {
        if (node.isFile && node.stats) {
            node.aggregated = {
                statements: node.stats.statements,
                functions: node.stats.functions,
                branches: node.stats.branches,
                lines: node.stats.lines,
            }
            return
        }
        let stmts: MetricTotals = { total: 0, covered: 0, coveragePercentage: 0 }
        let fns: MetricTotals = { total: 0, covered: 0, coveragePercentage: 0 }
        let brs: MetricTotals = { total: 0, covered: 0, coveragePercentage: 0 }
        let lns: MetricTotals = { total: 0, covered: 0, coveragePercentage: 0 }
        for (const child of node.children) {
            aggregate(child)
            stmts = addMetric(stmts, child.aggregated.statements)
            fns = addMetric(fns, child.aggregated.functions)
            brs = addMetric(brs, child.aggregated.branches)
            lns = addMetric(lns, child.aggregated.lines)
        }
        node.aggregated = { statements: stmts, functions: fns, branches: brs, lines: lns }
    }

    function sort(node: TreeNode): void {
        node.children.sort((a, b) => {
            if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
            return a.name.localeCompare(b.name)
        })
        for (const c of node.children) sort(c)
    }

    aggregate(root)
    sort(root)
    return root
}

export interface UseCoverageReturn {
    loading: ReturnType<typeof ref<boolean>>
    error: ReturnType<typeof ref<string | null>>
    projectRoot: ReturnType<typeof ref<string>>
    files: ReturnType<typeof shallowRef<FileStats[]>>
    tree: ReturnType<typeof shallowRef<TreeNode | null>>
    totals: ReturnType<typeof computed<TreeNode['aggregated']>>
    startAutoRefresh: () => void
    stopAutoRefresh: () => void
    load: () => Promise<void>
}

export function useCoverage() {
    const loading = ref(false)
    const error = ref<string | null>(null)
    const projectRoot = ref<string>('')
    const files = shallowRef<FileStats[]>([])
    const tree = shallowRef<TreeNode | null>(null)
    const lastCoverageMtimeMs = ref<number | null>(null)
    let refreshTimer: number | null = null

    const totals = computed(() => {
        if (!tree.value) {
            return {
                statements: { ...EMPTY_METRIC },
                functions: { ...EMPTY_METRIC },
                branches: { ...EMPTY_METRIC },
                lines: { ...EMPTY_METRIC },
            }
        }
        return tree.value.aggregated
    })

    async function load () {
        loading.value = true
        error.value = null
        try {
            const metaRes = await fetch('/__cov/meta')
            if (!metaRes.ok) throw new Error(`meta endpoint ${metaRes.status}`)
            const meta = (await metaRes.json()) as {
                projectRoot: string
                coverageExists: boolean
                coverageMtimeMs: number | null
            }
            projectRoot.value = meta.projectRoot.replace(/\\/g, '/')
            lastCoverageMtimeMs.value = meta.coverageMtimeMs
            if (!meta.coverageExists) {
                throw new Error('coverage-final.json not found. Run `npm run test:coverage` in the project root first.')
            }

            const dataRes = await fetch('/__cov/data')
            if (!dataRes.ok) throw new Error(`data endpoint ${dataRes.status}`)
            const coverage = (await dataRes.json()) as CoverageMap

            const stats: FileStats[] = []
            for (const key of Object.keys(coverage)) {
                const file = coverage[key]
                if (!file) continue
                stats.push(computeFileStats(file.path ?? key, file, projectRoot.value))
            }
            stats.sort((a, b) => a.relPath.localeCompare(b.relPath))
            files.value = stats
            tree.value = buildTree(stats)
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err)
        } finally {
            loading.value = false
        }
    }

    async function refreshIfCoverageChanged(): Promise<void> {
        if (loading.value) return
        try {
            const metaRes = await fetch('/__cov/meta')
            if (!metaRes.ok) return
            const meta = (await metaRes.json()) as {
                coverageExists: boolean
                coverageMtimeMs: number | null
            }
            if (!meta.coverageExists || meta.coverageMtimeMs == null) return
            if (lastCoverageMtimeMs.value == null) {
                lastCoverageMtimeMs.value = meta.coverageMtimeMs
                return
            }
            if (meta.coverageMtimeMs !== lastCoverageMtimeMs.value) {
                await load()
            }
        } catch {
            // Keep silent; manual reload still works.
        }
    }

    function startAutoRefresh (): void {
        if (typeof window === 'undefined') return
        if (refreshTimer !== null) return
        refreshTimer = window.setInterval(() => {
            void refreshIfCoverageChanged()
        }, 2000)
    }

    function stopAutoRefresh (): void {
        if (refreshTimer === null) return
        window.clearInterval(refreshTimer)
        refreshTimer = null
    }

    return {
        loading,
        error,
        projectRoot,
        files,
        tree,
        totals,
        startAutoRefresh,
        stopAutoRefresh,
        load,
    }
}

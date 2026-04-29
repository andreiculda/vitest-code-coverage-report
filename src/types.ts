export interface Location {
    line: number
    column: number | null
}

export interface Range {
    start: Location
    end: Location
}

export interface FunctionMapping {
    name: string
    decl: Range
    loc: Range
    line: number
}

export interface BranchMapping {
    loc: Range
    type: string
    locations: Range[]
    line: number
}

export interface IstanbulFileCoverage {
    path: string
    statementMap: Record<string, Range>
    fnMap: Record<string, FunctionMapping>
    branchMap: Record<string, BranchMapping>
    s: Record<string, number>
    f: Record<string, number>
    b: Record<string, number[]>
    meta?: Record<string, unknown>
    inputSourceMap?: unknown
}

export type CoverageMap = Record<string, IstanbulFileCoverage>

export interface MetricTotals {
    total: number
    covered: number
    coveragePercentage: number
}

export interface FileStats {
    absPath: string
    relPath: string
    statements: MetricTotals
    functions: MetricTotals
    branches: MetricTotals
    lines: MetricTotals
    lineHits: Map<number, number>
    uncoveredBranchRangesByLine: Map<number, Array<{ start: number; end: number }>>
    uncoveredBranchMarkersByLine: Map<number, BranchMarker[]>
    uncoveredFunctionRangesByLine: Map<number, Array<{ start: number; end: number }>>
}

export interface TreeNode {
    name: string
    fullPath: string
    isFile: boolean
    children: TreeNode[]
    stats: FileStats | null
    aggregated: {
        statements: MetricTotals
        functions: MetricTotals
        branches: MetricTotals
        lines: MetricTotals
    }
}

export interface Thresholds {
    good: number
    warning: number
}

export type MetricKey = 'statements' | 'functions' | 'branches' | 'lines'

export interface FolderEntry {
    name: string
    relPath: string
    stats: {
        statements: MetricTotals
        branches: MetricTotals
        functions: MetricTotals
        lines: MetricTotals
    }
}

export interface DisplayEntry {
    kind: 'folder' | 'file'
    name: string
    relPath: string
    stats: {
        statements: MetricTotals
        branches: MetricTotals
        functions: MetricTotals
        lines: MetricTotals
    }
    file?: FileStats
}

export interface BranchMarker {
    column: number
    label: string
    type: string
    index: number
    total: number
}

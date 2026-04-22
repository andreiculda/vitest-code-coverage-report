<template>
    <div class="space-y-2">
        <div
            v-if="query.trim().length === 0"
            class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
        >
            <button
                v-if="inFolderMode"
                type="button"
                class="btn py-1 px-2 text-xs"
                @click="goRoot"
            >
                Root folders
            </button>
            <button
                v-if="inFolderMode"
                type="button"
                class="btn py-1 px-2 text-xs"
                @click="goUp"
            >
                Up
            </button>
            <template v-if="inFolderMode">
                <span class="text-slate-500">in</span>
                <template
                    v-for="crumb in breadcrumbs"
                    :key="crumb.path"
                >
                    <span>/</span>
                    <button
                        type="button"
                        class="text-brand-500 hover:underline"
                        @click="openBreadcrumb(crumb.path)"
                    >
                        {{ crumb.name }}
                    </button>
                </template>
            </template>
        </div>

        <table class="w-full text-sm">
            <thead>
                <tr class="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th
                        class="sticky top-0 z-10 px-3 py-2 font-medium cursor-pointer select-none bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur"
                        @click="toggleSort('path')"
                    >
                        {{ firstColumnTitle }} <span class="ml-1">{{ sortArrow('path') }}</span>
                    </th>
                    <th
                        class="sticky top-0 z-10 px-3 py-2 font-medium cursor-pointer select-none w-48 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur"
                        @click="toggleSort('statements')"
                    >
                        Statements {{ sortArrow('statements') }}
                    </th>
                    <th
                        class="sticky top-0 z-10 px-3 py-2 font-medium cursor-pointer select-none w-48 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur"
                        @click="toggleSort('branches')"
                    >
                        Branches {{ sortArrow('branches') }}
                    </th>
                    <th
                        class="sticky top-0 z-10 px-3 py-2 font-medium cursor-pointer select-none w-48 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur"
                        @click="toggleSort('functions')"
                    >
                        Functions {{ sortArrow('functions') }}
                    </th>
                    <th
                        class="sticky top-0 z-10 px-3 py-2 font-medium cursor-pointer select-none w-48 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur"
                        @click="toggleSort('lines')"
                    >
                        Lines {{ sortArrow('lines') }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="entry in displayedEntries"
                    :key="entry.relPath"
                    :class="[
                        'border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors cursor-pointer',
                        statementRowTintClass(entry.stats.statements.coveragePercentage),
                        entry.kind === 'file' && selectedPath === entry.relPath
                            ? 'bg-brand-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                    ]"
                    @click="entry.kind === 'file' && entry.file ? emit('selectFile', entry.file) : openFolder(entry.relPath)"
                >
                    <td class="px-3 py-2 max-w-0">
                        <div
                            v-if="entry.kind === 'file'"
                            class="min-w-0"
                        >
                            <div
                                class="truncate font-mono text-[12px] inline-flex items-center gap-1"
                                :title="entry.name"
                            >
                                <Icon
                                    :icon="fileIconFor(entry.relPath)"
                                    class="h-4 w-4 flex-shrink-0"
                                />
                                <template
                                    v-for="(part, idx) in highlightedParts(entry.name)"
                                    :key="idx"
                                >
                                    <span :class="part.isMatch ? 'bg-amber-300/45 dark:bg-amber-500/35 rounded-[2px]' : ''">
                                        {{ part.value }}
                                    </span>
                                </template>
                            </div>
                            <div
                                class="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400 pl-5"
                                :title="directoryPathOnly(entry.relPath)"
                            >
                                <template
                                    v-for="(part, idx) in highlightedParts(directoryPathOnly(entry.relPath))"
                                    :key="idx"
                                >
                                    <span :class="part.isMatch ? 'bg-amber-300/35 dark:bg-amber-500/30 rounded-[2px] text-slate-700 dark:text-slate-200' : ''">
                                        {{ part.value }}
                                    </span>
                                </template>
                            </div>
                        </div>
                        <div
                            v-else
                            class="truncate font-mono text-[12px] inline-flex items-center gap-1"
                            :title="entry.relPath"
                        >
                            <Icon
                                icon="vscode-icons:default-folder"
                                class="h-4 w-4 flex-shrink-0"
                            />
                            <template
                                v-for="(part, idx) in highlightedParts(entry.name)"
                                :key="idx"
                            >
                                <span :class="part.isMatch ? 'bg-amber-300/45 dark:bg-amber-500/35 rounded-[2px]' : ''">
                                    {{ part.value }}
                                </span>
                            </template>
                        </div>
                    </td>
                    <td class="px-3 py-2">
                        <CoverageBar
                            :coverage-percentage="entry.stats.statements.coveragePercentage"
                            :covered="entry.stats.statements.covered"
                            :total="entry.stats.statements.total"
                            size="sm"
                        />
                    </td>
                    <td class="px-3 py-2">
                        <CoverageBar
                            :coverage-percentage="entry.stats.branches.coveragePercentage"
                            :covered="entry.stats.branches.covered"
                            :total="entry.stats.branches.total"
                            size="sm"
                        />
                    </td>
                    <td class="px-3 py-2">
                        <CoverageBar
                            :coverage-percentage="entry.stats.functions.coveragePercentage"
                            :covered="entry.stats.functions.covered"
                            :total="entry.stats.functions.total"
                            size="sm"
                        />
                    </td>
                    <td class="px-3 py-2">
                        <CoverageBar
                            :coverage-percentage="entry.stats.lines.coveragePercentage"
                            :covered="entry.stats.lines.covered"
                            :total="entry.stats.lines.total"
                            size="sm"
                        />
                    </td>
                </tr>
                <tr v-if="!displayedEntries.length">
                    <td
                        colspan="5"
                        class="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                        {{ query.trim().length > 0 ? 'No files match the current filter.' : inFolderMode ? 'No files in this folder.' : 'No folders match the current filter.' }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script setup lang="ts">
import type { DisplayEntry, FileStats, FolderEntry, MetricTotals } from '@/types'
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import CoverageBar from './CoverageBar.vue'

const {
    files,
    selectedPath,
    query,
    currentFolderPath,
} = defineProps<{
    files: FileStats[]
    selectedPath: string | null
    query: string
    currentFolderPath: string
}>()
const emit = defineEmits<{
    selectFile: [file: FileStats]
    navigateFolder: [path: string]
}>()

type SortKey = 'path' | 'statements' | 'branches' | 'functions' | 'lines'
const sortKey = ref<SortKey>('path')
const sortDir = ref<'asc' | 'desc'>('asc')
const EMPTY_METRIC: MetricTotals = { total: 0, covered: 0, coveragePercentage: 100 }
const normalizedCurrentFolderPath = computed(() => currentFolderPath.replace(/^\/+|\/+$/g, ''))

function toggleSort (key: SortKey): void {
    if (sortKey.value === key) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortKey.value = key
        sortDir.value = key === 'path' ? 'asc' : 'asc'
    }
}

function sortArrow (key: SortKey): string {
    if (sortKey.value !== key) return '↕'
    return sortDir.value === 'asc' ? '↑' : '↓'
}

function statementRowTintClass (coveragePercentage: number): string {
    if (coveragePercentage < 50) return 'bg-[hsl(0_84%_60%_/_0.05)] dark:bg-[hsl(0_72%_50%_/_0.075)]'
    if (coveragePercentage < 80) return 'bg-[hsl(35_92%_54%_/_0.042)] dark:bg-[hsl(35_90%_50%_/_0.07)]'
    return 'bg-[hsl(145_63%_42%_/_0.035)] dark:bg-[hsl(145_65%_36%_/_0.06)]'
}

function addMetric (a: MetricTotals, b: MetricTotals): MetricTotals {
    const total = a.total + b.total
    const covered = a.covered + b.covered
    return { total, covered, coveragePercentage: total === 0 ? 100 : (covered / total) * 100 }
}

const entries = computed(() => {
    const q = query.trim().toLowerCase()
    const folders = new Map<string, FolderEntry['stats']>()

    // Build a complete folder index (all folders and subfolders).
    for (const file of files) {
        const parts = file.relPath.split('/').filter(Boolean)
        if (parts.length <= 1) continue
        for (let i = 1; i < parts.length; i++) {
            const folderPath = parts.slice(0, i).join('/')
            const prev = folders.get(folderPath) ?? {
                statements: { ...EMPTY_METRIC },
                branches: { ...EMPTY_METRIC },
                functions: { ...EMPTY_METRIC },
                lines: { ...EMPTY_METRIC },
            }
            folders.set(folderPath, {
                statements: addMetric(prev.statements, file.statements),
                branches: addMetric(prev.branches, file.branches),
                functions: addMetric(prev.functions, file.functions),
                lines: addMetric(prev.lines, file.lines),
            })
        }
    }

    let folderEntries: FolderEntry[] = [...folders.entries()]
        .map(([relPath, stats]) => ({
            relPath,
            name: relPath,
            stats,
        }))
    if (q) folderEntries = folderEntries.filter((entry) => entry.relPath.toLowerCase().includes(q))

    const dir = sortDir.value === 'asc' ? 1 : -1
    const key = sortKey.value
    folderEntries.sort((a, b) => {
        if (key === 'path') return a.relPath.localeCompare(b.relPath) * dir
        return (a.stats[key].coveragePercentage - b.stats[key].coveragePercentage) * dir
    })
    return folderEntries
})

const fileEntries = computed(() => {
    if (!normalizedCurrentFolderPath.value) return [] as FileStats[]
    const q = query.trim().toLowerCase()
    const prefix = `${normalizedCurrentFolderPath.value}/`
    const directFiles = files.filter((file) => {
        if (!file.relPath.startsWith(prefix)) return false
        const remainder = file.relPath.slice(prefix.length)
        if (!remainder || remainder.includes('/')) return false
        if (!q) return true
        return file.relPath.toLowerCase().includes(q) || remainder.toLowerCase().includes(q)
    })
    const dir = sortDir.value === 'asc' ? 1 : -1
    const key = sortKey.value
    return [...directFiles].sort((a, b) => {
        if (key === 'path') return a.relPath.localeCompare(b.relPath) * dir
        return (a[key].coveragePercentage - b[key].coveragePercentage) * dir
    })
})

const nestedFolderEntries = computed(() => {
    if (!normalizedCurrentFolderPath.value) return [] as FolderEntry[]
    const q = query.trim().toLowerCase()
    const prefix = `${normalizedCurrentFolderPath.value}/`
    const folders = new Map<string, FolderEntry['stats']>()

    for (const file of files) {
        if (!file.relPath.startsWith(prefix)) continue
        const remainder = file.relPath.slice(prefix.length)
        if (!remainder) continue
        const slashIndex = remainder.indexOf('/')
        if (slashIndex === -1) continue

        const folderName = remainder.slice(0, slashIndex)
        const folderPath = `${normalizedCurrentFolderPath.value}/${folderName}`
        if (q && !folderPath.toLowerCase().includes(q)) continue

        const prev = folders.get(folderPath) ?? {
            statements: { ...EMPTY_METRIC },
            branches: { ...EMPTY_METRIC },
            functions: { ...EMPTY_METRIC },
            lines: { ...EMPTY_METRIC },
        }
        folders.set(folderPath, {
            statements: addMetric(prev.statements, file.statements),
            branches: addMetric(prev.branches, file.branches),
            functions: addMetric(prev.functions, file.functions),
            lines: addMetric(prev.lines, file.lines),
        })
    }

    return [...folders.entries()]
        .map(([relPath, stats]) => ({
            relPath,
            name: fileNameOnly(relPath),
            stats,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
})

const globalSearchFileEntries = computed(() => {
    const q = query.trim().toLowerCase()
    if (!q) return [] as FileStats[]
    const dir = sortDir.value === 'asc' ? 1 : -1
    const key = sortKey.value

    const filtered = files.filter((file) => {
        const path = file.relPath.toLowerCase()
        const fileName = fileNameOnly(file.relPath).toLowerCase()
        return path.includes(q) || fileName.includes(q)
    })

    return [...filtered].sort((a, b) => {
        if (key === 'path') return a.relPath.localeCompare(b.relPath) * dir
        return (a[key].coveragePercentage - b[key].coveragePercentage) * dir
    })
})

const displayedEntries = computed<DisplayEntry[]>(() => {
    const hasSearch = query.trim().length > 0
    if (hasSearch) {
        return globalSearchFileEntries.value.map((file) => ({
            kind: 'file',
            name: fileNameOnly(file.relPath),
            relPath: file.relPath,
            file,
            stats: {
                statements: file.statements,
                branches: file.branches,
                functions: file.functions,
                lines: file.lines,
            },
        }))
    }

    if (!inFolderMode.value) {
        return entries.value.map((entry) => ({
            kind: 'folder',
            name: entry.name,
            relPath: entry.relPath,
            stats: entry.stats,
        }))
    }
    const folders = nestedFolderEntries.value.map((entry) => ({
        kind: 'folder' as const,
        name: entry.name,
        relPath: entry.relPath,
        stats: entry.stats,
    }))
    const files = fileEntries.value.map((file) => ({
        kind: 'file' as const,
        name: fileNameOnly(file.relPath),
        relPath: file.relPath,
        file,
        stats: {
            statements: file.statements,
            branches: file.branches,
            functions: file.functions,
            lines: file.lines,
        },
    }))
    return [...folders, ...files]
})

const breadcrumbs = computed(() => {
    if (!normalizedCurrentFolderPath.value) return [] as Array<{ name: string; path: string }>
    const parts = normalizedCurrentFolderPath.value.split('/').filter(Boolean)
    const crumbs: Array<{ name: string; path: string }> = []
    let acc = ''
    for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part
        crumbs.push({ name: part, path: acc })
    }
    return crumbs
})

const inFolderMode = computed(() => Boolean(normalizedCurrentFolderPath.value))
const firstColumnTitle = computed(() => {
    if (query.trim().length > 0) return 'File'
    return inFolderMode.value ? 'File' : 'Folder'
})

function openFolder (folderPath: string): void {
    emit('navigateFolder', folderPath)
}

function goRoot (): void {
    emit('navigateFolder', '')
}

function goUp (): void {
    if (!normalizedCurrentFolderPath.value) return
    const parts = normalizedCurrentFolderPath.value.split('/')
    parts.pop()
    emit('navigateFolder', parts.length ? parts.join('/') : '')
}

function openBreadcrumb (path: string): void {
    emit('navigateFolder', path)
}

function fileNameOnly (path: string): string {
    const parts = path.split('/')
    return parts[parts.length - 1] ?? path
}

function directoryPathOnly (path: string): string {
    const parts = path.split('/')
    parts.pop()
    return parts.join('/')
}

function highlightedParts (text: string): Array<{ value: string; isMatch: boolean }> {
    const needle = query.trim().toLowerCase()
    if (!needle) return [{ value: text, isMatch: false }]

    const haystack = text.toLowerCase()
    const parts: Array<{ value: string; isMatch: boolean }> = []
    let cursor = 0

    while (cursor < text.length) {
        const foundAt = haystack.indexOf(needle, cursor)
        if (foundAt === -1) {
            parts.push({ value: text.slice(cursor), isMatch: false })
            break
        }
        if (foundAt > cursor) {
            parts.push({ value: text.slice(cursor, foundAt), isMatch: false })
        }
        parts.push({
            value: text.slice(foundAt, foundAt + needle.length),
            isMatch: true,
        })
        cursor = foundAt + needle.length
    }

    return parts.length ? parts : [{ value: text, isMatch: false }]
}

function fileIconFor (path: string): string {
    const lower = path.toLowerCase()
    const name = fileNameOnly(lower)

    if (name === 'package.json') return 'vscode-icons:file-type-node'
    if (name === 'tsconfig.json') return 'vscode-icons:file-type-tsconfig'
    if (name.endsWith('.d.ts')) return 'vscode-icons:file-type-typescript-official'
    if (name.endsWith('.spec.ts') || name.endsWith('.test.ts')) return 'vscode-icons:file-type-test-ts'

    const dot = name.lastIndexOf('.')
    const ext = dot >= 0 ? name.slice(dot + 1) : ''
    const map: Record<string, string> = {
        vue: 'vscode-icons:file-type-vue',
        ts: 'vscode-icons:file-type-typescript-official',
        tsx: 'vscode-icons:file-type-typescript-official',
        js: 'vscode-icons:file-type-js-official',
        jsx: 'vscode-icons:file-type-js-official',
        json: 'vscode-icons:file-type-json',
        scss: 'vscode-icons:file-type-scss',
        css: 'vscode-icons:file-type-css',
        html: 'vscode-icons:file-type-html',
        md: 'vscode-icons:file-type-markdown',
        yml: 'vscode-icons:file-type-light-yaml',
        yaml: 'vscode-icons:file-type-light-yaml',
        png: 'vscode-icons:file-type-image',
        jpg: 'vscode-icons:file-type-image',
        jpeg: 'vscode-icons:file-type-image',
        gif: 'vscode-icons:file-type-image',
        webp: 'vscode-icons:file-type-image',
        svg: 'vscode-icons:file-type-svg',
        lock: 'vscode-icons:file-type-lock',
        env: 'vscode-icons:file-type-dotenv',
    }
    return map[ext] ?? 'vscode-icons:default-file'
}
</script>

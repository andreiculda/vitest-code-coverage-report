<template>
    <div class="h-full flex flex-col">
        <header
            class="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur z-10 flex-shrink-0"
        >
            <div class="px-5 py-2.5 flex items-center gap-3 flex-wrap">
                <div class="flex items-center gap-2 min-w-0">
                    <img
                        src="/favicon.svg"
                        alt="Coverage Report logo"
                        class="h-7 w-7 rounded-md"
                    >
                    <div class="min-w-0">
                        <h1 class="text-sm font-semibold text-slate-900 dark:text-slate-50 leading-tight">
                            Coverage Report
                        </h1>
                        <p
                            v-if="projectRoot"
                            class="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[50ch]"
                            :title="projectRoot"
                        >
                            {{ projectRoot }}
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-2 flex-1 min-w-[240px] max-w-xl">
                    <div class="relative flex-1">
                        <input
                            ref="searchInput"
                            v-model="query"
                            type="search"
                            placeholder="Filter files… (press / to focus)"
                            class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
                        >
                        <span
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            aria-hidden
                        >
                            <Icon
                                icon="lucide:search"
                                class="h-4 w-4"
                            />
                        </span>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        class="btn inline-flex items-center gap-1.5"
                        :title="showInsights ? 'Hide insights panel' : 'Show insights panel'"
                        @click="showInsights = !showInsights"
                    >
                        <Icon
                            icon="lucide:panel-left"
                            class="h-4 w-4"
                        />
                        <span>insights</span>
                    </button>
                </div>
                <div class="flex items-center gap-2 ml-auto">
                    <button
                        type="button"
                        class="btn"
                        title="Reload coverage data"
                        @click="load"
                    >
                        <Icon
                            icon="lucide:refresh-cw"
                            class="h-4 w-4"
                        />
                    </button>
                    <button
                        type="button"
                        class="btn inline-flex items-center gap-1.5"
                        :title="showSettingsPanel ? 'Hide settings' : 'Show settings'"
                        @click="showSettingsPanel = !showSettingsPanel"
                    >
                        <Icon
                            icon="lucide:settings-2"
                            class="h-4 w-4"
                        />
                    </button>
                </div>
            </div>
        </header>

        <main class="flex-1 min-h-0 overflow-hidden">
            <div
                v-if="loading"
                class="flex items-center justify-center h-64 text-slate-500"
            >
                Loading coverage…
            </div>

            <div
                v-else-if="error"
                class="m-5 panel p-5 border-rose-300 dark:border-rose-800"
            >
                <div class="text-rose-600 dark:text-rose-400 font-semibold mb-1">
                    Couldn't load coverage
                </div>
                <p class="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    {{ error }}
                </p>
                <button
                    type="button"
                    class="btn btn-primary"
                    @click="load"
                >
                    Retry
                </button>
            </div>

            <div
                v-else-if="tree && files.length"
                class="h-full min-h-0 p-5 flex flex-col gap-5"
            >
                <div
                    class="flex flex-1 min-h-0 overflow-hidden"
                    :class="showInsights ? 'gap-4' : 'gap-0'"
                >
                    <aside
                        class="transition-[width,opacity,transform] duration-300 ease-out overflow-hidden"
                        :class="showInsights ? 'w-full max-w-[350px] opacity-100 translate-x-0' : 'w-0 max-w-0 opacity-0 -translate-x-2'"
                        aria-label="Insights panel"
                    >
                        <div
                            v-if="showInsights"
                            class="h-full min-h-0 overflow-auto pr-1"
                        >
                            <CoverageInsights
                                :totals="currentTotals"
                                :project-root="projectRoot"
                                :insight-files="files"
                                :top-pages-by-risk="topPagesByRisk"
                                :top-pages-by-untested-impact="topPagesByUntestedImpact"
                                :high-complexity-low-coverage="highComplexityLowCoverage"
                                :quick-wins="quickWins"
                                :flaky-zone-candidates="flakyZoneCandidates"
                                @navigate-pages-scope="navigateFolder"
                                @open-coverage-file="openCoverageFileFromInsights"
                            />
                        </div>
                    </aside>
                    <div class="flex-1 min-w-0 min-h-0 flex flex-col gap-4">
                        <SummaryBar
                            :totals="currentTotals"
                            :file-count="currentFileCount"
                            :folder-path="currentFolderPath"
                        />
                        <section class="panel p-3 flex flex-col flex-1 min-h-0 overflow-hidden min-h-[56vh]">
                            <div class="flex items-center justify-between px-1 pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                                <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Coverage
                                </span>
                                <span class="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                    {{ filteredCurrentFileCount }}/{{ files.length }}
                                </span>
                            </div>
                            <div class="flex-1 min-h-0 overflow-auto">
                                <FileList
                                    :files="files"
                                    :query="query"
                                    :selected-path="selected?.relPath ?? null"
                                    :current-folder-path="currentFolderPath"
                                    :root-folder-path="defaultAppRootFolder"
                                    @select-file="selectFile"
                                    @navigate-folder="navigateFolder"
                                />
                            </div>
                        </section>
                        </div>
                </div>
            </div>

            <div
                v-else
                class="flex items-center justify-center h-64 text-slate-500"
            >
                No coverage entries found.
            </div>
        </main>

        <Transition
            enter-active-class="transition duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="showSettingsPanel"
                class="fixed inset-0 z-40"
                @click="showSettingsPanel = false"
            />
        </Transition>

        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="translate-x-full opacity-0"
            enter-to-class="translate-x-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-x-0 opacity-100"
            leave-to-class="translate-x-full opacity-0"
        >
            <aside
                v-if="showSettingsPanel"
                class="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] panel rounded-none border-l border-slate-200 dark:border-slate-700 overflow-y-auto"
                aria-label="Settings panel"
            >
                <div class="p-5 flex flex-col gap-5">
                    <div class="flex items-center justify-between">
                        <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            Settings
                        </h2>
                        <button
                            type="button"
                            class="btn"
                            @click="showSettingsPanel = false"
                        >
                            Close
                        </button>
                    </div>

                    <section class="space-y-2">
                        <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Theme
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-slate-700 dark:text-slate-300">
                                Current: {{ theme }}
                            </span>
                            <button
                                type="button"
                                class="btn inline-flex items-center gap-1.5"
                                :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'"
                                @click="toggleTheme"
                            >
                                <Icon
                                    :icon="theme === 'dark' ? 'lucide:sun' : 'lucide:moon'"
                                    class="h-4 w-4"
                                />
                                <span>Toggle</span>
                            </button>
                        </div>
                    </section>

                    <section class="space-y-2">
                        <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Thresholds
                        </div>
                        <div class="panel p-3">
                            <ThresholdsPanel />
                        </div>
                    </section>

                    <section class="space-y-2">
                        <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Keyboard shortcuts
                        </div>
                        <dl class="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                            <dt><span class="kbd">/</span></dt>
                            <dd class="text-slate-700 dark:text-slate-300">
                                Focus the search box
                            </dd>
                            <dt><span class="kbd">Esc</span></dt>
                            <dd class="text-slate-700 dark:text-slate-300">
                                Blur search · clear filter
                            </dd>
                            <dt><span class="kbd">j</span></dt>
                            <dd class="text-slate-700 dark:text-slate-300">
                                Next file
                            </dd>
                            <dt><span class="kbd">k</span></dt>
                            <dd class="text-slate-700 dark:text-slate-300">
                                Previous file
                            </dd>
                            <dt><span class="kbd">t</span></dt>
                            <dd class="text-slate-700 dark:text-slate-300">
                                Toggle light/dark theme
                            </dd>
                            <dt><span class="kbd">?</span></dt>
                            <dd class="text-slate-700 dark:text-slate-300">
                                Open settings panel
                            </dd>
                        </dl>
                    </section>
                </div>
            </aside>
        </Transition>

        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="isSourceOpen"
                class="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px]"
                @click.self="closeSourceModal"
            >
                <Transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="translate-y-full"
                    enter-to-class="translate-y-0"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="translate-y-0"
                    leave-to-class="translate-y-full"
                >
                    <div
                        v-if="selected"
                        class="absolute inset-x-0 bottom-0 h-[100vh] bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2 flex-shrink-0">
                            <div class="flex items-center justify-between gap-3">
                                <div class="flex items-center gap-2 min-w-0">
                                    <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                        File coverage details
                                    </div>
                                    <div
                                        class="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[55vw]"
                                        :title="selected.relPath"
                                    >
                                        {{ selectedFileName }}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    class="btn"
                                    @click="closeSourceModal"
                                >
                                    Close
                                </button>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                    <div class="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Statements
                                    </div>
                                    <CoverageBar
                                        :coverage-percentage="selected.statements.coveragePercentage"
                                        :covered="selected.statements.covered"
                                        :total="selected.statements.total"
                                    />
                                </div>
                                <div>
                                    <div class="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Branches
                                    </div>
                                    <CoverageBar
                                        :coverage-percentage="selected.branches.coveragePercentage"
                                        :covered="selected.branches.covered"
                                        :total="selected.branches.total"
                                    />
                                </div>
                                <div>
                                    <div class="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Functions
                                    </div>
                                    <CoverageBar
                                        :coverage-percentage="selected.functions.coveragePercentage"
                                        :covered="selected.functions.covered"
                                        :total="selected.functions.total"
                                    />
                                </div>
                                <div>
                                    <div class="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Lines
                                    </div>
                                    <CoverageBar
                                        :coverage-percentage="selected.lines.coveragePercentage"
                                        :covered="selected.lines.covered"
                                        :total="selected.lines.total"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="flex-1 min-h-0 p-4 overflow-hidden">
                            <SourceViewer :file="selected" />
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { useCoverage } from '@/composables/useCoverage'
import { useKeyboard } from '@/composables/useKeyboard'
import { useTheme } from '@/composables/useTheme'
import type { FileStats, TreeNode } from '@/types'
import { Icon } from '@iconify/vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import CoverageBar from './components/CoverageBar.vue'
import CoverageInsights from './components/CoverageInsights.vue'
import FileList from './components/FileList.vue'
import SourceViewer from './components/SourceViewer.vue'
import SummaryBar from './components/SummaryBar.vue'
import ThresholdsPanel from './components/ThresholdsPanel.vue'

const { loading, error, files, tree, totals, projectRoot, startAutoRefresh, stopAutoRefresh, load } = useCoverage()
const { theme, toggle: toggleTheme } = useTheme()

const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const selected = ref<FileStats | null>(null)
const isSourceOpen = ref(false)
const showSettingsPanel = ref(false)
const showInsights = ref(false)
const pendingFilePath = ref<string | null>(null)
const currentFolderPath = ref('')
const defaultAppRootFolder = normalizePath(import.meta.env.VITE_APP_ROOT_FOLDER ?? 'src')
const INSIGHTS_PANEL_STORAGE_KEY = 'coverage-report:show-insights'

interface UrlState {
    folder: string
    file: string
}

function normalizePath (path: string): string {
    return path.replace(/^\/+|\/+$/g, '')
}

function parseUrlState (): UrlState {
    const params = new URLSearchParams(window.location.search)
    const folder = normalizePath(params.get('folder') ?? '')
    const file = normalizePath(params.get('file') ?? '')
    return { folder, file }
}

function encodeQueryPathValue (value: string): string {
    // Keep forward slashes human-readable in query values.
    return encodeURIComponent(value).replace(/%2F/g, '/')
}

function syncUrlState (replace = true): void {
    const parts: string[] = []
    if (currentFolderPath.value && currentFolderPath.value !== defaultAppRootFolder) {
        parts.push(`folder=${encodeQueryPathValue(currentFolderPath.value)}`)
    }
    if (isSourceOpen.value && selected.value?.relPath) {
        parts.push(`file=${encodeQueryPathValue(selected.value.relPath)}`)
    }
    const queryString = parts.join('&')
    const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
    if (replace) window.history.replaceState(null, '', nextUrl)
    else window.history.pushState(null, '', nextUrl)
}

function applyUrlState (): void {
    const state = parseUrlState()
    currentFolderPath.value = state.folder || defaultAppRootFolder
    pendingFilePath.value = state.file || null
}

function onPopState (): void {
    applyUrlState()
    if (!pendingFilePath.value) {
        isSourceOpen.value = false
        selected.value = null
        return
    }
    const file = files.value.find((entry) => entry.relPath === pendingFilePath.value)
    if (!file) return
    selected.value = file
    isSourceOpen.value = true
}

onMounted(async () => {
    if (typeof window !== 'undefined') {
        showInsights.value = window.localStorage.getItem(INSIGHTS_PANEL_STORAGE_KEY) === 'true'
    }
    applyUrlState()
    window.addEventListener('popstate', onPopState)
    await load()
    if (currentFolderPath.value && !findNodeByPath(tree.value, currentFolderPath.value)) {
        currentFolderPath.value = ''
    }
    startAutoRefresh()
    if (pendingFilePath.value) {
        const file = files.value.find((entry) => entry.relPath === pendingFilePath.value)
        if (file) {
            selected.value = file
            isSourceOpen.value = true
        }
    }
    syncUrlState(true)
})

onUnmounted(() => {
    window.removeEventListener('popstate', onPopState)
    stopAutoRefresh()
})

function selectFile (file: FileStats): void {
    selected.value = file
    isSourceOpen.value = true
    syncUrlState(false)
}

function closeSourceModal (): void {
    isSourceOpen.value = false
    syncUrlState(true)
}

function navigateFolder (path: string): void {
    const normalized = normalizePath(path)
    currentFolderPath.value = normalized || defaultAppRootFolder
    syncUrlState(false)
}

function openCoverageFileFromInsights (payload: { folderPath: string; filePath: string }): void {
    navigateFolder(payload.folderPath)
    const file = files.value.find((entry) => entry.relPath === payload.filePath)
    if (!file) return
    selected.value = file
    isSourceOpen.value = true
    syncUrlState(false)
}

const filteredFiles = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return files.value
    return files.value.filter((f) => f.relPath.toLowerCase().includes(q))
})

function findNodeByPath (root: TreeNode | null, path: string): TreeNode | null {
    if (!root) return null
    if (!path) return root
    const parts = path.split('/').filter(Boolean)
    let cursor: TreeNode | null = root
    for (const part of parts) {
        if (!cursor) return null
        const next: TreeNode | undefined = cursor.children.find((child) => child.name === part && !child.isFile)
        if (!next) return null
        cursor = next
    }
    return cursor
}

function countFilesInNode (node: TreeNode | null): number {
    if (!node) return 0
    if (node.isFile) return 1
    let count = 0
    for (const child of node.children) count += countFilesInNode(child)
    return count
}

const currentFolderNode = computed(() => findNodeByPath(tree.value, currentFolderPath.value))

const currentTotals = computed(() => currentFolderNode.value?.aggregated ?? totals.value)

const currentFileCount = computed(() => {
    const node = currentFolderNode.value
    if (!node) return files.value.length
    return countFilesInNode(node)
})

const filteredCurrentFileCount = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return currentFileCount.value

    const folderPrefix = currentFolderPath.value ? `${currentFolderPath.value}/` : ''
    return files.value.filter((file) => {
        if (folderPrefix && !file.relPath.startsWith(folderPrefix)) return false
        return file.relPath.toLowerCase().includes(q)
    }).length
})

interface PageCoverageReportEntry {
    path: string
    relPath: string
    targetFolderPath: string
    statements: number
    statementsCoverage: number
    branchesTotal: number
    branchesCoverage: number
    functionsTotal: number
    linesCoverage: number
    functionsCoverage: number
    uncoveredStatements: number
    uncoveredBranches: number
}

const pageCoverageReportEntries = computed(() => {
    const pagesRootPath = normalizePath(`${defaultAppRootFolder}/pages`)
    const prefix = `${pagesRootPath}/`
    return files.value
        .filter((file) => file.relPath.startsWith(prefix))
        .map((file) => {
            const filePath = file.relPath
            const folderPath = normalizePath(filePath.split('/').slice(0, -1).join('/'))
            const displayPath = filePath.split('/pages/')[1] ?? filePath
            return {
                path: displayPath,
                relPath: filePath,
                targetFolderPath: folderPath || pagesRootPath,
                statements: file.statements.total,
                statementsCoverage: file.statements.coveragePercentage,
                branchesTotal: file.branches.total,
                branchesCoverage: file.branches.coveragePercentage,
                functionsTotal: file.functions.total,
                linesCoverage: file.lines.coveragePercentage,
                functionsCoverage: file.functions.coveragePercentage,
                uncoveredStatements: file.statements.total - file.statements.covered,
                uncoveredBranches: file.branches.total - file.branches.covered,
            }
        })
})

const topPagesByStatements = computed(() => {
    return [...pageCoverageReportEntries.value]
        .sort((a, b) => {
            if (b.statements !== a.statements) return b.statements - a.statements
            return a.path.localeCompare(b.path)
        })
        .slice(0, 5)
})

const topPagesByRisk = computed(() => {
    return [...pageCoverageReportEntries.value]
        .sort((a, b) => {
            const aRisk = 100 - (a.branchesCoverage * 0.5 + a.linesCoverage * 0.3 + a.functionsCoverage * 0.2)
            const bRisk = 100 - (b.branchesCoverage * 0.5 + b.linesCoverage * 0.3 + b.functionsCoverage * 0.2)
            if (bRisk !== aRisk) return bRisk - aRisk
            return a.path.localeCompare(b.path)
        })
        .slice(0, 5)
        .map((entry) => ({
            path: entry.path,
            relPath: entry.relPath,
            targetFolderPath: entry.targetFolderPath,
            riskScore: 100 - (entry.branchesCoverage * 0.5 + entry.linesCoverage * 0.3 + entry.functionsCoverage * 0.2),
            branchesCoverage: entry.branchesCoverage,
            linesCoverage: entry.linesCoverage,
        }))
})

const topPagesByUntestedImpact = computed(() => {
    return [...pageCoverageReportEntries.value]
        .sort((a, b) => {
            const aImpact = a.uncoveredStatements + a.uncoveredBranches
            const bImpact = b.uncoveredStatements + b.uncoveredBranches
            if (bImpact !== aImpact) return bImpact - aImpact
            return a.path.localeCompare(b.path)
        })
        .slice(0, 5)
        .map((entry) => ({
            path: entry.path,
            relPath: entry.relPath,
            targetFolderPath: entry.targetFolderPath,
            uncoveredStatements: entry.uncoveredStatements,
            uncoveredBranches: entry.uncoveredBranches,
            impactScore: entry.uncoveredStatements + entry.uncoveredBranches,
        }))
})

const highComplexityLowCoverage = computed(() => {
    return [...pageCoverageReportEntries.value]
        .map((entry) => {
            const complexityScore = entry.branchesTotal + entry.functionsTotal
            const lowCoverageFactor = 1 - (entry.statementsCoverage / 100)
            return {
                path: entry.path,
                relPath: entry.relPath,
                targetFolderPath: entry.targetFolderPath,
                complexityScore,
                statementsCoverage: entry.statementsCoverage,
                severityScore: complexityScore * lowCoverageFactor,
            }
        })
        .sort((a, b) => {
            if (b.severityScore !== a.severityScore) return b.severityScore - a.severityScore
            return a.path.localeCompare(b.path)
        })
        .slice(0, 5)
})

const quickWins = computed(() => {
    return [...pageCoverageReportEntries.value]
        .map((entry) => {
            const impactScore = entry.uncoveredStatements + entry.uncoveredBranches
            const complexityScore = entry.branchesTotal + entry.functionsTotal
            return {
                path: entry.path,
                relPath: entry.relPath,
                targetFolderPath: entry.targetFolderPath,
                impactScore,
                complexityScore,
                quickWinScore: impactScore / (complexityScore + 1),
            }
        })
        .filter((entry) => entry.impactScore > 0)
        .sort((a, b) => {
            if (b.quickWinScore !== a.quickWinScore) return b.quickWinScore - a.quickWinScore
            return a.path.localeCompare(b.path)
        })
        .slice(0, 5)
})

const flakyZoneCandidates = computed(() => {
    return [...pageCoverageReportEntries.value]
        .map((entry) => {
            const branchGap = 1 - (entry.branchesCoverage / 100)
            return {
                path: entry.path,
                relPath: entry.relPath,
                targetFolderPath: entry.targetFolderPath,
                branchesTotal: entry.branchesTotal,
                branchesCoverage: entry.branchesCoverage,
                flakyScore: entry.branchesTotal * branchGap,
            }
        })
        .filter((entry) => entry.branchesTotal > 0)
        .sort((a, b) => {
            if (b.flakyScore !== a.flakyScore) return b.flakyScore - a.flakyScore
            return a.path.localeCompare(b.path)
        })
        .slice(0, 5)
})

const selectedFileName = computed(() => {
    const relPath = selected.value?.relPath ?? ''
    const segments = relPath.split('/')
    return segments[segments.length - 1] ?? relPath
})

const selectedIndex = computed(() => {
    if (!selected.value) return -1
    return filteredFiles.value.findIndex((f) => f.relPath === selected.value?.relPath)
})

watch(files, () => {
    if (selected.value?.relPath) {
        const latest = files.value.find((entry) => entry.relPath === selected.value?.relPath)
        if (latest) selected.value = latest
    }
    if (!pendingFilePath.value) return
    const file = files.value.find((entry) => entry.relPath === pendingFilePath.value)
    if (!file) return
    selected.value = file
    isSourceOpen.value = true
    pendingFilePath.value = null
}, { immediate: true })

watch(currentFolderPath, () => {
    syncUrlState(false)
})

watch(showInsights, (isOpen) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(INSIGHTS_PANEL_STORAGE_KEY, isOpen ? 'true' : 'false')
})

function navigate (direction: 1 | -1): void {
    const list = filteredFiles.value
    if (!list.length) return
    let idx = selectedIndex.value
    if (idx === -1) idx = direction === 1 ? -1 : list.length
    idx = (idx + direction + list.length) % list.length
    const next = list[idx]
    if (next) selected.value = next
}

useKeyboard({
    onSearch: () => {
        nextTick(() => searchInput.value?.focus())
    },
    onEscape: () => {
        if (isSourceOpen.value) {
            closeSourceModal()
            return
        }
        if (showSettingsPanel.value) {
            showSettingsPanel.value = false
            return
        }
        if (document.activeElement === searchInput.value) {
            searchInput.value?.blur()
            return
        }
        query.value = ''
    },
    onNextFile: () => navigate(1),
    onPrevFile: () => navigate(-1),
    onToggleTheme: toggleTheme,
    onOpenHelp: () => {
        showSettingsPanel.value = !showSettingsPanel.value
    },
})
</script>

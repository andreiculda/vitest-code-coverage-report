<template>
    <div class="grid grid-cols-1 gap-3">
        <section class="panel p-4">
            <div class="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                Untested surface map
            </div>
            <div class="flex items-center gap-2 mb-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span>Low impact</span>
                <div
                    class="h-1.5 w-24 rounded-full border border-slate-300/60 dark:border-slate-700/60"
                    style="background: linear-gradient(90deg, hsl(155 65% 40% / 0.65), hsl(40 92% 52% / 0.75), hsl(2 84% 60% / 0.85));"
                    title="Color scale: green (low) to red (high impact)"
                />
                <span>High impact</span>
            </div>
            <div
                v-if="treemapEntries.length === 0"
                class="text-xs text-slate-500 dark:text-slate-400"
            >
                No untested page surface in current scope.
            </div>
            <div
                v-else
                class="grid grid-cols-12 auto-rows-[56px] gap-2"
            >
                <button
                    v-for="entry in treemapEntries"
                    :key="`treemap-${entry.path}`"
                    type="button"
                    class="text-left rounded-md border border-slate-200/70 dark:border-slate-700/70 px-2 py-2 hover:border-brand-400/70 transition-colors"
                    :style="{
                        gridColumn: `span ${entry.colSpan}`,
                        gridRow: `span ${entry.rowSpan}`,
                        borderColor: entry.colorBorder,
                        background: entry.colorFill,
                    }"
                    @mouseenter="showCoveragePreview($event, entry)"
                    @mouseleave="hideCoveragePreview"
                    @click="openCoverageFile(entry)"
                >
                    <div class="flex h-full flex-col justify-between gap-1">
                        <span class="truncate text-xs font-mono text-slate-700 dark:text-slate-200">
                            {{ displayFileName(entry.path) }}
                        </span>
                        <div class="flex items-end justify-between gap-2">
                            <span
                                class="text-[10px]"
                                :style="{ color: entry.colorText }"
                            >
                                {{ entry.percentShare.toFixed(1) }}%
                            </span>
                            <span class="text-[11px] tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                                {{ entry.impactScore }} <span class="text-[10px] font-normal">({{ entry.impactLabel }})</span>
                            </span>
                        </div>
                    </div>
                </button>
            </div>
        </section>

        <section class="panel p-4">
            <div class="flex items-center justify-between gap-2 mb-2">
                <div class="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Coverage delta mode
                </div>
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        class="btn py-1 px-2 text-[11px]"
                        @click="setBaseline"
                    >
                        Set baseline
                    </button>
                    <button
                        type="button"
                        class="btn py-1 px-2 text-[11px]"
                        :disabled="!baseline"
                        @click="clearBaseline"
                    >
                        Clear
                    </button>
                </div>
            </div>
            <div
                v-if="!baseline"
                class="text-xs text-slate-500 dark:text-slate-400"
            >
                Save current metrics as baseline, then compare future coverage changes.
            </div>
            <div
                v-else
                class="grid grid-cols-2 gap-2"
            >
                <div
                    v-for="chip in deltaChips"
                    :key="chip.label"
                    :class="[
                        'rounded-md border px-2 py-1 text-xs',
                        chip.delta >= 0 ? 'border-emerald-300/60 text-emerald-600 dark:text-emerald-400' : 'border-rose-300/60 text-rose-600 dark:text-rose-400',
                    ]"
                >
                    <div class="uppercase tracking-wide text-[10px]">{{ chip.label }}</div>
                    <div class="tabular-nums font-semibold">
                        {{ formatSigned(chip.delta) }}%
                    </div>
                    <div class="mt-1 h-5">
                        <svg
                            viewBox="0 0 100 20"
                            class="w-full h-5"
                            aria-hidden="true"
                        >
                            <polyline
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                :points="sparklinePoints(chip.delta)"
                                class="opacity-70"
                            />
                        </svg>
                    </div>
                </div>
            </div>
            <div
                v-if="baselineSavedLabel"
                class="text-[10px] text-slate-500 dark:text-slate-400 mt-2"
            >
                Baseline saved {{ baselineSavedLabel }}
            </div>
        </section>

        <section class="grid grid-cols-1 gap-3">
            <div class="panel p-3">
                <div class="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                    High complexity / low coverage
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                    Score: (branches + functions) x (1 - statements%)
                </div>
                <div class="space-y-1.5 text-xs">
                    <button
                        v-for="(entry, index) in highComplexityLowCoverage"
                        :key="`complexity-mini-${entry.path}`"
                        type="button"
                        class="w-full flex items-center justify-between gap-2 text-left text-brand-500 hover:underline font-mono"
                        @mouseenter="showCoveragePreview($event, entry)"
                        @mouseleave="hideCoveragePreview"
                        @click="openCoverageFile(entry)"
                    >
                        <span class="min-w-0 truncate">{{ index + 1 }}. {{ displayFileName(entry.path) }}</span>
                        <span class="tabular-nums text-slate-500 dark:text-slate-400">{{ formatPercent(entry.statementsCoverage) }}</span>
                    </button>
                </div>
            </div>
            <div class="panel p-3">
                <div class="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                    Top coverage risk
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                    Risk: 100 - (0.5B + 0.3L + 0.2F)
                </div>
                <div class="space-y-1.5 text-xs">
                    <button
                        v-for="(entry, index) in topPagesByRisk.slice(0, 5)"
                        :key="`risk-mini-${entry.path}`"
                        type="button"
                        class="w-full flex items-center justify-between gap-2 text-left text-brand-500 hover:underline font-mono"
                        @mouseenter="showCoveragePreview($event, entry)"
                        @mouseleave="hideCoveragePreview"
                        @click="openCoverageFile(entry)"
                    >
                        <span class="min-w-0 truncate">{{ index + 1 }}. {{ displayFileName(entry.path) }}</span>
                        <span class="tabular-nums text-slate-500 dark:text-slate-400">{{ formatPercent(entry.riskScore) }}</span>
                    </button>
                </div>
            </div>
            <div class="panel p-3">
                <div class="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                    Quick wins
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                    Score: impact / (complexity + 1)
                </div>
                <div class="space-y-1.5 text-xs">
                    <button
                        v-for="(entry, index) in quickWins"
                        :key="`quick-wins-mini-${entry.path}`"
                        type="button"
                        class="w-full flex items-center justify-between gap-2 text-left text-brand-500 hover:underline font-mono"
                        @mouseenter="showCoveragePreview($event, entry)"
                        @mouseleave="hideCoveragePreview"
                        @click="openCoverageFile(entry)"
                    >
                        <span class="min-w-0 truncate">{{ index + 1 }}. {{ displayFileName(entry.path) }}</span>
                        <span
                            class="tabular-nums text-slate-500 dark:text-slate-400"
                        >{{ entry.quickWinScore.toFixed(2) }}</span>
                    </button>
                </div>
            </div>
            <div class="panel p-3">
                <div class="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                    Flaky zone candidates
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                    Score: branches x (1 - branch%)
                </div>
                <div class="space-y-1.5 text-xs">
                    <button
                        v-for="(entry, index) in flakyZoneCandidates"
                        :key="`flaky-mini-${entry.path}`"
                        type="button"
                        class="w-full flex items-center justify-between gap-2 text-left text-brand-500 hover:underline font-mono"
                        @mouseenter="showCoveragePreview($event, entry)"
                        @mouseleave="hideCoveragePreview"
                        @click="openCoverageFile(entry)"
                    >
                        <span class="min-w-0 truncate">{{ index + 1 }}. {{ displayFileName(entry.path) }}</span>
                        <span
                            class="tabular-nums text-slate-500 dark:text-slate-400"
                        >{{ entry.flakyScore.toFixed(1) }}</span>
                    </button>
                </div>
            </div>
        </section>

        <Teleport to="body">
            <div
                v-if="coveragePreview"
                class="fixed z-[90] w-[360px] panel p-3 pointer-events-none"
                :style="{ left: `${coveragePreview.left}px`, top: `${coveragePreview.top}px` }"
            >
                <div class="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                    {{ coveragePreview.fileName }}
                </div>
                <div
                    class="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mb-2"
                    :title="coveragePreview.folderPath"
                >
                    {{ coveragePreview.folderPath || '/' }}
                </div>
                <div
                    v-if="coveragePreview.impactScore != null || coveragePreview.complexityScore != null"
                    class="grid grid-cols-2 gap-2 text-[11px] mb-2"
                >
                    <div
                        v-if="coveragePreview.impactScore != null"
                        class="text-slate-600 dark:text-slate-300"
                    >
                        Impact:
                        <span class="font-semibold tabular-nums">{{ coveragePreview.impactScore }}</span>
                    </div>
                    <div
                        v-if="coveragePreview.complexityScore != null"
                        class="text-slate-600 dark:text-slate-300"
                    >
                        Complexity:
                        <span class="font-semibold tabular-nums">{{ coveragePreview.complexityScore }}</span>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <DonutChart
                        label="Statements"
                        :coverage-percentage="coveragePreview.file.statements.coveragePercentage"
                        :covered="coveragePreview.file.statements.covered"
                        :total="coveragePreview.file.statements.total"
                        :size="88"
                    />
                    <DonutChart
                        label="Branches"
                        :coverage-percentage="coveragePreview.file.branches.coveragePercentage"
                        :covered="coveragePreview.file.branches.covered"
                        :total="coveragePreview.file.branches.total"
                        :size="88"
                    />
                    <DonutChart
                        label="Functions"
                        :coverage-percentage="coveragePreview.file.functions.coveragePercentage"
                        :covered="coveragePreview.file.functions.covered"
                        :total="coveragePreview.file.functions.total"
                        :size="88"
                    />
                    <DonutChart
                        label="Lines"
                        :coverage-percentage="coveragePreview.file.lines.coveragePercentage"
                        :covered="coveragePreview.file.lines.covered"
                        :total="coveragePreview.file.lines.total"
                        :size="88"
                    />
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import type { FileStats, TreeNode } from '@/types'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import DonutChart from './DonutChart.vue'

interface QueueEntry {
    path: string
    relPath: string
    targetFolderPath: string
    priorityScore: number
    impactScore: number
    riskScore: number
}

interface ImpactEntry {
    path: string
    relPath: string
    targetFolderPath: string
    impactScore: number
}

const emit = defineEmits<{
    navigatePagesScope: [path: string]
    openCoverageFile: [payload: { folderPath: string; filePath: string }]
}>()

const {
    totals,
    projectRoot,
    insightFiles,
    topPagesByRisk,
    topPagesByUntestedImpact,
    highComplexityLowCoverage,
    quickWins,
    flakyZoneCandidates,
} = defineProps<{
    totals: TreeNode['aggregated']
    projectRoot: string
    insightFiles: FileStats[]
    topPagesByRisk: Array<{ path: string; relPath: string; targetFolderPath: string; riskScore: number }>
    topPagesByUntestedImpact: ImpactEntry[]
    highComplexityLowCoverage: Array<{
        path: string
        relPath: string
        targetFolderPath: string
        complexityScore: number
        statementsCoverage: number
        severityScore: number
    }>
    quickWins: Array<{
        path: string
        relPath: string
        targetFolderPath: string
        impactScore: number
        complexityScore: number
        quickWinScore: number
    }>
    flakyZoneCandidates: Array<{
        path: string
        relPath: string
        targetFolderPath: string
        branchesTotal: number
        branchesCoverage: number
        flakyScore: number
    }>
}>()

interface BaselineSnapshot {
    statements: number
    branches: number
    functions: number
    lines: number
    savedAt: string
}

const baseline = ref<BaselineSnapshot | null>(null)
const coveragePreview = ref<{
    file: FileStats
    fileName: string
    folderPath: string
    impactScore?: number
    complexityScore?: number
    left: number
    top: number
} | null>(null)
const nowTick = ref(Date.now())
let nowTimer: number | null = null

const baselineStorageKey = computed(() => `coverage-report:baseline:${projectRoot || 'default'}`)

watch(baselineStorageKey, () => {
    loadBaseline()
}, { immediate: true })

function setBaseline (): void {
    baseline.value = {
        statements: totals.statements.coveragePercentage,
        branches: totals.branches.coveragePercentage,
        functions: totals.functions.coveragePercentage,
        lines: totals.lines.coveragePercentage,
        savedAt: new Date().toISOString(),
    }
    persistBaseline()
}

function clearBaseline (): void {
    baseline.value = null
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(baselineStorageKey.value)
}

function loadBaseline (): void {
    if (typeof window === 'undefined') return
    try {
        const raw = window.localStorage.getItem(baselineStorageKey.value)
        if (!raw) {
            baseline.value = null
            return
        }
        baseline.value = JSON.parse(raw) as BaselineSnapshot
    } catch {
        baseline.value = null
    }
}

function persistBaseline (): void {
    if (typeof window === 'undefined' || !baseline.value) return
    window.localStorage.setItem(baselineStorageKey.value, JSON.stringify(baseline.value))
}

const deltaChips = computed(() => {
    if (!baseline.value) return [] as Array<{ label: string; delta: number }>
    return [
        { label: 'Statements', delta: totals.statements.coveragePercentage - baseline.value.statements },
        { label: 'Branches', delta: totals.branches.coveragePercentage - baseline.value.branches },
        { label: 'Functions', delta: totals.functions.coveragePercentage - baseline.value.functions },
        { label: 'Lines', delta: totals.lines.coveragePercentage - baseline.value.lines },
    ]
})

const baselineSavedLabel = computed(() => {
    if (!baseline.value?.savedAt) return ''
    void nowTick.value
    const savedAtMs = Date.parse(baseline.value.savedAt)
    if (!Number.isFinite(savedAtMs)) return ''
    const diffMs = Date.now() - savedAtMs
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
})

onMounted(() => {
    if (typeof window === 'undefined') return
    nowTimer = window.setInterval(() => {
        nowTick.value = Date.now()
    }, 60000)
})

onUnmounted(() => {
    if (nowTimer == null || typeof window === 'undefined') return
    window.clearInterval(nowTimer)
    nowTimer = null
})

const treemapEntries = computed(() => {
    const top = topPagesByUntestedImpact.slice(0, 10)
    if (!top.length) return [] as Array<ImpactEntry & { colSpan: number; rowSpan: number; intensity: number; percentShare: number; colorFill: string; colorBorder: string; colorText: string; impactLabel: string }>
    const maxImpact = Math.max(...top.map((entry) => entry.impactScore))
    const totalImpact = top.reduce((sum, entry) => sum + entry.impactScore, 0)
    return top.map((entry) => ({
        ...buildTreemapVisual(entry, maxImpact, totalImpact),
    }))
})

function formatSigned (value: number): string {
    const rounded = Math.round(value * 10) / 10
    if (rounded === 0) return '0.0'
    return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`
}

function formatPercent (value: number): string {
    return `${value.toFixed(1)}%`
}

function sparklinePoints (delta: number): string {
    const base = 10
    const capped = Math.max(-8, Math.min(8, delta))
    const end = base - capped
    return `0,${base} 25,${base} 50,${base} 75,${(base + end) / 2} 100,${end}`
}

function riskLevel (riskScore: number): 'High' | 'Medium' | 'Low' {
    if (riskScore >= 50) return 'High'
    if (riskScore >= 25) return 'Medium'
    return 'Low'
}

function riskBadgeClass (riskScore: number): string {
    const level = riskLevel(riskScore)
    if (level === 'High') return 'border-rose-300/70 text-rose-600 dark:text-rose-400'
    if (level === 'Medium') return 'border-amber-300/70 text-amber-600 dark:text-amber-400'
    return 'border-emerald-300/70 text-emerald-600 dark:text-emerald-400'
}

function buildTreemapVisual (entry: ImpactEntry, maxImpact: number, totalImpact: number) {
    const intensity = maxImpact > 0 ? entry.impactScore / maxImpact : 0
    const clamped = Math.max(0, Math.min(1, intensity))
    const hue = 155 - (147 * clamped) // green -> red
    const alpha = 0.14 + (clamped * 0.30)
    const borderAlpha = 0.35 + (clamped * 0.40)
    const textHue = Math.max(8, hue - 6)
    const impactLabel = clamped >= 0.75 ? 'high' : clamped >= 0.4 ? 'medium' : 'low'

    return {
        path: entry.path,
        relPath: entry.relPath,
        targetFolderPath: entry.targetFolderPath,
        impactScore: entry.impactScore,
        colSpan: Math.max(3, Math.min(12, Math.round(clamped * 12))),
        rowSpan: Math.max(1, Math.min(3, Math.round(clamped * 3))),
        intensity: clamped,
        percentShare: totalImpact > 0 ? (entry.impactScore / totalImpact) * 100 : 0,
        impactLabel,
        colorFill: `linear-gradient(135deg, hsl(${hue} 78% 52% / ${alpha}), rgba(15,23,42,0))`,
        colorBorder: `hsl(${hue} 76% 54% / ${borderAlpha})`,
        colorText: `hsl(${textHue} 82% 62% / 0.92)`,
    }
}

function displayFileName (path: string): string {
    const parts = path.split('/').filter(Boolean)
    return parts[parts.length - 1] ?? path
}

function openCoverageFile (entry: { targetFolderPath: string; relPath: string }): void {
    emit('openCoverageFile', {
        folderPath: entry.targetFolderPath,
        filePath: entry.relPath,
    })
}

const fileStatsByRelPath = computed(() => {
    const map = new Map<string, FileStats>()
    for (const file of insightFiles) map.set(file.relPath, file)
    return map
})

function showCoveragePreview (
    event: MouseEvent,
    entry: { relPath?: string; path?: string; impactScore?: number; complexityScore?: number },
): void {
    let file: FileStats | undefined
    if (entry.relPath) {
        file = fileStatsByRelPath.value.get(entry.relPath)
    }
    if (!file && entry.path) {
        const normalizedPath = entry.path.replace(/^\/+/, '')
        file = insightFiles.find((candidate) =>
            candidate.relPath.endsWith(normalizedPath)
            || candidate.relPath.endsWith(`/${normalizedPath}`),
        )
    }
    if (!file) return
    const fileName = displayFileName(file.relPath)
    const parts = file.relPath.split('/')
    parts.pop()
    const folderPath = parts.join('/')

    const target = event.currentTarget as HTMLElement | null
    const rect = target?.getBoundingClientRect()
    const popoverWidth = 360
    const popoverHeight = 250
    const gap = 12
    if (!rect) return
    let left = rect.right + gap
    if (left + popoverWidth > window.innerWidth - 8) {
        left = Math.max(8, rect.left - popoverWidth - gap)
    }
    const top = Math.min(window.innerHeight - popoverHeight - 8, Math.max(8, rect.top))
    coveragePreview.value = {
        file,
        fileName,
        folderPath,
        impactScore: entry.impactScore,
        complexityScore: entry.complexityScore,
        left,
        top,
    }
}

function hideCoveragePreview (): void {
    coveragePreview.value = null
}
</script>

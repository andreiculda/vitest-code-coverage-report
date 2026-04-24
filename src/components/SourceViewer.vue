<template>
    <div
        v-if="!file"
        class="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm"
    >
        <div class="text-center">
            <div class="text-4xl mb-2">
                📂
            </div>
            <p>Select a file from the tree or list to view its source.</p>
            <p class="mt-2 text-xs">
                Use <span class="kbd">j</span> / <span class="kbd">k</span> to navigate.
            </p>
        </div>
    </div>
    <div
        v-else
        class="h-full flex flex-col min-h-0"
    >
        <div class="panel flex-1 min-h-0 overflow-hidden flex flex-col">
            <div
                v-if="loading"
                class="flex-1 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400"
            >
                Loading source…
            </div>
            <div
                v-else-if="error"
                class="flex-1 p-4 text-sm text-rose-600 dark:text-rose-400"
            >
                <div class="font-semibold mb-1">
                    Could not load source file.
                </div>
                <div class="font-mono text-xs opacity-80">
                    {{ error }}
                </div>
                <div class="mt-2 text-slate-600 dark:text-slate-300">
                    The viewer only loads files that exist under the project root.
                </div>
            </div>
            <div
                v-else
                class="flex-1 overflow-auto font-mono text-[12.5px] leading-5 bg-slate-950 text-slate-200"
            >
                <table class="w-full border-collapse">
                    <tbody>
                        <tr
                            v-for="(line, idx) in sourceLines"
                            :key="idx"
                            :class="hitClass(idx + 1)"
                        >
                            <td
                                class="select-none text-right pr-3 pl-2 py-0 text-slate-500 tabular-nums border-r border-slate-800 w-14"
                            >
                                {{ idx + 1 }}
                            </td>
                            <td
                                class="select-none text-right pr-3 py-0 tabular-nums w-14 whitespace-nowrap text-[13px]"
                                :class="hitTextClass(idx + 1)"
                            >
                                {{ hitText(idx + 1) }}
                            </td>
                            <td class="px-3 py-0 whitespace-pre text-slate-200">
                                <div class="relative">
                                    <span
                                        v-for="(segment, segmentIdx) in lineHighlightRanges(idx + 1, idx)"
                                        :key="`seg-${idx + 1}-${segmentIdx}`"
                                        class="coverage-branch-overlay"
                                        :style="{
                                            left: `${segment.start}ch`,
                                            width: `${Math.max(1, segment.end - segment.start)}ch`,
                                        }"
                                        title="Branch not covered"
                                    />
                                    <CleanHtml
                                        :html="highlightedLines[idx] || '&nbsp;'"
                                        tag="code"
                                        class="hljs !bg-transparent !p-0 whitespace-pre text-inherit"
                                    />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useSource } from '@/composables/useSource'
import type { FileStats } from '@/types'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/common'
import { computed, ref, watch } from 'vue'
import CleanHtml from './CleanHtml.vue'

const {
    file,
} = defineProps<{
    file: FileStats | null
}>()

const { get } = useSource()

const source = ref<string | null>(null)
const sourceLines = computed(() => (source.value ? source.value.split(/\r?\n/) : []))
const loading = ref(false)
const error = ref<string | null>(null)

const sourceLanguage = computed(() => {
    const relPath = file?.relPath.toLowerCase() ?? ''
    if (relPath.endsWith('.vue')) return 'xml'
    if (relPath.endsWith('.ts') || relPath.endsWith('.mts') || relPath.endsWith('.cts')) return 'typescript'
    if (relPath.endsWith('.tsx')) return 'typescript'
    if (relPath.endsWith('.js') || relPath.endsWith('.mjs') || relPath.endsWith('.cjs')) return 'javascript'
    if (relPath.endsWith('.jsx')) return 'javascript'
    if (relPath.endsWith('.json')) return 'json'
    if (relPath.endsWith('.scss')) return 'scss'
    if (relPath.endsWith('.css')) return 'css'
    if (relPath.endsWith('.html')) return 'xml'
    if (relPath.endsWith('.md')) return 'markdown'
    return null
})

const highlightedLines = computed(() => {
    if (!source.value) return [] as string[]
    try {
        const highlighted = sourceLanguage.value && hljs.getLanguage(sourceLanguage.value)
            ? hljs.highlight(source.value, {
                language: sourceLanguage.value,
                ignoreIllegals: true,
            }).value
            : hljs.highlightAuto(source.value).value
        const sanitized = DOMPurify.sanitize(highlighted, {
            ALLOWED_TAGS: ['span'],
            ALLOWED_ATTR: ['class'],
        })
        return sanitized.split(/\r?\n/)
    } catch {
        return sourceLines.value.map((line) => escapeHtml(line))
    }
})

watch(
    () => file?.relPath ?? null,
    async (relPath) => {
        if (!relPath) {
            source.value = null
            return
        }
        source.value = null
        error.value = null
        loading.value = true
        try {
            source.value = await get(relPath)
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err)
        } finally {
            loading.value = false
        }
    },
    { immediate: true },
)

function hitClass (lineNo: number): string {
    if (!file) return ''
    const hits = file.lineHits.get(lineNo)
    const hasUncoveredBranch = (file.uncoveredBranchMarkersByLine.get(lineNo) ?? []).length > 0
    if (hits === 0) return 'bg-rose-500/15 border-l-2 border-rose-500'
    if (hasUncoveredBranch) return 'bg-amber-400/10 border-l-2 border-amber-400'
    if (hits === undefined) return ''
    return 'bg-emerald-500/10 border-l-2 border-emerald-500'
}

function hitText (lineNo: number): string {
    if (!file) return ''
    const hits = file.lineHits.get(lineNo)
    if (hits === undefined) return ''
    if (hits === 0) return '0×'
    if (hits > 9999) return `${Math.round(hits / 1000)}k×`
    return `${hits}×`
}

function hitTextClass (lineNo: number): string {
    if (!file) return ''
    const hits = file.lineHits.get(lineNo)
    if (hits === undefined) return 'text-slate-500'
    if (hits === 0) return 'text-rose-500 font-bold'
    return 'text-emerald-400 font-semibold'
}

function escapeHtml (value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function lineHighlightRanges (lineNo: number, idx: number): Array<{ start: number; end: number }> {
    const line = sourceLines.value[idx] ?? ''
    if (!line) return []
    const markers = file?.uncoveredBranchMarkersByLine.get(lineNo) ?? []
    const rangesFromMarkers = markerRangesForLine(lineNo, markers)
    const rangesFromCoverage = rangesFromMarkers.length ? [] : coverageRangesForLine(lineNo, line)
    const ranges = rangesFromCoverage.length ? rangesFromCoverage : rangesFromMarkers
    if (!ranges.length) return []

    const lineLength = line.length
    const normalizedRanges = ranges
        .map((range) => {
            const start = Math.max(0, Math.min(lineLength, range.start))
            const endRaw = range.end === Number.MAX_SAFE_INTEGER ? lineLength : range.end
            const end = Math.max(start + 1, Math.min(lineLength, endRaw))
            return { start, end }
        })
        .sort((a, b) => a.start - b.start || a.end - b.end)

    const merged: Array<{ start: number; end: number }> = []
    for (const range of normalizedRanges) {
        const last = merged[merged.length - 1]
        if (!last || range.start > last.end) {
            merged.push({ ...range })
            continue
        }
        last.end = Math.max(last.end, range.end)
    }
    return merged
}

function coverageRangesForLine (lineNo: number, line: string): Array<{ start: number; end: number }> {
    if (isNonBranchDirectiveLine(line)) return []
    const rawRanges = file?.uncoveredBranchRangesByLine.get(lineNo) ?? []
    if (!rawRanges.length) return []
    const lineLength = line.length
    const maxSpan = Math.max(3, Math.floor(lineLength * 0.25))

    return rawRanges
        .map((range) => {
            const start = Math.max(0, Math.min(lineLength, range.start))
            const endRaw = range.end === Number.MAX_SAFE_INTEGER ? lineLength : range.end
            const end = Math.max(start + 1, Math.min(lineLength, endRaw))
            return { start, end }
        })
        .map((range) => {
            const span = range.end - range.start
            if (span <= maxSpan) return range
            const focused = focusRangeAroundBranchToken(line, range.start, range.end)
            return focused ?? range
        })
        .filter((range) => {
            const span = range.end - range.start
            if (span <= maxSpan) return true
            const text = line.slice(range.start, range.end)
            return /(\?|&&|\|\||\bif\b|\belse\b)/.test(text)
        })
}

function isNonBranchDirectiveLine (line: string): boolean {
    const trimmed = line.trim()
    if (!trimmed.startsWith('v-')) return false
    return !/^v-(if|else-if|else)\b/.test(trimmed)
}

function markerRangesForLine (lineNo: number, markers: Array<{ column: number }>): Array<{ start: number; end: number }> {
    if (!markers.length) return []
    const sourceLine = sourceLines.value[lineNo - 1] ?? ''
    if (!sourceLine.length) return []

    return markers
        .map((marker) => {
            const start = nearestVisibleCharIndex(sourceLine, marker.column)
            const isBranchSymbol = isBranchSymbolAt(sourceLine, start)
            const ifConditionRange = vueIfConditionRange(sourceLine)
            if (!isBranchSymbol && ifConditionRange) {
                return ifConditionRange
            }
            if (!isBranchSymbol) {
                const nearbyIdentifier = nearestIdentifierRange(sourceLine, start)
                if (!nearbyIdentifier) return null
                if (!isComparisonOperatorAt(sourceLine, start)) return null
                return nearbyIdentifier
            }

            const identifierRange = nearestIdentifierRange(sourceLine, start)
            if (identifierRange) return identifierRange
            const pair = sourceLine.slice(start, start + 2)
            const end = pair === '&&' || pair === '||'
                ? Math.min(sourceLine.length, start + 2)
                : Math.min(sourceLine.length, start + 1)
            return { start, end }
        })
        .filter((range): range is { start: number; end: number } => range != null)
}

function focusRangeAroundBranchToken (
    line: string,
    start: number,
    end: number,
): { start: number; end: number } | null {
    const slice = line.slice(start, end)
    if (!slice) return null
    const tokenMatch = slice.match(/&&|\|\||\?|\bif\b|\belse\b/)
    if (!tokenMatch || tokenMatch.index == null) return null
    const tokenStart = start + tokenMatch.index
    const tokenLength = tokenMatch[0].length
    return { start: tokenStart, end: tokenStart + tokenLength }
}

function isBranchSymbolAt (line: string, index: number): boolean {
    const pair = line.slice(index, index + 2)
    if (pair === '&&' || pair === '||') return true
    if (line[index] === '?') return true
    if (isInsideVueIfCondition(line, index)) return true
    const tail = line.slice(index)
    return /^\b(if|else)\b/.test(tail)
}

function isInsideVueIfCondition (line: string, index: number): boolean {
    const range = vueIfConditionRange(line)
    if (!range) return false
    return index >= range.start && index < range.end
}

function vueIfConditionRange (line: string): { start: number; end: number } | null {
    const directiveMatch = line.match(/v-(if|else-if)\s*=\s*(["'])([^"']+)\2/)
    if (!directiveMatch || directiveMatch.index == null) return null
    const full = directiveMatch[0]
    const fullStart = directiveMatch.index
    const conditionStartInMatch = full.search(/["']/) + 1
    const conditionEndInMatch = full.lastIndexOf(full[conditionStartInMatch - 1])
    if (conditionStartInMatch <= 0 || conditionEndInMatch <= conditionStartInMatch) return null
    const start = fullStart + conditionStartInMatch
    const end = fullStart + conditionEndInMatch
    if (start >= end) return null
    return { start, end }
}

function nearestVisibleCharIndex (line: string, markerColumn: number): number {
    if (!line.length) return 0
    const clamped = Math.max(0, Math.min(line.length - 1, markerColumn))
    if (!/\s/.test(line[clamped])) return clamped

    let right = clamped + 1
    while (right < line.length) {
        if (!/\s/.test(line[right])) return right
        right++
    }

    let left = clamped - 1
    while (left >= 0) {
        if (!/\s/.test(line[left])) return left
        left--
    }

    return clamped
}

function nearestIdentifierRange (line: string, start: number): { start: number; end: number } | null {
    const maxDistance = 18
    const direct = identifierRangeAt(line, start)
    if (direct) return direct
    for (let distance = 1; distance <= maxDistance; distance++) {
        const right = start + distance
        if (right < line.length) {
            const rightRange = identifierRangeAt(line, right)
            if (rightRange) return rightRange
        }
        const left = start - distance
        if (left >= 0) {
            const leftRange = identifierRangeAt(line, left)
            if (leftRange) return leftRange
        }
    }
    return null
}

function identifierRangeAt (line: string, index: number): { start: number; end: number } | null {
    const char = line[index]
    if (!char || !/[A-Za-z0-9_$]/.test(char)) return null
    let start = index
    let end = index + 1
    while (start > 0 && /[A-Za-z0-9_$]/.test(line[start - 1])) start--
    while (end < line.length && /[A-Za-z0-9_$]/.test(line[end])) end++
    return { start, end }
}

function isComparisonOperatorAt (line: string, index: number): boolean {
    const pair = line.slice(index, index + 2)
    if (['<=', '>=', '==', '!='].includes(pair)) return true
    return ['<', '>', '=', '!'].includes(line[index] ?? '')
}
</script>

<style scoped>
.coverage-branch-overlay {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 1.15em;
    pointer-events: auto;
    background-color: rgb(251 191 36 / 0.18);
    border-radius: 2px;
    border-bottom: 2px solid rgb(251 191 36 / 0.95);
    z-index: 1;
    cursor: help;
}
</style>

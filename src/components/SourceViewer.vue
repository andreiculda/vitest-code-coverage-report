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
                                        v-for="(marker, markerIdx) in lineMarkers.get(idx + 1) ?? []"
                                        :key="`mk-inline-${idx + 1}-${markerIdx}`"
                                        class="coverage-inline-marker"
                                        :style="{ left: `${markerLeftCh(marker)}ch` }"
                                        :title="markerTooltip(marker)"
                                    >
                                        {{ marker.label }}
                                    </span>
                                    <span
                                        v-for="(segment, segmentIdx) in lineHighlightRanges(idx + 1, idx)"
                                        :key="`seg-${idx + 1}-${segmentIdx}`"
                                        :class="overlayClass(segment.kind)"
                                        :style="{
                                            left: `${segment.start}ch`,
                                            width: `${Math.max(1, segment.end - segment.start)}ch`,
                                        }"
                                        :title="segment.tooltip"
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
import type { BranchMarker, FileStats } from '@/types'
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

const lineMarkers = computed(() => {
    const markers = new Map<number, BranchMarker[]>()
    if (!file) return markers
    for (let idx = 0; idx < sourceLines.value.length; idx++) {
        const lineNo = idx + 1
        const explicit = file.uncoveredBranchMarkersByLine.get(lineNo) ?? []
        // Match Istanbul-like marker behavior: only show IF/ELSE path markers.
        const next = explicit
            .filter((marker) => marker.label === 'I' || marker.label === 'E')
            .sort((a, b) => a.column - b.column)
        markers.set(lineNo, next)
    }
    return markers
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
    const hasUncoveredBranchRange = (file.uncoveredBranchRangesByLine.get(lineNo) ?? []).length > 0
    if (hits === 0) return 'bg-rose-500/15 border-l-2 border-rose-500'
    if (hasUncoveredBranchRange) return 'bg-amber-400/10 border-l-2 border-amber-400'
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

interface LineOverlaySegment {
    start: number
    end: number
    kind: 'branch' | 'if' | 'else' | 'function'
    tooltip: string
}

function lineHighlightRanges (lineNo: number, idx: number): LineOverlaySegment[] {
    const line = sourceLines.value[idx] ?? ''
    if (!line) return []
    const ranges = coverageRangesForLine(lineNo, line)
    if (!ranges.length) return []

    const lineLength = line.length
    const normalizedRanges = ranges
        .map((range) => {
            const start = Math.max(0, Math.min(lineLength, range.start))
            const endRaw = range.end === Number.MAX_SAFE_INTEGER ? lineLength : range.end
            const end = Math.max(start + 1, Math.min(lineLength, endRaw))
            return {
                start,
                end,
                kind: range.kind,
                tooltip: range.tooltip,
            }
        })
        .sort((a, b) => a.start - b.start || a.end - b.end)

    const merged: LineOverlaySegment[] = []
    for (const range of normalizedRanges) {
        const last = merged[merged.length - 1]
        if (!last || range.start > last.end || range.kind !== last.kind) {
            merged.push({ ...range })
            continue
        }
        last.end = Math.max(last.end, range.end)
    }
    return merged
}

function coverageRangesForLine (lineNo: number, line: string): LineOverlaySegment[] {
    const rawBranchRanges = file?.uncoveredBranchRangesByLine.get(lineNo) ?? []
    const rawFunctionRanges = file?.uncoveredFunctionRangesByLine.get(lineNo) ?? []
    if (!rawBranchRanges.length && !rawFunctionRanges.length) return []

    const markerLabels = (file?.uncoveredBranchMarkersByLine.get(lineNo) ?? []).map((marker) => marker.label)
    const hasIfElsePathMarker = markerLabels.includes('I') || markerLabels.includes('E')
    if (hasIfElsePathMarker && jsIfConditionRange(line)) {
        // Istanbul-like behavior: keep IF/ELSE badge on condition line,
        // but avoid drawing generic branch overlay on the same condition.
        return []
    }

    const lineLength = line.length
    const maxSpan = Math.max(3, Math.floor(lineLength * 0.25))

    const branchRanges = rawBranchRanges
        .map((range) => {
            const start = Math.max(0, Math.min(lineLength, range.start))
            const endRaw = range.end === Number.MAX_SAFE_INTEGER ? lineLength : range.end
            const end = Math.max(start + 1, Math.min(lineLength, endRaw))
            return {
                start,
                end,
                kind: 'branch' as const,
                tooltip: 'Branch not covered',
            }
        })
        .map((range) => {
            const vueTailRange = vueBranchTailRange(line, range.start, range.end)
            if (vueTailRange) {
                return {
                    ...vueTailRange,
                    kind: range.kind,
                    tooltip: range.tooltip,
                }
            }
            const bindingFocused = clampToVueBindingExpression(line, range.start, range.end)
            if (bindingFocused) {
                return {
                    ...bindingFocused,
                    kind: range.kind,
                    tooltip: range.tooltip,
                }
            }
            const quotedLiteral = quotedLiteralRangeAround(line, range.start, range.end)
            if (quotedLiteral) {
                return {
                    ...quotedLiteral,
                    kind: range.kind,
                    tooltip: range.tooltip,
                }
            }
            const span = range.end - range.start
            if (span <= maxSpan) return range
            const focused = focusRangeAroundBranchToken(line, range.start, range.end)
            if (!focused) {
                const tailFocused = focusRangeNearEnd(line, range.start, range.end)
                if (!tailFocused) return range
                return {
                    ...tailFocused,
                    kind: range.kind,
                    tooltip: range.tooltip,
                }
            }
            return {
                ...focused,
                kind: range.kind,
                tooltip: range.tooltip,
            }
        })

    const functionRanges = rawFunctionRanges
        .map((range) => {
            const start = Math.max(0, Math.min(lineLength, range.start))
            const endRaw = range.end === Number.MAX_SAFE_INTEGER ? lineLength : range.end
            const end = Math.max(start + 1, Math.min(lineLength, endRaw))
            return {
                start,
                end,
                kind: 'function' as const,
                tooltip: 'Function not covered',
            }
        })
        .map((range) => {
            const functionFocused = focusFunctionExpressionRange(line, range.start, range.end)
            if (functionFocused) {
                return {
                    ...functionFocused,
                    kind: range.kind,
                    tooltip: range.tooltip,
                }
            }
            const bindingFocused = clampToVueBindingExpression(line, range.start, range.end)
            if (bindingFocused) {
                return {
                    ...bindingFocused,
                    kind: range.kind,
                    tooltip: range.tooltip,
                }
            }
            return range
        })

    return [...branchRanges, ...functionRanges]
}

function quotedLiteralRangeAround (line: string, start: number, end: number): { start: number; end: number } | null {
    const leftBound = Math.max(0, Math.min(line.length - 1, start))
    const rightBound = Math.max(0, Math.min(line.length - 1, Math.max(start, end - 1)))
    const probe = [leftBound, rightBound]
    for (const index of probe) {
        const range = quotedLiteralAt(line, index)
        if (range) return range
    }
    return null
}

function quotedLiteralAt (line: string, index: number): { start: number; end: number } | null {
    const isQuote = (ch: string): boolean => ch === '\'' || ch === '"'
    for (let i = index; i >= 0; i--) {
        const ch = line[i]
        if (!isQuote(ch) || (i > 0 && line[i - 1] === '\\')) continue
        const quote = ch
        for (let j = i + 1; j < line.length; j++) {
            if (line[j] === quote && line[j - 1] !== '\\') {
                if (index >= i && index < j) return { start: i, end: j + 1 }
                return null
            }
        }
        return null
    }
    return null
}

function focusFunctionExpressionRange (line: string, start: number, end: number): { start: number; end: number } | null {
    const exprRange = vueBindingExpressionRange(line, start, end)
    const searchStart = exprRange?.start ?? start
    const searchEnd = exprRange?.end ?? end
    const slice = line.slice(searchStart, searchEnd)
    if (!slice) return null

    const callRegex = /[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*\(/g
    let match: RegExpExecArray | null = null
    const target = Math.max(searchStart, Math.min(searchEnd, start))
    let best: { distance: number; start: number; end: number } | null = null

    while ((match = callRegex.exec(slice)) !== null) {
        if (match.index == null) continue
        const callStart = searchStart + match.index
        const openParenInMatch = match[0].lastIndexOf('(')
        if (openParenInMatch < 0) continue
        const openParen = callStart + openParenInMatch
        const closeParen = findMatchingParen(line, openParen)
        if (closeParen == null) continue
        const callEnd = Math.min(line.length, closeParen + 1)
        const distance = Math.abs(callStart - target)
        if (!best || distance < best.distance) {
            best = { distance, start: callStart, end: callEnd }
        }
    }
    if (best) return { start: best.start, end: best.end }

    return focusNonCallExpressionRange(line, start, end)
}

function focusNonCallExpressionRange (line: string, start: number, end: number): { start: number; end: number } | null {
    const exprRange = vueBindingExpressionRange(line, start, end)
    const searchStart = exprRange?.start ?? start
    const searchEnd = exprRange?.end ?? end
    if (searchStart >= searchEnd) return null

    let anchor = Math.max(searchStart, Math.min(searchEnd - 1, start))
    while (anchor < searchEnd && /\s/.test(line[anchor])) anchor++
    if (anchor >= searchEnd) anchor = Math.max(searchStart, Math.min(searchEnd - 1, end - 1))
    while (anchor > searchStart && /\s/.test(line[anchor])) anchor--

    const isExprChar = (ch: string): boolean => /[A-Za-z0-9_$.[\]]/.test(ch)
    if (!isExprChar(line[anchor] ?? '')) {
        let found = -1
        for (let i = searchStart; i < searchEnd; i++) {
            if (isExprChar(line[i] ?? '')) {
                found = i
                break
            }
        }
        if (found < 0) return null
        anchor = found
    }

    let left = anchor
    while (left > searchStart && isExprChar(line[left - 1] ?? '')) left--
    let right = anchor + 1
    while (right < searchEnd && isExprChar(line[right] ?? '')) right++
    if (right <= left) return null
    return { start: left, end: right }
}

function findMatchingParen (line: string, openParenIndex: number): number | null {
    if (openParenIndex < 0 || openParenIndex >= line.length || line[openParenIndex] !== '(') return null
    let depth = 0
    let quote: '"' | '\'' | null = null
    for (let i = openParenIndex; i < line.length; i++) {
        const ch = line[i]
        const prev = i > 0 ? line[i - 1] : ''
        if (quote) {
            if (ch === quote && prev !== '\\') quote = null
            continue
        }
        if ((ch === '"' || ch === '\'') && prev !== '\\') {
            quote = ch
            continue
        }
        if (ch === '(') {
            depth++
            continue
        }
        if (ch === ')') {
            depth--
            if (depth === 0) return i
        }
    }
    return null
}

function markerRangesForLine (lineNo: number, markers: BranchMarker[]): LineOverlaySegment[] {
    if (!markers.length) return []
    const sourceLine = sourceLines.value[lineNo - 1] ?? ''
    if (!sourceLine.length) return []

    return markers
        .map((marker) => {
            const start = nearestVisibleCharIndex(sourceLine, marker.column)
            const isBranchSymbol = isBranchSymbolAt(sourceLine, start)
            const ifConditionRange = vueIfConditionRange(sourceLine)
            const jsConditionRange = jsIfConditionRange(sourceLine)
            const kind = marker.label === 'I' ? 'if' : marker.label === 'E' ? 'else' : 'branch'
            const tooltip = marker.label === 'I'
                ? 'IF path not taken'
                : marker.label === 'E'
                    ? 'ELSE path not taken'
                    : 'Branch not covered'
            if (!isBranchSymbol && ifConditionRange) {
                return { ...ifConditionRange, kind, tooltip }
            }
            if (!isBranchSymbol && (marker.label === 'I' || marker.label === 'E') && jsConditionRange) {
                return { ...jsConditionRange, kind, tooltip }
            }
            if (!isBranchSymbol) {
                const nearbyIdentifier = nearestIdentifierRange(sourceLine, start)
                if (!nearbyIdentifier) return null
                if (!isComparisonOperatorAt(sourceLine, start)) return null
                return { ...nearbyIdentifier, kind, tooltip }
            }

            const identifierRange = nearestIdentifierRange(sourceLine, start)
            if (identifierRange) return { ...identifierRange, kind, tooltip }
            const pair = sourceLine.slice(start, start + 2)
            const end = pair === '&&' || pair === '||'
                ? Math.min(sourceLine.length, start + 2)
                : Math.min(sourceLine.length, start + 1)
            return { start, end, kind, tooltip }
        })
        .filter((range): range is LineOverlaySegment => range != null)
}

function focusRangeAroundBranchToken (
    line: string,
    start: number,
    end: number,
): { start: number; end: number } | null {
    const slice = line.slice(start, end)
    if (!slice) return null
    const tokenRegex = /&&|\|\||\?|\bif\b|\belse\b/g
    let tokenMatch: RegExpExecArray | null = null
    let lastMatch: RegExpExecArray | null = null
    while ((tokenMatch = tokenRegex.exec(slice)) !== null) {
        lastMatch = tokenMatch
    }
    if (!lastMatch || lastMatch.index == null) return null
    const tokenStart = start + lastMatch.index
    const token = lastMatch[0]
    const tokenLength = token.length
    if (token === '&&' || token === '||') {
        const rhsRange = logicalRightOperandRange(line, tokenStart + tokenLength)
        if (rhsRange) return rhsRange
    }
    return { start: tokenStart, end: tokenStart + tokenLength }
}

function logicalRightOperandRange (line: string, startIndex: number): { start: number; end: number } | null {
    let start = startIndex
    while (start < line.length && /\s/.test(line[start])) start++
    if (start >= line.length) return null

    let end = start
    let depth = 0
    while (end < line.length) {
        const pair = line.slice(end, end + 2)
        const ch = line[end]

        if (ch === '(') {
            depth++
            end++
            continue
        }
        if (ch === ')') {
            if (depth === 0) break
            depth--
            end++
            continue
        }
        if (depth === 0 && (pair === '&&' || pair === '||' || ch === '?' || ch === ':')) {
            break
        }
        end++
    }

    while (end > start && /\s/.test(line[end - 1])) end--
    if (end <= start) return null
    return { start, end }
}

function focusRangeNearEnd (line: string, start: number, end: number): { start: number; end: number } | null {
    let trimmedEnd = Math.max(start + 1, Math.min(line.length, end))
    while (trimmedEnd > start && /\s/.test(line[trimmedEnd - 1])) trimmedEnd--
    if (trimmedEnd <= start) return null

    // Keep fallback tight: mimic Istanbul's small tail spans on non-token branches.
    const fallbackWidth = 14
    const fallbackStart = Math.max(start, trimmedEnd - fallbackWidth)
    let firstVisible = fallbackStart
    while (firstVisible < trimmedEnd && /\s/.test(line[firstVisible])) firstVisible++
    if (firstVisible >= trimmedEnd) return null
    return { start: firstVisible, end: trimmedEnd }
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

function jsIfConditionRange (line: string): { start: number; end: number } | null {
    const match = line.match(/\bif\s*\((.+)\)/)
    if (!match || match.index == null) return null
    const full = match[0]
    const fullStart = match.index
    const openIdx = full.indexOf('(')
    const closeIdx = full.lastIndexOf(')')
    if (openIdx === -1 || closeIdx <= openIdx + 1) return null
    return {
        start: fullStart + openIdx + 1,
        end: fullStart + closeIdx,
    }
}

function vueBindingExpressionRange (
    line: string,
    rangeStartHint?: number,
    rangeEndHint?: number,
): { start: number; end: number } | null {
    const bindingRegex = /(?:v-[\w-]+|:[\w-]+)\s*=\s*(["'])/g
    const ranges: Array<{ start: number; end: number }> = []
    let match: RegExpExecArray | null = null

    while ((match = bindingRegex.exec(line)) !== null) {
        if (match.index == null) continue
        const quoteChar = match[1]
        const quotePosInMatch = match[0].lastIndexOf(quoteChar)
        if (quotePosInMatch < 0) continue
        const openingQuoteIndex = match.index + quotePosInMatch
        const expressionStart = openingQuoteIndex + 1
        let expressionEnd = -1
        for (let i = expressionStart; i < line.length; i++) {
            if (line[i] === quoteChar && line[i - 1] !== '\\') {
                expressionEnd = i
                break
            }
        }
        if (expressionEnd > expressionStart) {
            ranges.push({ start: expressionStart, end: expressionEnd })
        }
    }

    if (!ranges.length) return null
    if (rangeStartHint == null || rangeEndHint == null) return ranges[0]

    const overlapping = ranges.find((range) => rangeStartHint < range.end && rangeEndHint > range.start)
    return overlapping ?? ranges[0]
}

function clampToVueBindingExpression (
    line: string,
    start: number,
    end: number,
): { start: number; end: number } | null {
    const exprRange = vueBindingExpressionRange(line, start, end)
    if (!exprRange) return null
    const overlaps = start < exprRange.end && end > exprRange.start
    if (!overlaps) return null
    const clampedStart = Math.max(start, exprRange.start)
    const clampedEnd = Math.max(clampedStart + 1, Math.min(end, exprRange.end))
    return { start: clampedStart, end: clampedEnd }
}

function vueBranchTailRange (line: string, start: number, end: number): { start: number; end: number } | null {
    const exprRange = vueBindingExpressionRange(line, start, end)
    if (!exprRange) return null
    const overlaps = start < exprRange.end && end > exprRange.start
    if (!overlaps) return null

    const exprText = line.slice(exprRange.start, exprRange.end)
    const branchTokenRegex = /&&|\|\||\?|\bif\b|\belse\b/g
    let match: RegExpExecArray | null = null
    let lastMatch: RegExpExecArray | null = null
    while ((match = branchTokenRegex.exec(exprText)) !== null) {
        lastMatch = match
    }
    if (!lastMatch || lastMatch.index == null) return null

    const token = lastMatch[0]
    let tailStart = exprRange.start + lastMatch.index
    if ((token === '&&' || token === '||') && tailStart > exprRange.start && /\s/.test(line[tailStart - 1])) {
        tailStart -= 1
    }

    let tailEnd = exprRange.end
    const closingQuoteIndex = exprRange.end
    if (closingQuoteIndex < line.length && (line[closingQuoteIndex] === '"' || line[closingQuoteIndex] === '\'')) {
        tailEnd = closingQuoteIndex + 1
    }
    return { start: tailStart, end: Math.max(tailStart + 1, tailEnd) }
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

function markerTooltip (marker: BranchMarker): string {
    if (marker.label === 'I') return 'IF path not taken'
    if (marker.label === 'E') return 'ELSE path not taken'
    return `Uncovered branch: ${marker.label}`
}

function markerLeftCh (marker: BranchMarker): number {
    const label = marker.label
    const estimatedLabelWidth = (label.length * 0.64) + 0.5
    return Math.max(0, marker.column - estimatedLabelWidth)
}

function overlayClass (kind: LineOverlaySegment['kind']): string {
    if (kind === 'if') return 'coverage-overlay coverage-overlay-if'
    if (kind === 'else') return 'coverage-overlay coverage-overlay-else'
    if (kind === 'function') return 'coverage-overlay coverage-overlay-function'
    return 'coverage-overlay coverage-overlay-branch'
}
</script>

<style scoped>
.coverage-overlay {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 1.15em;
    pointer-events: auto;
    border-radius: 2px;
    z-index: 1;
    cursor: help;
}

.coverage-inline-marker {
    position: absolute;
    top: 50%;
    transform: translateY(-54%);
    font-size: 0.60rem;
    line-height: 1;
    font-weight: 800;
    letter-spacing: 0.02em;
    padding: 0.05rem 0.22rem;
    border-radius: 2px;
    background-color: rgb(250 204 21 / 0.90);
    color: rgb(17 24 39 / 0.98);
    box-shadow: 0 0 0 1px rgb(15 23 42 / 0.65);
    pointer-events: auto;
    cursor: help;
    z-index: 3;
}

.coverage-overlay-branch {
    background-color: rgb(250 204 21 / 0.36);
}

.coverage-overlay-if {
    background-color: rgb(244 63 94 / 0.16);
}

.coverage-overlay-else {
    background-color: rgb(251 113 133 / 0.16);
}

.coverage-overlay-function {
    background-color: rgb(251 113 133 / 0.24);
}
</style>

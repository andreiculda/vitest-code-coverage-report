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
                                <div class="relative pl-12">
                                    <div
                                        v-if="(lineMarkers.get(idx + 1) ?? []).length"
                                        class="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-1"
                                    >
                                        <span
                                            v-for="(marker, markerIdx) in lineMarkers.get(idx + 1) ?? []"
                                            :key="`m-${markerIdx}`"
                                            class="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded text-[10px] leading-none font-bold align-middle bg-amber-300/75 text-amber-900 dark:bg-amber-500/40 dark:text-amber-200"
                                            :title="markerTooltip(marker)"
                                        >
                                            {{ markerDisplayLabel(marker) }}
                                        </span>
                                    </div>
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
        const values = file.uncoveredBranchMarkersByLine.get(lineNo) ?? []
        markers.set(
            lineNo,
            [...values].sort((a, b) => a.column - b.column),
        )
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
    if (hits === undefined) return ''
    if (hits === 0) return 'bg-rose-500/15 border-l-2 border-rose-500'
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

function markerDisplayLabel (marker: BranchMarker): string {
    if (marker.label === 'I') return 'IF'
    if (marker.label === 'E') return 'ELSE'
    return marker.label
}

function markerTooltip (marker: BranchMarker): string {
    if (marker.label === 'I') {
        return 'IF path not taken: condition never evaluated to true in covered tests.'
    }
    if (marker.label === 'E') {
        return 'ELSE path not taken: condition never evaluated to false in covered tests.'
    }
    return `Uncovered branch path: ${marker.label}`
}
</script>

<template>
    <div class="flex items-center gap-3 text-xs">
        <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
            <span class="text-slate-600 dark:text-slate-300">≥</span>
            <input
                type="number"
                min="0"
                max="100"
                :value="thresholds.good"
                class="w-14 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 tabular-nums"
                @change="clampGood"
            >
        </div>
        <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-amber-500" />
            <span class="text-slate-600 dark:text-slate-300">≥</span>
            <input
                type="number"
                min="0"
                max="100"
                :value="thresholds.warning"
                class="w-14 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 tabular-nums"
                @change="clampWarning"
            >
        </div>
        <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-rose-500" />
            <span class="text-slate-600 dark:text-slate-300">below warning</span>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useThresholds } from '@/composables/useThresholds'

const { thresholds } = useThresholds()

function clampGood (event: Event): void {
    const input = event.target as HTMLInputElement
    let v = Number(input.value)
    if (!Number.isFinite(v)) v = thresholds.value.good
    v = Math.max(0, Math.min(100, v))
    if (v < thresholds.value.warning) v = thresholds.value.warning
    thresholds.value = { ...thresholds.value, good: v }
}
function clampWarning (event: Event): void {
    const input = event.target as HTMLInputElement
    let v = Number(input.value)
    if (!Number.isFinite(v)) v = thresholds.value.warning
    v = Math.max(0, Math.min(100, v))
    if (v > thresholds.value.good) v = thresholds.value.good
    thresholds.value = { ...thresholds.value, warning: v }
}
</script>

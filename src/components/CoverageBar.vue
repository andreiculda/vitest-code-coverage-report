<template>
    <div class="grid grid-cols-[minmax(0,1fr),auto] items-center gap-2 min-w-0">
        <div
            class="flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
            :class="heightCls"
        >
            <div
                class="h-full transition-all duration-300"
                :class="bgFor(coveragePercentage)"
                :style="{ width }"
            />
        </div>
        <span
            v-if="showText"
            class="w-[108px] text-right tabular-nums text-xs font-semibold whitespace-nowrap"
            :class="colorFor(coveragePercentage)"
        >
            {{ coveragePercentage.toFixed(1) }}%<span
                v-if="covered !== undefined && total !== undefined"
                class="ml-1 inline-block w-[52px] text-left text-[10px] font-normal text-slate-500 dark:text-slate-400"
            >
                ({{ covered }}/{{ total }})
            </span>
        </span>
    </div>
</template>
<script setup lang="ts">
import { useThresholds } from '@/composables/useThresholds'
import { computed } from 'vue'

const {
    coveragePercentage,
    covered,
    total,
    showText = true,
    size = 'md',
} = defineProps<{
    /** Coverage percentage in range 0-100. */
    coveragePercentage: number
    covered?: number
    total?: number
    showText?: boolean
    size?: 'sm' | 'md'
}>()

const { bgFor, colorFor } = useThresholds()

const width = computed(() => {
    const p = Math.max(0, Math.min(100, coveragePercentage))
    return `${p.toFixed(1)}%`
})

const heightCls = computed(() => (size === 'sm' ? 'h-1.5' : 'h-2'))
</script>

<template>
    <div class="flex flex-col items-center gap-1">
        <div
            class="relative"
            :style="{ width: `${size}px`, height: `${size}px` }"
        >
            <svg
                :width="size"
                :height="size"
                class="-rotate-90"
            >
                <circle
                    class="stroke-slate-200 dark:stroke-slate-700"
                    :cx="size / 2"
                    :cy="size / 2"
                    :r="radius"
                    :stroke-width="stroke"
                    fill="none"
                />
                <circle
                    :class="strokeClass"
                    :cx="size / 2"
                    :cy="size / 2"
                    :r="radius"
                    :stroke-width="stroke"
                    fill="none"
                    stroke-linecap="round"
                    :stroke-dasharray="circumference"
                    :stroke-dashoffset="dashOffset"
                    class="transition-[stroke-dashoffset] duration-500"
                />
            </svg>
            <div
                class="absolute inset-0 flex flex-col items-center justify-center"
                :class="colorFor(coveragePercentage)"
            >
                <span class="text-xl font-semibold tabular-nums">{{ coveragePercentage.toFixed(1) }}%</span>
                <span class="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {{ covered }}/{{ total }}
                </span>
            </div>
        </div>
        <span class="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {{ label }}
        </span>
    </div>
</template>
<script setup lang="ts">
import { useThresholds } from '@/composables/useThresholds'
import { computed } from 'vue'

const {
    coveragePercentage,
    label,
    covered,
    total,
    size = 108,
} = defineProps<{
    coveragePercentage: number
    label: string
    covered: number
    total: number
    size?: number
}>()

const { colorFor, classify } = useThresholds()

const stroke = 10
const radius = computed(() => (size - stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => {
    const pct = Math.max(0, Math.min(100, coveragePercentage))
    return circumference.value * (1 - pct / 100)
})

const strokeClass = computed(() => {
    const kind = classify(coveragePercentage)
    if (kind === 'good') return 'stroke-emerald-500'
    if (kind === 'warning') return 'stroke-amber-500'
    return 'stroke-rose-500'
})

</script>

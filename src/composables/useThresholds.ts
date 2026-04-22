import { ref, watch } from 'vue'
import type { Thresholds } from '@/types'

const STORAGE_KEY = 'cov-thresholds'
const DEFAULT: Thresholds = { good: 80, warning: 50 }

function load(): Thresholds {
    if (typeof window === 'undefined') return DEFAULT
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT
        const parsed = JSON.parse(raw) as Partial<Thresholds>
        return {
            good: typeof parsed.good === 'number' ? parsed.good : DEFAULT.good,
            warning: typeof parsed.warning === 'number' ? parsed.warning : DEFAULT.warning,
        }
    } catch {
        return DEFAULT
    }
}

const thresholds = ref<Thresholds>(load())

watch(
    thresholds,
    (value) => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
)

export function useThresholds() {
    function classify(coveragePercentage: number): 'good' | 'warning' | 'bad' {
        if (coveragePercentage >= thresholds.value.good) return 'good'
        if (coveragePercentage >= thresholds.value.warning) return 'warning'
        return 'bad'
    }
    function colorFor(coveragePercentage: number): string {
        const kind = classify(coveragePercentage)
        if (kind === 'good') return 'text-cov-hit'
        if (kind === 'warning') return 'text-cov-partial'
        return 'text-cov-miss'
    }
    function bgFor(coveragePercentage: number): string {
        const kind = classify(coveragePercentage)
        if (kind === 'good') return 'bg-emerald-500'
        if (kind === 'warning') return 'bg-amber-500'
        return 'bg-rose-500'
    }
    return { thresholds, classify, colorFor, bgFor }
}

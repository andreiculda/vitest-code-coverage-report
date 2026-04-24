<template>
    <div
        class="panel p-4"
        :class="statementsCardTintClass"
    >
        <div class="flex flex-col md:flex-row md:items-center md:gap-8 gap-4">
            <div class="flex-shrink-0 min-w-0">
                <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {{ scopeLabel }}
                </div>
                <div
                    v-if="folderPath"
                    class="text-sm font-mono text-slate-700 dark:text-slate-200 truncate max-w-[40ch]"
                    :title="folderPath"
                >
                    {{ folderPath }}
                </div>
                <div class="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {{ fileCount }} files
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                    {{ totals.statements.total }} statements · {{ totals.functions.total }} functions ·
                    {{ totals.branches.total }} branches · {{ totals.lines.total }} lines
                </div>
            </div>
            <div class="flex flex-wrap justify-around gap-6 flex-1">
                <DonutChart
                    label="Statements"
                    :coverage-percentage="totals.statements.coveragePercentage"
                    :covered="totals.statements.covered"
                    :total="totals.statements.total"
                />
                <DonutChart
                    label="Branches"
                    :coverage-percentage="totals.branches.coveragePercentage"
                    :covered="totals.branches.covered"
                    :total="totals.branches.total"
                />
                <DonutChart
                    label="Functions"
                    :coverage-percentage="totals.functions.coveragePercentage"
                    :covered="totals.functions.covered"
                    :total="totals.functions.total"
                />
                <DonutChart
                    label="Lines"
                    :coverage-percentage="totals.lines.coveragePercentage"
                    :covered="totals.lines.covered"
                    :total="totals.lines.total"
                />
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useThresholds } from '@/composables/useThresholds'
import type { TreeNode } from '@/types'
import { computed } from 'vue'
import DonutChart from './DonutChart.vue'

const {
    totals,
    fileCount,
    folderPath,
} = defineProps<{
    totals: TreeNode['aggregated']
    fileCount: number
    folderPath?: string
}>()

const { classify } = useThresholds()

const scopeLabel = computed(() => (folderPath ? 'Folder' : 'Project'))

const statementsCardTintClass = computed(() => {
    const kind = classify(totals.statements.coveragePercentage)
    if (kind === 'good') {
        return 'bg-[hsl(145_63%_42%_/_0.06)] dark:bg-[hsl(145_65%_36%_/_0.10)]'
    }
    if (kind === 'warning') {
        return 'bg-[hsl(35_92%_54%_/_0.075)] dark:bg-[hsl(35_90%_50%_/_0.12)]'
    }
    return 'bg-[hsl(0_84%_60%_/_0.08)] dark:bg-[hsl(0_72%_50%_/_0.13)]'
})
</script>
